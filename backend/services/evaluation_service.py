import json
import json5
import torch
import pandas as pd
from sklearn.metrics import mean_squared_error
from nltk.translate.bleu_score import sentence_bleu, SmoothingFunction
from difflib import SequenceMatcher
import nltk
import re

# Download necessary NLTK data (if not already downloaded)
nltk.download('punkt')

# --- Metrics Functions ---


def exact_match_accuracy(predicted, ground_truth):
    """
    Returns True if the predicted and ground truth objects are exactly the same.
    """
    return predicted == ground_truth


def field_level_accuracy(predicted, ground_truth):
    """
    Computes the proportion of fields in ground_truth that are exactly matched in predicted.
    Works for flat dicts. For nested dicts, you may want to flatten first.
    """
    if isinstance(predicted, dict) and isinstance(ground_truth, dict):
        total_fields = len(ground_truth)
        matched = sum(
            1 for k in ground_truth if k in predicted and predicted[k] == ground_truth[k])
        return matched / total_fields if total_fields > 0 else 0
    return 0


def levenshtein_distance(predicted, ground_truth):
    pred_str = json.dumps(predicted, sort_keys=True)
    truth_str = json.dumps(ground_truth, sort_keys=True)
    return 1 - SequenceMatcher(None, pred_str, truth_str).ratio()


def bleu_score(predicted, ground_truth):
    reference = [nltk.word_tokenize(json.dumps(ground_truth))]
    candidate = nltk.word_tokenize(json.dumps(predicted))
    smoothie = SmoothingFunction().method4
    return sentence_bleu(reference, candidate, smoothing_function=smoothie)


def f1_score_text(predicted, ground_truth):
    pred_tokens = nltk.word_tokenize(json.dumps(predicted))
    truth_tokens = nltk.word_tokenize(json.dumps(ground_truth))
    if not pred_tokens or not truth_tokens:
        return 0.0
    common = set(pred_tokens).intersection(set(truth_tokens))
    precision = len(common) / len(pred_tokens)
    recall = len(common) / len(truth_tokens)
    if precision + recall == 0:
        return 0.0
    return 2 * precision * recall / (precision + recall)


def mse_text(predicted, ground_truth):
    pred_tokens = [ord(c) for c in json.dumps(predicted)]
    truth_tokens = [ord(c) for c in json.dumps(ground_truth)]
    length = min(len(pred_tokens), len(truth_tokens))
    return mean_squared_error(truth_tokens[:length], pred_tokens[:length])

# --- JSON Extraction Helpers ---


def extract_valid_json(s):
    marker = "### Response:"
    if marker in s:
        s = s.split(marker, 1)[1]
    s = s.replace("```", "").strip()
    start = s.find("{")
    if start == -1:
        raise ValueError("No opening brace '{' found in the input.")

    counter = 0
    in_string = False
    escape = False
    end = -1
    for i in range(start, len(s)):
        ch = s[i]
        if ch == '"' and not escape:
            in_string = not in_string
        if not in_string:
            if ch == '{':
                counter += 1
            elif ch == '}':
                counter -= 1
                if counter == 0:
                    end = i
                    break
        if ch == '\\' and not escape:
            escape = True
        else:
            escape = False

    if end == -1:
        raise ValueError("No matching closing brace '}' found in the input.")
    return s[start:end+1]


def fix_unquoted_keys(s):
    pattern = r'(?<!")\b([A-Za-z_][A-Za-z0-9_\-]*)\b(?=\s*:)'
    return re.sub(pattern, r'"\1"', s)


def fix_unquoted_string_values(s):
    pattern = r'(:\s*)([A-Za-z][A-Za-z0-9_\-\/\. ]+?)([\s,\}])'
    return re.sub(pattern, r'\1"\2"\3', s)


def fix_json_format(s):
    s = re.sub(r'\s+', ' ', s)
    s = fix_unquoted_keys(s)
    s = fix_unquoted_string_values(s)
    return s.strip()


def complete_json(s, max_attempts=5):
    attempt = 0
    while attempt < max_attempts:
        try:
            json.loads(s)
            return s
        except Exception:
            s += " }"
            attempt += 1
    return s


def parse_json_safe(json_str):
    try:
        parsed = json.loads(json_str)
    except Exception:
        fixed_str = fix_json_format(json_str)
        fixed_str = complete_json(fixed_str)
        try:
            parsed = json5.loads(fixed_str)
        except Exception:
            return None
    return parsed


def normalize_json_values(obj):
    if isinstance(obj, dict):
        return {k: normalize_json_values(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [normalize_json_values(item) for item in obj]
    elif isinstance(obj, str):
        if obj.strip().upper() in {"N/A", "NAN", ""}:
            return None
        else:
            return obj
    else:
        return obj

# --- Main Evaluation Function ---


def evaluate_model_performance(ground_truth_record: dict, llm_output: dict):
    """
    Evaluates the performance of LLM's output against a ground truth record.
    Returns a dictionary with all metrics, including exact match and field-level accuracy.
    """
    metrics = {
        "exact_match": exact_match_accuracy(llm_output, ground_truth_record),
        "field_level_accuracy": field_level_accuracy(llm_output, ground_truth_record),
        "levenshtein": levenshtein_distance(llm_output, ground_truth_record),
        "bleu": bleu_score(llm_output, ground_truth_record),
        "f1": f1_score_text(llm_output, ground_truth_record),
        "mse": mse_text(llm_output, ground_truth_record)
    }
    return metrics

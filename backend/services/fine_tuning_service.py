def fine_tune_model(data):
    # Fine-tuning logic here
    return {"message": "Fine-tuning not implemented yet", "input": data}


def fine_tuning():
    # --- Imports ---
    from unsloth import FastLanguageModel, is_bfloat16_supported  # type: ignore
    from trl import SFTTrainer  # type: ignore
    from transformers import TrainingArguments
    from datasets import load_dataset
    import torch

    # --- Model config ---
    model_name = "unsloth/mistral-7b-v0.3-bnb-4bit"
    max_seq_length = 2048
    dtype = None
    load_in_4bit = True

    # --- Load model & tokenizer ---
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=model_name,
        max_seq_length=max_seq_length,
        dtype=dtype,
        load_in_4bit=load_in_4bit,
    )

    # --- Apply LoRA/PEFT ---
    model = FastLanguageModel.get_peft_model(
        model,
        r=16,
        target_modules=[
            "q_proj", "k_proj", "v_proj", "o_proj",
            "gate_proj", "up_proj", "down_proj"
        ],
        lora_alpha=16,
        lora_dropout=0,
        bias="none",
        use_gradient_checkpointing="unsloth",
        random_state=3407,
        use_rslora=False,
        loftq_config=None,
    )

    # --- Prompt template with escaped braces ---
    alpaca_prompt = """Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

### Instruction:
You must output a strictly valid JSON object with no extra text, markdown formatting, or comments. Your JSON object must have exactly the following keys and nested structure:
{{
  "invoice": {{
    "client_name": "<string>",
    "client_address": "<string>",
    "seller_name": "<string>",
    "seller_address": "<string>",
    "invoice_number": "<string>",
    "invoice_date": "<string>",
    "due_date": "<string>"
  }},
  "items": [
    {{
      "description": "<string>",
      "quantity": "<string>",
      "total_price": "<string>"
    }}
  ],
  "subtotal": {{
    "tax": "<string>",
    "discount": "<string>",
    "total": "<string>"
  }},
  "payment_instructions": {{
    "due_date": "<string>",
    "bank_name": "<string>",
    "account_number": "<string>",
    "payment_method": "<string>"
  }}
}}
- All property names and string values must be enclosed in double quotes.
- If a string value contains a double quote, escape it with a backslash (\").
- Numeric values that are not strictly numeric must be in quotes.
- Include commas between every key-value pair and array element.
- Do not include trailing commas.
- Output solely the JSON object as specified.

### Input:
{0}

### Response:
{1}"""

    EOS_TOKEN = tokenizer.eos_token

    # --- Formatting function ---
    def formatting_prompts_func(examples):
        inputs = examples["OCRed Text"]
        outputs = examples["Json data"]
        texts = []
        for inp, out in zip(inputs, outputs):
            prompt = alpaca_prompt.format(inp, out) + EOS_TOKEN
            texts.append(prompt)
        return {"text": texts}

    # --- Load and preprocess dataset ---
    dataset = load_dataset(
        "csv",
        data_files="/content/training-with-200-records.csv",
        split="train",
        encoding="ISO-8859-1"
    )
    dataset = dataset.map(formatting_prompts_func, batched=True)

    # --- Setup trainer ---
    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=dataset,
        dataset_text_field="text",
        max_seq_length=max_seq_length,
        dataset_num_proc=2,
        packing=False,
        args=TrainingArguments(
            per_device_train_batch_size=2,
            gradient_accumulation_steps=4,
            warmup_steps=5,
            max_steps=60,
            learning_rate=2e-4,
            fp16=not is_bfloat16_supported(),
            bf16=is_bfloat16_supported(),
            logging_steps=1,
            optim="adamw_8bit",
            weight_decay=0.01,
            lr_scheduler_type="linear",
            seed=3407,
            output_dir="outputs_mistral_finetune",
            report_to="none",
        ),
    )

    # --- Train ---
    stats = trainer.train()
    print("✅ Fine-tuning complete!")
    print(stats)

# Stubbed LLM service (not implemented)


def not_implemented(*args, **kwargs):
    pass

import os
import shutil
import requests
import subprocess


def extract_invoice_data(text):
    # LLM extraction logic here
    return {"message": "LLM extraction not implemented yet", "input": text}


def push_adapter_weights_to_github(tag="v1.3", release_name="LoRA Adapter Checkpoint 60"):
    # === CONFIG ===
    adapter_dir = "/content/outputs_mistral_finetune/checkpoint-60"
    temp_dir = "/content/lora_adapter_push"
    owner = "MAD-SAM22"
    repo = "fine-tunned-models-using-MLOPS"
    token = "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"
    repo_url = f"https://{token}@github.com/{owner}/{repo}.git"

    print("📦 Preparing adapter files...")
    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir)
    os.makedirs(temp_dir, exist_ok=True)

    # Only push small files to repo (under 100MB)
    small_files = [
        "adapter_config.json",
        "tokenizer.model",
        "tokenizer_config.json",
        "special_tokens_map.json",
    ]

    for file in small_files:
        src = os.path.join(adapter_dir, file)
        dst = os.path.join(temp_dir, file)
        if os.path.exists(src):
            shutil.copy(src, dst)
            print(f"✅ Copied: {file}")
        else:
            print(f"⚠️ Missing: {file}")

    # === Step 2: Git Init & Push ===
    os.chdir(temp_dir)
    subprocess.run(["git", "init"], check=True)
    subprocess.run(["git", "config", "--global", "user.email",
                   "ossfawzy1@gmail.com"], check=True)
    subprocess.run(["git", "config", "--global",
                   "user.name", "MAD-SAM22"], check=True)
    subprocess.run(["git", "add", "-A"], check=True)

    try:
        subprocess.run(
            ["git", "commit", "-m", "Push LoRA adapter config & tokenizer"], check=True)
    except subprocess.CalledProcessError:
        print("⚠️ No changes to commit.")

    subprocess.run(["git", "branch", "-M", "main"], check=True)
    subprocess.run(["git", "remote", "remove", "origin"], check=False)
    subprocess.run(["git", "remote", "add", "origin", repo_url], check=True)

    print("🚀 Pushing to GitHub...")
    result = subprocess.run(
        ["git", "push", "--force", "--set-upstream", "origin", "main"],
        capture_output=True, text=True
    )

    if result.returncode != 0:
        print("❌ Git push failed!")
        print("STDOUT:", result.stdout)
        print("STDERR:", result.stderr)
        return
    else:
        print("✅ Files pushed to GitHub.")

    # === Step 3: Create Release ===
    print(f"🏷️ Creating GitHub release '{tag}'...")
    api_url = f"https://api.github.com/repos/{owner}/{repo}/releases"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github+json"
    }

    payload = {
        "tag_name": tag,
        "target_commitish": "main",
        "name": release_name,
        "body": "Adapter weights and tokenizer. `adapter_model.safetensors` is uploaded as a release asset.",
        "draft": False,
        "prerelease": False
    }

    response = requests.post(api_url, headers=headers, json=payload)
    if response.status_code != 201:
        print(f"❌ Failed to create GitHub release ({response.status_code}):")
        print(response.json())
        return

    release_id = response.json()["id"]
    print(f"✅ Release created (ID: {release_id}). Uploading large files...")

    # === Step 4: Upload adapter_model.safetensors as release asset ===
    def upload_large_file_to_release(release_id, filepath, token):
        filename = os.path.basename(filepath)
        headers = {
            "Authorization": f"token {token}",
            "Content-Type": "application/octet-stream"
        }
        upload_url = f"https://uploads.github.com/repos/{owner}/{repo}/releases/{release_id}/assets?name={filename}"

        with open(filepath, "rb") as f:
            upload_resp = requests.post(upload_url, headers=headers, data=f)

        if upload_resp.status_code == 201:
            print(f"✅ Uploaded {filename} to release.")
        else:
            print(f"❌ Upload failed ({upload_resp.status_code})")
            print(upload_resp.json())

    safetensor_path = os.path.join(adapter_dir, "adapter_model.safetensors")
    if os.path.exists(safetensor_path):
        upload_large_file_to_release(release_id, safetensor_path, token)
    else:
        print("⚠️ adapter_model.safetensors not found for upload.")

    print("🎉 All done!")

# --- New: Install and load model from GitHub ---


def install_and_load_model_from_github(
    github_repo="https://github.com/MAD-SAM22/fine-tunned-models-using-MLOPS",
    github_token="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",
    model_class="unsloth/mistral-7b-v0.3-bnb-4bit"
):
    import os
    import requests
    import torch
    from transformers import AutoTokenizer
    from peft import PeftModel
    from unsloth import FastLanguageModel

    global model, tokenizer  # Keep loaded in memory

    owner = "MAD-SAM22"
    repo = "fine-tunned-models-using-MLOPS"
    model_dir = "/content/github_model"
    safetensor_path = f"{model_dir}/adapter_model.safetensors"

    # Clone the repo
    if not os.path.exists(model_dir):
        os.system(f"git clone {github_repo} {model_dir}")

    # Get latest release info
    def get_latest_release():
        url = f"https://api.github.com/repos/{owner}/{repo}/releases/latest"
        headers = {"Authorization": f"token {github_token}"}
        r = requests.get(url, headers=headers)
        return r.json() if r.status_code == 200 else None

    latest_release = get_latest_release()
    if not latest_release:
        print("❌ Could not fetch latest release.")
        return

    # Download safetensors file
    def download_safetensors():
        for asset in latest_release.get("assets", []):
            if asset["name"] == "adapter_model.safetensors":
                url = asset["browser_download_url"]
                print("⬇️ Downloading adapter_model.safetensors...")
                with requests.get(url, headers={"Authorization": f"token {github_token}"}, stream=True) as r:
                    r.raise_for_status()
                    with open(safetensor_path, "wb") as f:
                        for chunk in r.iter_content(chunk_size=8192):
                            f.write(chunk)
                print("✅ Download complete.")
                return True
        return False

    if not os.path.exists(safetensor_path):
        if not download_safetensors():
            print("❌ adapter_model.safetensors not found.")
            return

    # Step 3: Load base model and LoRA adapter
    print("📦 Loading base model...")
    base_model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=model_class,
        max_seq_length=2048,
        dtype=None,
        load_in_4bit=True,
    )
    base_model = FastLanguageModel.get_peft_model(base_model)

    print("🔗 Attaching LoRA weights from GitHub...")
    model = PeftModel.from_pretrained(base_model, model_dir).eval()

    # tokenize input (Make sure tokenizer is ready)
    if tokenizer.pad_token is None:
        tokenizer.add_special_tokens({"pad_token": "<pad>"})
        model.resize_token_embeddings(len(tokenizer))

    print("✅ Model & tokenizer ready for inference.")


def run_llm_inference(instruction_text, input_text):
    import torch

    global model, tokenizer  # Use previously loaded

    if model is None or tokenizer is None:
        print("❌ Model not loaded. Please run install_and_load_model_from_github() first.")
        return

    # Format prompt-Prompt setup (Alpaca style)
    alpaca_prompt = f"""Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

### Instruction:
{instruction_text}

### Input:
{input_text}

### Response:
"""

    device = "cuda" if torch.cuda.is_available() else "cpu"
    inputs = tokenizer(
        [alpaca_prompt],
        return_tensors="pt",
        padding=True,
        truncation=True,
        max_length=model.config.max_position_embeddings
    ).to(device)

    # Generate
    output = model.generate(
        **inputs,
        max_new_tokens=1024,
        do_sample=True,
        temperature=0.7,
        top_k=50
    )

    # Decode
    decoded_output = tokenizer.decode(output[0], skip_special_tokens=True)
    print("✅ Model Output:\n")
    print(decoded_output)
    return decoded_output

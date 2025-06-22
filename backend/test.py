import os
from doctr.io import DocumentFile
from doctr.models import ocr_predictor


def test_doctr_ocr():
    """Simple test function for docTR OCR"""

    # Your image path
    image_path = "E:/Grad/Grad_final/docu-extract-ai/backend/test.jpg"

    print("DocTR OCR Test")
    print("-" * 40)

    # Check if file exists
    if not os.path.exists(image_path):
        print(f"❌ Error: File not found at {image_path}")
        return None

    print(f"✅ File found: {image_path}")

    try:
        # Initialize the OCR predictor
        print("🔄 Loading OCR model...")
        model = ocr_predictor(pretrained=True)
        print("✅ Model loaded successfully")

        # Load the document/image
        print("🔄 Loading image...")
        doc = DocumentFile.from_images(image_path)
        print(f"✅ Image loaded - Pages: {len(doc)}")

        # Perform OCR
        print("🔄 Running OCR...")
        result = model(doc)

        # Check if result is None
        if result is None:
            print("❌ OCR returned None")
            return None

        print("✅ OCR completed successfully")

        # Extract and display text
        print("\n" + "="*50)
        print("EXTRACTED TEXT:")
        print("="*50)

        # Get text from all pages
        full_text = ""
        for page_idx, page in enumerate(result.pages):
            print(f"\n--- Page {page_idx + 1} ---")
            page_text = ""
            for block in page.blocks:
                for line in block.lines:
                    line_text = " ".join([word.value for word in line.words])
                    page_text += line_text + " "
                    print(line_text)
            full_text += page_text

        print(f"\n" + "="*50)
        print(f"SUMMARY:")
        print(f"Total characters extracted: {len(full_text)}")
        print(f"Total words extracted: {len(full_text.split())}")

        # Export to dictionary for further processing
        result_dict = result.export()
        print(f"Export successful: {type(result_dict)}")

        return result_dict

    except Exception as e:
        print(f"❌ Error occurred: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        return None

# Additional debugging function


def debug_doctr_setup():
    """Debug function to check docTR setup"""

    print("DocTR Debug Information")
    print("-" * 40)

    try:
        import doctr
        print(f"✅ DocTR version: {doctr.__version__}")
    except Exception as e:
        print(f"❌ DocTR import error: {e}")
        return

    try:
        import torch
        print(f"✅ PyTorch version: {torch.__version__}")
        print(f"✅ CUDA available: {torch.cuda.is_available()}")
        if torch.cuda.is_available():
            print(f"✅ CUDA device: {torch.cuda.get_device_name(0)}")
    except ImportError:
        print("⚠️  PyTorch not found")

    try:
        import tensorflow as tf
        print(f"✅ TensorFlow version: {tf.__version__}")
    except ImportError:
        print("⚠️  TensorFlow not found")


if __name__ == "__main__":
    # Run debug first
    debug_doctr_setup()
    print("\n")

    # Run the main test
    result = test_doctr_ocr()

    if result:
        print("\n🎉 Test completed successfully!")
    else:
        print("\n❌ Test failed - check the errors above")

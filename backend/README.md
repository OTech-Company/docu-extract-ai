# OCR Backend API (Flask)

This backend provides an API for running OCR (Optical Character Recognition) on images using four different models:

- **PaddleOCR**
- **Tesseract**
- **EasyOCR**
- **DocTR**

## API Endpoint

`POST /ocr`

**Request JSON:**

```
{
  "image": "<base64-encoded-image>",
  "model": "paddle" | "tesseract" | "easy" | "doctr"
}
```

**Response JSON:**

```
{
  "text": "...extracted text...",
  "confidence": 0.95
}
```

## Setup

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the server:
   ```bash
   python app.py
   ```

## Requirements

- Python 3.8+
- See `requirements.txt` for Python packages

## Notes

- The API expects a base64-encoded image (JPEG/PNG).
- Each model may have different accuracy and speed.
- You can test the API using Postman or `curl`.

---

For more details, see the code in `app.py`.

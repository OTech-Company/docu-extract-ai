import base64
import io
from PIL import Image
import numpy as np
import cv2
import pytesseract
import easyocr
from paddleocr import PaddleOCR
from doctr.models import ocr_predictor
from doctr.io import DocumentFile

# Global OCR instances
_paddle_ocr = None
_easy_ocr = None
_doctr_ocr = None


def decode_image(base64_str):
    image_data = base64.b64decode(base64_str)
    return Image.open(io.BytesIO(image_data)).convert('RGB')


def get_paddle_ocr():
    global _paddle_ocr
    if _paddle_ocr is None:
        _paddle_ocr = PaddleOCR(lang='en')
    return _paddle_ocr


def get_easy_ocr():
    global _easy_ocr
    if _easy_ocr is None:
        _easy_ocr = easyocr.Reader(['en'])
    return _easy_ocr


def get_doctr_ocr():
    global _doctr_ocr
    if _doctr_ocr is None:
        _doctr_ocr = ocr_predictor(pretrained=True)
    return _doctr_ocr


def tesseract_ocr_process(image):
    img = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2GRAY)
    img = cv2.adaptiveThreshold(img, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                cv2.THRESH_BINARY, 11, 2)
    text = pytesseract.image_to_string(Image.fromarray(img))
    return text.strip(), 0.0


def easy_ocr_process(image):
    ocr = get_easy_ocr()
    result = ocr.readtext(np.array(image))
    text = ' '.join([r[1] for r in result])
    confs = [r[2] for r in result]
    return text.strip(), float(np.mean(confs)) if confs else 0.0


def paddle_ocr_process(image):
    ocr = get_paddle_ocr()
    bgr = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    result = ocr.ocr(bgr)
    if not result or not result[0]:
        return '', 0.0
    texts = []
    confidences = []
    for line in result[0]:
        bbox, (text, confidence) = line
        if text and text.strip():
            texts.append(text.strip())
            confidences.append(confidence)
    if not texts:
        return '', 0.0
    combined_text = '\n'.join(texts)
    avg_confidence = np.mean(confidences)
    return combined_text, float(avg_confidence)


def doctr_ocr_process(image):
    ocr = get_doctr_ocr()
    doc = DocumentFile.from_images([np.array(image.convert("RGB"))])
    result = ocr(doc)
    lines = [
        w.value for p in result.pages for b in p.blocks for l in b.lines for w in l.words]
    return ' '.join(lines).strip(), 0.0

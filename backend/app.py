from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import pytesseract
import easyocr
import cv2
import base64
import io
import numpy as np

from paddleocr import PaddleOCR
from doctr.models import ocr_predictor
from doctr.io import DocumentFile

# Set tesseract path if needed
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

app = Flask(__name__)
CORS(app)

# Global OCR instances
paddle_ocr = None
easy_ocr = None
doctr_ocr = None


def get_paddle_ocr():
    global paddle_ocr
    if paddle_ocr is None:
        print("[INFO] Loading PaddleOCR...", flush=True)
        paddle_ocr = PaddleOCR(use_angle_cls=True, lang='en')
    return paddle_ocr


def get_easy_ocr():
    global easy_ocr
    if easy_ocr is None:
        print("[INFO] Loading EasyOCR...", flush=True)
        easy_ocr = easyocr.Reader(['en'])
    return easy_ocr


def get_doctr_ocr():
    global doctr_ocr
    if doctr_ocr is None:
        print("[INFO] Loading DocTR...", flush=True)
        doctr_ocr = ocr_predictor(pretrained=True)
    return doctr_ocr


def decode_image(base64_str):
    image_data = base64.b64decode(base64_str)
    return Image.open(io.BytesIO(image_data)).convert('RGB')


@app.route('/ocr', methods=['POST'])
def ocr_endpoint():
    try:
        data = request.get_json()
        image = decode_image(data['image'])
        model = data['model'].strip().lower()
        print(f"[INFO] Model requested: {model}", flush=True)

        if model == 'tesseract':
            img = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2GRAY)
            img = cv2.adaptiveThreshold(img, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                        cv2.THRESH_BINARY, 11, 2)
            text = pytesseract.image_to_string(Image.fromarray(img))
            return jsonify({'text': text.strip(), 'confidence': 0.0})

        elif model == 'easy':
            ocr = get_easy_ocr()
            result = ocr.readtext(np.array(image))
            text = ' '.join([r[1] for r in result])
            confs = [r[2] for r in result]
            return jsonify({'text': text.strip(), 'confidence': float(np.mean(confs)) if confs else 0.0})

        elif model == 'paddle':
            ocr = get_paddle_ocr()
            bgr = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            result = ocr.ocr(bgr, cls=True)
            print("[INFO] PaddleOCR Result:", result, flush=True)
            if not result or not result[0]:
                return jsonify({'text': '', 'confidence': 0.0, 'note': 'No text found'})
            text = '\n'.join([line[1][0] for line in result[0]])
            conf = np.mean([line[1][1] for line in result[0]])
            return jsonify({'text': text.strip(), 'confidence': float(conf)})

        elif model == 'doctr':
            ocr = get_doctr_ocr()
            doc = DocumentFile.from_images([np.array(image)])
            result = ocr(doc)
            lines = [
                w.value for p in result.pages for b in p.blocks for l in b.lines for w in l.words]
            return jsonify({'text': ' '.join(lines).strip(), 'confidence': 0.0})

        return jsonify({'error': 'Unknown model'}), 400

    except Exception as e:
        print(f"[ERROR] {e}", flush=True)
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

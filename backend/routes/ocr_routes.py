from flask import Blueprint, request, jsonify
from services.ocr_service import (
    decode_image,
    tesseract_ocr_process,
    easy_ocr_process,
    paddle_ocr_process,
    doctr_ocr_process
)

ocr_bp = Blueprint('ocr', __name__, url_prefix='/ocr')


@ocr_bp.route('', methods=['POST'])
def ocr_endpoint():
    data = request.get_json()
    image_b64 = data.get('image')
    model = data.get('model', '').strip().lower()
    if not image_b64 or not model:
        return jsonify({'error': 'Missing image or model'}), 400
    image = decode_image(image_b64)
    if model == 'tesseract':
        text, confidence = tesseract_ocr_process(image)
    elif model == 'easy':
        text, confidence = easy_ocr_process(image)
    elif model == 'paddle':
        text, confidence = paddle_ocr_process(image)
    elif model == 'doctr':
        text, confidence = doctr_ocr_process(image)
    else:
        return jsonify({'error': 'Unknown model'}), 400
    return jsonify({'text': text, 'confidence': confidence})

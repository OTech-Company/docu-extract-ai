from flask import Blueprint, request, send_file, jsonify
import os
import tempfile
import cv2
from services.img_preprocessing_service import preprocess_image

img_preprocess_bp = Blueprint(
    'img_preprocess', __name__, url_prefix='/img-preprocess')


@img_preprocess_bp.route('', methods=['POST'])
def img_preprocess_endpoint():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    with tempfile.TemporaryDirectory() as tmpdir:
        input_path = os.path.join(tmpdir, file.filename)
        file.save(input_path)
        output_path = os.path.join(tmpdir, 'preprocessed.png')
        preprocess_image(input_path, save_output=True, output_path=output_path)
        return send_file(output_path, mimetype='image/png', as_attachment=True, download_name='preprocessed.png')

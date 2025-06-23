from flask import Blueprint, request, send_file, jsonify
import os
import tempfile
import cv2
from services.img_preprocessing_service import preprocess_image
from io import BytesIO
import base64

img_preprocess_bp = Blueprint(
    'img_preprocess', __name__, url_prefix='/img-preprocess')


@img_preprocess_bp.route('', methods=['POST'])
def img_preprocess_endpoint():
    print("Request received")
    if 'image' not in request.files:
        print("No image in request.files")
        return jsonify({'error': 'No image file provided'}), 400
    file = request.files['image']
    print("File received:", file.filename)
    if file.filename == '':
        print("Empty filename")
        return jsonify({'error': 'No selected file'}), 400
    with tempfile.TemporaryDirectory() as tmpdir:
        input_path = os.path.join(tmpdir, file.filename)
        file.save(input_path)
        print("File saved to", input_path)
        output_path = os.path.join(tmpdir, 'preprocessed.png')
        grayscale_path = os.path.join(tmpdir, 'grayscale.png')
        try:
            preprocess_image(input_path, save_output=True,
                             output_path=output_path, grayscale_path=grayscale_path)
            print("Image preprocessed, sending files")
            # Read both images as base64
            with open(grayscale_path, 'rb') as f:
                grayscale_bytes = f.read()
                grayscale_b64 = base64.b64encode(
                    grayscale_bytes).decode('utf-8')
            with open(output_path, 'rb') as f:
                processed_bytes = f.read()
                processed_b64 = base64.b64encode(
                    processed_bytes).decode('utf-8')
            return jsonify({
                'grayscale': grayscale_b64,
                'processed': processed_b64
            })
        except Exception as e:
            print("Error during preprocessing:", e)
            return jsonify({'error': str(e)}), 500

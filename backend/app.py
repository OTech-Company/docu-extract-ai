from flask import Flask
from flask_cors import CORS
from routes.ocr_routes import ocr_bp
from routes.img_preprocessing_routes import img_preprocess_bp

app = Flask(__name__)
CORS(app)
app.register_blueprint(ocr_bp)
app.register_blueprint(img_preprocess_bp)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

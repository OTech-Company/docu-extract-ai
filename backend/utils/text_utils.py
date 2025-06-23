import logging
from flask import Blueprint, request, jsonify, send_file
from config import Config
from services.evaluation_service import evaluate_model_performance, get_csv_file

evaluation_bp = Blueprint('evaluation', __name__, url_prefix='/evaluation')


@evaluation_bp.route('/metrics', methods=['POST'])
def get_evaluation_metrics():
    # ... (see your example for full implementation) ...
    pass


@evaluation_bp.route('/download_csv', methods=['GET'])
def download_data_csv():
    # ... (see your example for full implementation) ...
    pass


def clean_text(text):
    # Text cleaning logic here
    return text.strip()

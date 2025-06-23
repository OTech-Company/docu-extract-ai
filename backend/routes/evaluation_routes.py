from flask import Blueprint, request, jsonify
from backend.services.evaluation_service import evaluate_results

evaluation_bp = Blueprint('evaluation', __name__)


@evaluation_bp.route('/evaluate', methods=['POST'])
def evaluate_endpoint():
    data = request.get_json()
    ocr_result = data.get('ocr_result')
    llm_result = data.get('llm_result')
    result = evaluate_results(ocr_result, llm_result)
    return jsonify(result)

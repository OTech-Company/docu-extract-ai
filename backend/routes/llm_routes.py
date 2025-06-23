from flask import Blueprint, request, jsonify
from backend.services.llm_service import extract_invoice_data

llm_bp = Blueprint('llm', __name__)


@llm_bp.route('/llmops', methods=['POST'])
def llmops_endpoint():
    data = request.get_json()
    text = data.get('text', '')
    result = extract_invoice_data(text)
    return jsonify(result)

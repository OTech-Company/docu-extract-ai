# from .llm_routes import llm_bp
# from .evaluation_routes import evaluation_bp
from .ocr_routes import ocr_bp


def register_routes(app):
    # app.register_blueprint(llm_bp)
    # app.register_blueprint(evaluation_bp)
    app.register_blueprint(ocr_bp)

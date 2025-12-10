"""EFAS Flask application factory."""

import logging
import os
from pathlib import Path

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

from app.config import Config
from app.models import db, jwt, migrate


def create_app(config_class=Config):
    """
    Create and configure the Flask application.
    """
    # Get the base directory (backend directory)
    base_dir = Path(__file__).parent.parent
    static_folder = base_dir / "app" / "static"
    
    app = Flask(
        __name__,
        static_folder=str(static_folder),
        static_url_path="",
    )
    app.config.from_object(config_class)

    app.url_map.strict_slashes = False

    # Configure logging
    logging.basicConfig(level=logging.INFO, format="%(asctime)s: %(message)s")

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    # Configure CORS for all environments
    CORS(app, 
        origins=app.config.get("CORS_ORIGINS", ["http://localhost:5173", "http://localhost:5000", "http://127.0.0.1:5000"]),
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
        supports_credentials=True,
        expose_headers=["Set-Cookie"],
        allow_credentials=True)

    # Register API blueprints FIRST (before catch-all route)
    from app.routes.auth import auth_bp
    from app.routes.evacuation_centers import evacuation_center_bp
    from app.routes.events import event_bp
    from app.routes.households import households_bp
    from app.routes.user import user_bp
    from app.routes.attendance_records import attendance_record_bp
    from app.routes.distribution import bp as distribution_bp


    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(households_bp, url_prefix="/api")
    app.register_blueprint(event_bp, url_prefix="/api")
    app.register_blueprint(evacuation_center_bp, url_prefix="/api")
    app.register_blueprint(user_bp, url_prefix="/api")
    app.register_blueprint(attendance_record_bp, url_prefix="/api")
    app.register_blueprint(distribution_bp, url_prefix="/api")

    

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_react_app(path):
        if path.startswith("api/"):
            return jsonify({"error": "Not found"}), 404
        
        if path:
            static_file_path = static_folder / path
            if static_file_path.exists() and static_file_path.is_file():
                return send_from_directory(str(static_folder), path)

        index_path = static_folder / "index.html"
        if index_path.exists():
            return send_from_directory(str(static_folder), "index.html")
        
        return jsonify({"error": "Static files not found. Please build the frontend first."}), 404

    return app

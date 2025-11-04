"""EFAS Flask application factory."""

import logging

from flask import Flask
from flask_cors import CORS

from app.config import Config
from app.models import db, jwt, migrate


def create_app(config_class=Config):
    """
    Create and configure the Flask application.
    """
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Configure logging
    logging.basicConfig(level=logging.INFO, format="%(asctime)s: %(message)s")

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(
        app,
        origins=["http://localhost:5173"],
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
    )

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.households import households_bp
    from app.routes.evacuation_centers import evacuation_center_bp
    from app.routes.individuals import individuals_bp # <-- THIS LINE WAS MISSING

    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(households_bp, url_prefix="/api")
    app.register_blueprint(evacuation_center_bp, url_prefix="/api")
    app.register_blueprint(individuals_bp, url_prefix="/api") # <-- THIS LINE WAS MISSING

    return app
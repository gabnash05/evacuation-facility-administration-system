"""EFAS Flask application factory."""

from flask import Flask
from flask_cors import CORS
from app.models import db, migrate, jwt
from app.config import Config
import logging


def create_app(config_class=Config):
    """
    Create and configure the Flask application.
    
    Args:
        config_class: Configuration class to use
        
    Returns:
        Flask: Configured Flask application
    """
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s: %(message)s'
    )
    
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app, 
        origins=["http://localhost:5173"],
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"]
    )

    # Register blueprints
    from app.routes.auth import auth_bp
    # from app.routes.events import events_bp
    # from app.routes.centers import centers_bp
    # from app.routes.households import households_bp
    # from app.routes.individuals import individuals_bp

    app.register_blueprint(auth_bp, url_prefix='/api')
    # app.register_blueprint(events_bp)
    # app.register_blueprint(centers_bp)
    # app.register_blueprint(households_bp)
    # app.register_blueprint(individuals_bp)

    return app
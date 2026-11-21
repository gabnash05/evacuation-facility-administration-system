"""Production WSGI entry point for EFAS."""

from app import create_app
from app.config import ProductionConfig

app = create_app(ProductionConfig())

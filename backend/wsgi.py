"""Production WSGI entry point for EFAS."""

from app import create_app

app = create_app()

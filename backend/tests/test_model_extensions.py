"""Regression tests for shared database-extension bootstrap ownership."""

import unittest

from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

from app.models import db, jwt, migrate


class ModelExtensionTests(unittest.TestCase):
    def test_model_package_exports_initialized_extension_instances(self):
        self.assertIsInstance(db, SQLAlchemy)
        self.assertIsInstance(migrate, Migrate)
        self.assertIsInstance(jwt, JWTManager)

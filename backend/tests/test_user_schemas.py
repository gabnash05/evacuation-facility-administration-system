"""Regression tests for user role and center contract validation."""

import unittest

from marshmallow import ValidationError

from app.schemas.user import UserCreateSchema, UserRegisterSchema


class UserSchemaTests(unittest.TestCase):
    def test_center_roles_require_an_assigned_center(self):
        with self.assertRaises(ValidationError):
            UserCreateSchema().load(
                {
                    "email": "center@example.test",
                    "password": "secret123",
                    "role": "center_admin",
                }
            )

    def test_global_roles_reject_center_assignment(self):
        with self.assertRaises(ValidationError):
            UserRegisterSchema().load(
                {
                    "email": "city@example.test",
                    "password": "secret123",
                    "role": "city_admin",
                    "center_id": 9,
                }
            )

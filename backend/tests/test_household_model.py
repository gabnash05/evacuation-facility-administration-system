"""Regression tests for household persistence response mapping."""

from unittest.mock import Mock, patch

from app.models.household import Household
from tests.api_test_case import ApiTestCase


class HouseholdModelTests(ApiTestCase):
    def test_detail_preserves_household_and_center_fields_with_distinct_aliases(self):
        row = Mock()
        row._asdict.return_value = {
            "household_id": 4,
            "household_name": "Santos household",
            "household_address": "Household address",
            "household_center_id": 2,
            "household_head_id": 8,
            "household_created_at": "household-created",
            "household_updated_at": "household-updated",
            "center_center_id": 2,
            "center_name": "Center One",
            "center_address": "Center address",
            "center_coordinates": "POINT(1 2)",
            "center_capacity": 100,
            "center_status": "active",
            "center_current_occupancy": 20,
            "center_photo_data": "photo",
            "center_created_at": "center-created",
            "center_updated_at": "center-updated",
        }

        with self.app.app_context():
            with patch("app.models.household.db.session.execute") as execute:
                execute.return_value.fetchone.return_value = row

                result = Household.get_by_id(4)

        self.assertEqual(result["address"], "Household address")
        self.assertEqual(result["created_at"], "household-created")
        self.assertEqual(
            result["center"],
            {
                "center_id": 2,
                "center_name": "Center One",
                "address": "Center address",
                "coordinates": "POINT(1 2)",
                "capacity": 100,
                "status": "active",
                "current_occupancy": 20,
                "photo_data": "photo",
                "created_at": "center-created",
                "updated_at": "center-updated",
            },
        )

        query, parameters = execute.call_args.args
        self.assertIn("h.address AS household_address", str(query))
        self.assertIn("ec.address AS center_address", str(query))
        self.assertEqual(parameters, {"id": 4})

    def test_detail_returns_none_when_the_household_does_not_exist(self):
        with self.app.app_context():
            with patch("app.models.household.db.session.execute") as execute:
                execute.return_value.fetchone.return_value = None

                result = Household.get_by_id(404)

        self.assertIsNone(result)

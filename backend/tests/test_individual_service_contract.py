import unittest
from unittest.mock import patch

from app.services.individual_service import IndividualService
from app.services.household_service import HouseholdService
from tests.api_test_case import ApiTestCase


class IndividualServiceContractTests(ApiTestCase):
    def test_create_service_preserves_validated_household_identifier(self):
        data = {
            "household_id": 2,
            "first_name": "Ana",
            "last_name": "Cruz",
            "relationship_to_head": "Child",
        }
        with self.app.app_context():
            with patch("app.services.individual_service.Individual.create") as create, patch(
                "app.services.individual_service.db.session.commit"
            ), patch(
                "app.services.individual_service.Individual.get_by_id",
                return_value={"individual_id": 1},
            ):
                create.return_value = {"individual_id": 1}

                result = IndividualService.create_individual(data)

        self.assertTrue(result["success"])
        self.assertEqual(create.call_args.args[0]["household_id"], 2)

    @patch("app.services.household_service.Household.get_by_name")
    def test_household_service_rejects_invalid_nested_members(self, get_by_name):
        result, status = HouseholdService.create_household_with_individuals(
            {
                "household_name": "Santos household",
                "address": "Barangay One, City",
                "center_id": 1,
                "individuals": [],
            }
        )

        self.assertEqual(status, 400)
        self.assertFalse(result["success"])
        get_by_name.assert_not_called()

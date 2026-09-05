import unittest
from unittest.mock import patch

from app.services.individual_service import IndividualService
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

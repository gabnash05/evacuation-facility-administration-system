"""Regression tests for household persistence response mapping."""

from unittest.mock import Mock, patch

from app.models.household import Household
from app.models.individual import Individual
from app.services.household_service import HouseholdService
from tests.api_test_case import ApiTestCase


class HouseholdModelTests(ApiTestCase):
    @patch("app.services.household_service.Household")
    def test_invalid_nested_member_is_rejected_before_persistence(self, household):
        result, status = HouseholdService.update_household(
            4, {"individuals": [{"first_name": "Incomplete"}]}
        )
        self.assertEqual(status, 400)
        self.assertFalse(result["success"])
        household.get_by_id.assert_not_called()

    @patch("app.services.household_service.Household")
    def test_invalid_household_fields_are_rejected_before_persistence(self, household):
        result, status = HouseholdService.update_household(4, {"center_id": -1})

        self.assertEqual(status, 400)
        self.assertFalse(result["success"])
        household.get_by_id.assert_not_called()

    @patch("app.services.household_service.db")
    @patch("app.services.household_service.Household")
    def test_update_rejects_head_from_another_household(self, household, database):
        household.get_by_id.return_value = {"household_name": "Santos household"}
        household.get_by_name.return_value = None
        database.session.execute.return_value.fetchone.return_value = None

        result, status = HouseholdService.update_household(4, {"household_head_id": 99})

        self.assertEqual(status, 400)
        self.assertFalse(result["success"])
        household.update.assert_not_called()
        query, params = database.session.execute.call_args.args
        self.assertIn("household_id = :household_id", str(query))
        self.assertEqual(params, {"head_id": 99, "household_id": 4})

    @patch("app.models.individual.db")
    def test_member_writes_bind_expected_household(self, database):
        Individual.update(8, {"first_name": "A"}, household_id=4)
        query, params = database.session.execute.call_args.args
        self.assertIn("household_id = :expected_household_id", str(query))
        self.assertEqual(params["expected_household_id"], 4)

        Individual.delete_by_ids([8], household_id=4)
        query, params = database.session.execute.call_args.args
        self.assertIn("household_id = :expected_household_id", str(query))
        self.assertEqual(params["expected_household_id"], 4)

    @patch("app.models.individual.db")
    def test_member_read_propagates_database_failure(self, database):
        database.session.execute.side_effect = RuntimeError("read failed")

        with self.assertRaisesRegex(RuntimeError, "read failed"):
            Individual.get_by_household_id(4)

    @patch("app.services.household_service.db")
    @patch("app.services.household_service.Individual")
    @patch("app.services.household_service.Household")
    def test_member_read_failure_aborts_update(self, household, individual, database):
        household.get_by_id.return_value = {"household_name": "Santos household"}
        household.get_by_name.return_value = None
        individual.get_by_household_id.side_effect = RuntimeError("read failed")

        result, status = HouseholdService.update_household(4, {"individuals": []})

        self.assertEqual(status, 500)
        self.assertFalse(result["success"])
        household.update.assert_not_called()
        database.session.commit.assert_not_called()
        database.session.rollback.assert_called_once_with()

    @patch("app.services.household_service.db")
    @patch("app.services.household_service.Individual")
    @patch("app.services.household_service.Household")
    def test_member_write_failures_abort_aggregate_update(
        self, household, individual, database
    ):
        household.get_by_id.return_value = {"household_name": "Santos household"}
        household.get_by_name.return_value = None
        household.update.return_value = {"household_id": 4}
        individual.get_by_household_id.return_value = [{"individual_id": 8}]

        for members, method, failure in (
            ([], "delete_by_ids", 0),
            ([{"individual_id": 8}], "update", None),
            (
                [
                    {"individual_id": 8},
                    {
                        "first_name": "New",
                        "last_name": "Person",
                        "relationship_to_head": "Child",
                    },
                ],
                "create",
                None,
            ),
        ):
            individual.reset_mock()
            database.reset_mock()
            individual.update.return_value = {"individual_id": 8}
            getattr(individual, method).return_value = failure
            result, status = HouseholdService.update_household(
                4, {"individuals": members}
            )
            self.assertEqual(status, 500)
            self.assertFalse(result["success"])
            database.session.commit.assert_not_called()
            database.session.rollback.assert_called_once_with()

    @patch("app.services.household_service.Individual")
    @patch("app.services.household_service.Household")
    def test_update_rejects_foreign_and_duplicate_members_before_writes(
        self, household, individual
    ):
        household.get_by_id.return_value = {"household_name": "Santos household"}
        household.get_by_name.return_value = None
        individual.get_by_household_id.return_value = [{"individual_id": 8}]

        for members in ([{"individual_id": 9}], [{"individual_id": 8}] * 2):
            result, status = HouseholdService.update_household(
                4, {"household_name": "Santos household", "individuals": members}
            )
            self.assertEqual(status, 400)
            self.assertFalse(result["success"])

        household.update.assert_not_called()
        individual.update.assert_not_called()
        individual.delete_by_ids.assert_not_called()

    @patch("app.services.household_service.db")
    @patch("app.services.household_service.Individual")
    @patch("app.services.household_service.Household")
    def test_update_without_individuals_preserves_household_members(
        self, household, individual, database
    ):
        household.get_by_id.return_value = {
            "household_name": "Santos household",
            "address": "Existing address",
            "center_id": 2,
            "household_head_id": 8,
        }
        household.get_by_name.return_value = None
        household.update.return_value = {"household_id": 4}

        result, status = HouseholdService.update_household(
            4, {"household_name": "Santos household"}
        )

        self.assertEqual(status, 200)
        self.assertTrue(result["success"])
        individual.get_by_household_id.assert_not_called()
        individual.delete_by_ids.assert_not_called()
        household.set_head.assert_not_called()
        self.assertEqual(household.update.call_args.args[1]["household_head_id"], 8)
        self.assertEqual(
            household.update.call_args.args[1]["address"], "Existing address"
        )
        database.session.commit.assert_called_once_with()

    def test_update_rejects_null_individuals(self):
        result, status = HouseholdService.update_household(
            4, {"household_name": "Santos household", "individuals": None}
        )
        self.assertEqual(status, 400)
        self.assertFalse(result["success"])

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

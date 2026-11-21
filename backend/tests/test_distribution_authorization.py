from types import SimpleNamespace
from unittest.mock import patch

from sqlalchemy.exc import SQLAlchemyError

from app.models.distribution import DistributionSession
from app.services.distribution_service import DistributionService
from tests.api_test_case import ApiTestCase


def user(role="volunteer", center_id=2, user_id=7):
    return SimpleNamespace(
        role=role, center_id=center_id, user_id=user_id, is_active=True
    )


def returned_row(values):
    return SimpleNamespace(fetchone=lambda: SimpleNamespace(_asdict=lambda: values))


class DistributionAuthorizationTests(ApiTestCase):
    @patch("app.services.distribution_service.Distribution.update_status")
    @patch("app.services.distribution_service.Allocation.update_quantity")
    @patch("app.services.distribution_service.Distribution.get_by_id")
    def test_status_failure_rolls_back_stock(
        self, get_by_id, update_quantity, update_status
    ):
        get_by_id.return_value = {
            "status": "completed",
            "allocation_id": 2,
            "quantity_distributed": 1,
        }
        update_status.side_effect = RuntimeError("Private database details")
        with self.app.app_context():
            with patch("app.services.distribution_service.db.session") as session:
                result, status = DistributionService.toggle_status(7)

        self.assertEqual(status, 500)
        self.assertNotIn("Private database details", result["message"])
        get_by_id.assert_called_once_with(7, for_update=True)
        update_quantity.assert_called_once_with(2, 1, "add")
        update_status.assert_called_once_with(7, "voided")
        session.rollback.assert_called_once_with()
        session.commit.assert_not_called()

    @patch("app.routes.distribution.User.get_by_id")
    @patch("app.routes.distribution.DistributionService.get_history")
    def test_history_requires_a_center_for_center_scoped_roles(
        self, history, get_by_id
    ):
        for role in ("center_admin", "volunteer"):
            with self.subTest(role=role):
                get_by_id.return_value = user(role=role, center_id=None)
                response = self.client.get(
                    "/api/distributions/history", headers=self.authorization_headers(7)
                )

                self.assertEqual(response.status_code, 403)
                self.assertEqual(
                    response.json["message"], "No center assigned to this account"
                )
        history.assert_not_called()

    @patch("app.routes.distribution.User.get_by_id")
    @patch("app.routes.distribution.DistributionService.get_history")
    def test_history_passes_the_assigned_center_for_center_scoped_roles(
        self, history, get_by_id
    ):
        history.return_value = ({"success": True}, 200)
        for role in ("center_admin", "volunteer"):
            with self.subTest(role=role):
                get_by_id.return_value = user(role=role, center_id=2)
                response = self.client.get(
                    "/api/distributions/history",
                    query_string={"center_id": 3},
                    headers=self.authorization_headers(7),
                )

                self.assertEqual(response.status_code, 200)
                self.assertEqual(history.call_args.args[0]["center_id"], 2)

    @patch("app.routes.distribution.User.get_by_id")
    @patch("app.routes.distribution.DistributionService.get_history")
    def test_history_retains_citywide_administrator_access(self, history, get_by_id):
        history.return_value = ({"success": True}, 200)
        for role in ("city_admin", "super_admin"):
            with self.subTest(role=role):
                get_by_id.return_value = user(role=role, center_id=None)
                response = self.client.get(
                    "/api/distributions/history", headers=self.authorization_headers(7)
                )

                self.assertEqual(response.status_code, 200)
                self.assertIsNone(history.call_args.args[0].get("center_id"))

    @patch("app.routes.distribution.User.get_by_id")
    @patch("app.routes.distribution.DistributionService.get_history")
    def test_history_rejects_unrecognized_role(self, history, get_by_id):
        get_by_id.return_value = user(role="unknown")
        response = self.client.get(
            "/api/distributions/history", headers=self.authorization_headers(7)
        )

        self.assertEqual(response.status_code, 403)
        history.assert_not_called()

    @patch("app.routes.distribution.User.get_by_id")
    @patch("app.routes.distribution.DistributionService.toggle_status")
    def test_non_super_admin_cannot_toggle_distribution_status(
        self, toggle_status, get_by_id
    ):
        get_by_id.return_value = user()

        response = self.client.patch(
            "/api/distributions/1/status", headers=self.authorization_headers(7)
        )

        self.assertEqual(response.status_code, 403)
        toggle_status.assert_not_called()

    @patch("app.services.distribution_service.Allocation.get_by_id")
    @patch("app.services.distribution_service.Household.get_by_id")
    def test_distribution_rejects_allocation_from_another_center(
        self, get_household, get_allocation
    ):
        get_household.return_value = {"center_id": 2}
        get_allocation.return_value = SimpleNamespace(
            center_id=3, event_id=1, status="active"
        )

        result, status = DistributionService.record_distribution(
            user(),
            {
                "household_id": 1,
                "center_id": 2,
                "items": [{"allocation_id": 1, "quantity": 1}],
            },
        )

        self.assertEqual(status, 403)
        self.assertFalse(result["success"])

    def test_session_binds_the_service_supplied_event_id(self):
        with self.app.app_context():
            with patch("app.models.distribution.db.session.execute") as execute, patch(
                "app.models.distribution.db.session.commit"
            ) as commit:
                execute.return_value.fetchone.return_value = SimpleNamespace(
                    _asdict=lambda: {"session_id": 1}
                )
                DistributionSession.create(
                    {
                        "household_id": 1,
                        "user_id": 7,
                        "center_id": 2,
                        "event_id": 3,
                        "notes": "",
                    }
                )

        self.assertEqual(execute.call_args.args[1]["event_id"], 3)
        commit.assert_not_called()

    @patch("app.services.distribution_service.Allocation.get_by_id")
    @patch("app.services.distribution_service.Household.get_by_id")
    def test_recording_commits_once_after_all_database_writes(
        self, household, allocation
    ):
        household.return_value = {"center_id": 2}
        allocation.return_value = SimpleNamespace(
            center_id=2, event_id=3, status="active"
        )
        payload = {
            "household_id": 1,
            "center_id": 2,
            "items": [
                {"allocation_id": 1, "quantity": 1},
                {"allocation_id": 2, "quantity": 1},
            ],
        }
        with self.app.app_context():
            with patch("app.models.distribution.db.session") as session:
                session.execute.side_effect = [
                    returned_row({"session_id": 9}),
                    returned_row({"distribution_id": 12}),
                    returned_row({"distribution_id": 13}),
                ]
                result, status = DistributionService.record_distribution(
                    user(), payload
                )

        self.assertEqual(status, 201)
        self.assertTrue(result["success"])
        self.assertEqual(
            [method for method, _, _ in session.method_calls],
            ["execute", "execute", "execute", "commit"],
        )

    @patch("app.services.distribution_service.Allocation.get_by_id")
    @patch("app.services.distribution_service.Household.get_by_id")
    def test_late_item_failure_rolls_back_without_committing(
        self, household, allocation
    ):
        household.return_value = {"center_id": 2}
        allocation.return_value = SimpleNamespace(
            center_id=2, event_id=3, status="active"
        )
        payload = {
            "household_id": 1,
            "center_id": 2,
            "items": [
                {"allocation_id": 1, "quantity": 1},
                {"allocation_id": 2, "quantity": 5},
            ],
        }
        with self.app.app_context():
            with patch("app.models.distribution.db.session") as session:
                session.execute.side_effect = [
                    returned_row({"session_id": 9}),
                    returned_row({"distribution_id": 12}),
                    SQLAlchemyError(
                        "Internal SQL diagnostics must not reach the caller"
                    ),
                ]
                result, status = DistributionService.record_distribution(
                    user(), payload
                )

        self.assertEqual(status, 400)
        self.assertFalse(result["success"])
        self.assertEqual(result["message"], "Failed to record distribution.")
        self.assertEqual(
            [method for method, _, _ in session.method_calls],
            ["execute", "execute", "execute", "rollback"],
        )

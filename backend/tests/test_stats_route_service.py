from types import SimpleNamespace
from unittest.mock import patch
from datetime import date

from app.models.stats import Stats
from app.services import stats_service
from tests.api_test_case import ApiTestCase


class StatsRouteServiceTests(ApiTestCase):
    @patch("app.routes.stats_routes.User.get_by_id")
    @patch("app.routes.stats_routes.stats_service.get_occupancy_stats")
    def test_volunteer_occupancy_stats_are_forced_to_assigned_center(
        self, get_occupancy_stats, get_by_id
    ):
        get_by_id.return_value = SimpleNamespace(role="volunteer", center_id=2)
        get_occupancy_stats.return_value = {"occupancy": 0}

        response = self.client.get(
            "/api/stats/occupancy-stats?center_id=3",
            headers=self.authorization_headers(7),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(get_occupancy_stats.call_args.kwargs["center_id"], 2)

    @patch("app.services.stats_service.Stats.get_all_stats")
    def test_dashboard_service_forwards_all_filters_to_model(self, get_all_stats):
        get_all_stats.return_value = {"occupancy": {}}

        result = stats_service.get_dashboard_stats(
            center_id=2, gender="Female", age_group="Adult", event_id=4
        )

        self.assertTrue(result["success"])
        get_all_stats.assert_called_once_with(2, "Female", "Adult", 4)

    def test_stats_age_groups_include_the_documented_boundaries(self):
        today = date.today()

        self.assertEqual(
            Stats.get_age_group(date(today.year - 12, today.month, today.day)),
            "Child",
        )
        self.assertEqual(
            Stats.get_age_group(date(today.year - 13, today.month, today.day)),
            "Teen",
        )
        self.assertEqual(
            Stats.get_age_group(date(today.year - 60, today.month, today.day)),
            "Senior",
        )

    def test_occupancy_model_binds_event_scope(self):
        with self.app.app_context():
            with patch("app.models.stats.db.session.execute") as execute:
                execute.side_effect = [
                    SimpleNamespace(fetchone=lambda: (100,)),
                    SimpleNamespace(fetchone=lambda: (5,)),
                ]

                result = Stats.get_occupancy_stats(center_id=2, event_id=4)

        self.assertEqual(result["current_occupancy"], 5)
        query, parameters = execute.call_args.args
        self.assertIn("ar.event_id = :event_id", str(query))
        self.assertEqual(parameters["event_id"], 4)

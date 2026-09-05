from unittest.mock import patch

from app.models.individual import Individual
from app.services.individual_service import IndividualService
from tests.api_test_case import ApiTestCase


class IndividualSearchScopeTests(ApiTestCase):
    def test_search_individuals_by_name_passes_center_scope_to_model(self):
        with patch(
            "app.services.individual_service.Individual.search_by_name"
        ) as search_by_name:
            search_by_name.return_value = []

            result = IndividualService.search_individuals_by_name("Ana", 10, 2)

        self.assertTrue(result["success"])
        search_by_name.assert_called_once_with("Ana", 10, 2)

    def test_list_and_summary_services_pass_assigned_center_scope_to_model(self):
        with patch(
            "app.services.individual_service.Individual.get_all_paginated",
            return_value=[],
        ) as get_all_paginated, patch(
            "app.services.individual_service.Individual.get_count", return_value=0
        ), patch(
            "app.services.individual_service.Individual.get_individuals_with_status_summary",
            return_value={},
        ) as get_individuals_with_status_summary:
            result = IndividualService.get_all_individuals(
                {"page": 1, "limit": 10, "assigned_center_id": 2}
            )
            summary = IndividualService.get_status_summary({"assigned_center_id": 2})

        self.assertTrue(result["success"])
        self.assertTrue(summary["success"])
        self.assertEqual(get_all_paginated.call_args.kwargs["assigned_center_id"], 2)
        self.assertEqual(
            get_individuals_with_status_summary.call_args.kwargs["assigned_center_id"],
            2,
        )

    def test_model_search_binds_center_scope_in_query(self):
        with self.app.app_context():
            with patch("app.models.individual.db.session.execute") as execute:
                execute.return_value.fetchall.return_value = []

                result = Individual.search_by_name("Ana", 10, 2)

        self.assertEqual(result, [])
        query, parameters = execute.call_args.args
        self.assertIn(
            "JOIN households h ON h.household_id = i.household_id", str(query)
        )
        self.assertEqual(parameters, {"search": "%Ana%", "limit": 10, "center_id": 2})

    def test_paginated_and_count_queries_bind_assigned_center_scope(self):
        with self.app.app_context():
            with patch("app.models.individual.db.session.execute") as execute:
                execute.return_value.fetchall.return_value = []
                Individual.get_all_paginated(
                    search="", offset=0, limit=10, assigned_center_id=2
                )
                list_query, list_parameters = execute.call_args.args

                execute.return_value.scalar.return_value = 0
                Individual.get_count(search="", assigned_center_id=2)
                count_query, count_parameters = execute.call_args.args

        self.assertIn("h.center_id = :assigned_center_id", str(list_query))
        self.assertEqual(list_parameters["assigned_center_id"], 2)
        self.assertIn("h.center_id = :assigned_center_id", str(count_query))
        self.assertEqual(count_parameters["assigned_center_id"], 2)

    def test_status_summary_query_binds_assigned_center_scope(self):
        with self.app.app_context():
            with patch("app.models.individual.db.session.execute") as execute:
                execute.return_value.fetchall.return_value = []
                Individual.get_individuals_with_status_summary(assigned_center_id=2)

        query, parameters = execute.call_args.args
        self.assertIn(
            "JOIN households h ON h.household_id = i.household_id", str(query)
        )
        self.assertEqual(parameters["assigned_center_id"], 2)

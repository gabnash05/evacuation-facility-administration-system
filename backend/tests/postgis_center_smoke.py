"""Verify center spatial queries against a disposable PostGIS database."""

import os
import unittest

from sqlalchemy import text
from sqlalchemy.engine import make_url

from app import create_app
from app.models import db
from app.models.evacuation_center import EvacuationCenter
from tests.api_test_case import ApiTestConfig


class CenterPostGISSmoke(unittest.TestCase):
    def test_proximity_and_bounds_use_stored_postgresql_points(self):
        url = make_url(os.environ["EFAS_TEST_DATABASE_URL"])
        if (
            url.drivername not in {"postgresql", "postgresql+psycopg2"}
            or url.host != "127.0.0.1"
            or not url.port
            or url.port == 5432
            or url.query
            or not (url.database or "").startswith("efas_test_")
        ):
            self.fail("Use a local disposable PostGIS fixture database.")

        class FixtureConfig(ApiTestConfig):
            SQLALCHEMY_DATABASE_URI = url

        application = create_app(FixtureConfig)
        with application.app_context():
            self.assertEqual(
                db.session.execute(text("SELECT COUNT(*) FROM users")).scalar(), 0
            )
            db.session.execute(
                text(
                    """
                INSERT INTO evacuation_centers
                    (center_name, address, coordinates, capacity, status)
                VALUES ('Near', 'Fixture address', POINT(124.6, 8.2), 30, 'active'),
                       ('Far', 'Fixture address', POINT(125.6, 9.2), 30, 'active'),
                       ('Closed', 'Fixture address', POINT(124.6, 8.2), 30, 'closed')
            """
                )
            )
            db.session.commit()
            orm_center = (
                db.session.query(EvacuationCenter).filter_by(center_name="Near").one()
            )
            self.assertEqual(orm_center.coordinates, (124.6, 8.2))
            proximity = EvacuationCenter.get_centers_by_proximity(8.2, 124.6, 10)
            self.assertEqual([center.center_name for center in proximity], ["Near"])
            self.assertLess(proximity[0].distance_km, 0.01)
            bounds = EvacuationCenter.get_centers_in_bounds(8.3, 8.1, 124.7, 124.5)
            self.assertEqual([center.center_name for center in bounds], ["Near"])
            orm_center.coordinates = (124.61, 8.21)
            db.session.commit()
            db.session.expire(orm_center)
            self.assertEqual(orm_center.coordinates, (124.61, 8.21))


if __name__ == "__main__":
    unittest.main()

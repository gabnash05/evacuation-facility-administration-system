"""Run database smoke suites in newly created local PostgreSQL databases."""

import os
import subprocess
import sys
import uuid

from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.exc import ArgumentError


def fixture_server_url(value):
    """Accept only an explicit local PostgreSQL maintenance connection."""
    try:
        url = make_url(value)
    except (ArgumentError, ValueError, TypeError):
        raise ValueError("Invalid fixture server URL") from None
    if (
        url.drivername not in {"postgresql", "postgresql+psycopg2"}
        or url.host != "127.0.0.1"
        or not url.port
        or url.port == 5432
        or url.database != "postgres"
        or url.query
    ):
        raise ValueError("Use a local non-default-port PostgreSQL maintenance URL")
    return url


def main():
    url = fixture_server_url(os.environ.get("EFAS_TEST_SERVER_URL", ""))
    engine = create_engine(url, isolation_level="AUTOCOMMIT")
    try:
        suites = ["attendance", "distribution", "household"]
        if os.environ.get("EFAS_TEST_POSTGIS") == "1":
            suites.append("postgis")
        for suite in suites:
            name = f"efas_test_{suite}_{uuid.uuid4().hex}"
            with engine.connect() as connection:
                connection.exec_driver_sql(f'CREATE DATABASE "{name}"')
            database_url = url.set(database=name).render_as_string(hide_password=False)
            if suite == "postgis":
                spatial_engine = create_engine(url.set(database=name))
                try:
                    with spatial_engine.begin() as connection:
                        connection.exec_driver_sql("CREATE EXTENSION postgis")
                finally:
                    spatial_engine.dispose()
            environment = os.environ.copy()
            environment.update(
                DATABASE_URL=database_url,
                EFAS_TEST_DATABASE_URL=database_url,
                FLASK_SKIP_DOTENV="1",
            )
            print(f"Running {suite} smoke suite on {name}", flush=True)
            revision = (
                "0003_unique_active_attendance" if suite == "attendance" else "head"
            )
            subprocess.run(
                [
                    sys.executable,
                    "-m",
                    "flask",
                    "--app",
                    "app",
                    "db",
                    "upgrade",
                    revision,
                ],
                env=environment,
                check=True,
            )
            module = (
                "tests.postgis_center_smoke"
                if suite == "postgis"
                else f"tests.postgresql_{suite}_smoke"
            )
            subprocess.run(
                [sys.executable, "-m", module],
                env=environment,
                check=True,
            )
    finally:
        engine.dispose()


if __name__ == "__main__":
    main()

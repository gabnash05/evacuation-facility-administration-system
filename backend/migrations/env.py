"""Run EFAS migrations transactionally against an explicit PostgreSQL target."""

import os
from logging.config import fileConfig

from alembic import context
from flask import current_app


def run_migrations():
    config = context.config
    if config.config_file_name:
        fileConfig(config.config_file_name, disable_existing_loggers=False)

    if context.is_offline_mode():
        raise RuntimeError("EFAS migrations require an online schema preflight.")
    if not os.environ.get("DATABASE_URL", "").strip():
        raise RuntimeError(
            "Set DATABASE_URL to the intended PostgreSQL migration target."
        )

    engine = current_app.extensions["migrate"].db.engine
    if engine.url.get_backend_name() != "postgresql":
        raise RuntimeError("EFAS migrations require PostgreSQL.")

    # The SQL revisions own schema history. The ORM metadata is incomplete.
    with engine.connect() as connection:
        context.configure(connection=connection, transactional_ddl=True)
        with context.begin_transaction():
            context.run_migrations()


run_migrations()

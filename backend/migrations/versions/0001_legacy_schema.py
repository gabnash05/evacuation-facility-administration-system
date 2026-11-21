"""Establish the reviewed EFAS raw SQL schema as revision 0001."""

from hashlib import sha256
from pathlib import Path

from alembic import op
from sqlalchemy import inspect

revision = "0001_legacy_schema"
down_revision = None
branch_labels = None
depends_on = None

LEGACY_SQL = Path(__file__).resolve().parents[2] / "database/sql/create_tables.sql"
LEGACY_SQL_SHA256 = "87e66b81efda7860822f324645ec88fa492f3b6825676de88c228e0f6085c0b0"
EFAS_TABLES = {
    "aid_categories",
    "allocations",
    "attendance_records",
    "distribution_sessions",
    "distributions",
    "evacuation_centers",
    "event_centers",
    "events",
    "households",
    "individuals",
    "users",
}


def upgrade():
    """Install the baseline only when no EFAS tables already exist."""
    sql = LEGACY_SQL.read_text(encoding="utf-8")
    if sha256(sql.encode("utf-8")).hexdigest() != LEGACY_SQL_SHA256:
        raise RuntimeError("The revision 0001 SQL snapshot was modified.")

    connection = op.get_bind()
    existing = EFAS_TABLES.intersection(inspect(connection).get_table_names())
    if existing:
        raise RuntimeError(
            "EFAS tables already exist. Verify the legacy schema on a restored copy "
            "before adopting revision 0001."
        )
    connection.exec_driver_sql(sql, execution_options={"no_parameters": True})


def downgrade():
    """Refuse to destroy an installed baseline and its data."""
    raise RuntimeError(
        "Revision 0001 has no destructive downgrade. Restore a backup instead."
    )

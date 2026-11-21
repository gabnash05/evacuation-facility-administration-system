"""Enforce at most one active check-in per individual."""

from alembic import op

revision = "0003_unique_active_attendance"
down_revision = "0002_distribution_delete_stock"
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    connection.exec_driver_sql("SET LOCAL lock_timeout = '5s'")
    connection.exec_driver_sql("LOCK TABLE attendance_records IN SHARE MODE")
    duplicates = connection.exec_driver_sql(
        """
        SELECT EXISTS (
            SELECT 1
            FROM attendance_records
            WHERE status = 'checked_in' AND check_out_time IS NULL
            GROUP BY individual_id
            HAVING COUNT(*) > 1
        )
        """
    ).scalar_one()
    if duplicates:
        raise RuntimeError(
            "Duplicate active attendance records exist. Reconcile them on a "
            "verified database copy before retrying revision 0003."
        )
    connection.exec_driver_sql(
        """
        CREATE UNIQUE INDEX uq_attendance_active_individual
        ON attendance_records (individual_id)
        WHERE status = 'checked_in' AND check_out_time IS NULL
        """
    )


def downgrade():
    op.execute("SET LOCAL lock_timeout = '5s'")
    op.drop_index("uq_attendance_active_individual", table_name="attendance_records")

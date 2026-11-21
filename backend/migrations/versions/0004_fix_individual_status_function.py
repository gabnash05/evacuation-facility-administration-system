"""Correct the return type of the individual-status recalculation function."""

from alembic import op

revision = "0004_fix_individual_status"
down_revision = "0003_unique_active_attendance"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        """
        CREATE OR REPLACE FUNCTION recalculate_all_individual_statuses()
        RETURNS TABLE(individual_id INTEGER, old_status VARCHAR, new_status VARCHAR)
        AS $$
        BEGIN
            RETURN QUERY
            WITH latest_status AS (
                SELECT i.individual_id, i.current_status AS old_status,
                    (CASE
                        WHEN EXISTS (SELECT 1 FROM attendance_records ar
                            WHERE ar.individual_id = i.individual_id
                            AND ar.status = 'checked_in' AND ar.check_out_time IS NULL)
                        THEN 'checked_in'
                        WHEN EXISTS (SELECT 1 FROM attendance_records ar
                            WHERE ar.individual_id = i.individual_id
                            AND ar.status = 'transferred') THEN 'transferred'
                        ELSE 'checked_out'
                    END)::VARCHAR AS calculated_status
                FROM individuals i
            )
            UPDATE individuals i
            SET current_status = ls.calculated_status, updated_at = CURRENT_TIMESTAMP
            FROM latest_status ls
            WHERE i.individual_id = ls.individual_id
              AND i.current_status IS DISTINCT FROM ls.calculated_status
            RETURNING i.individual_id, ls.old_status, ls.calculated_status;
        END;
        $$ LANGUAGE plpgsql
    """
    )


def downgrade():
    raise RuntimeError("Revision 0004 cannot restore the broken status function.")

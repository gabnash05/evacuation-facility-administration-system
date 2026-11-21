"""Return stock on deletion only when the record still consumes it."""

from alembic import op

revision = "0002_distribution_delete_stock"
down_revision = "0001_legacy_schema"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        """
        CREATE FUNCTION restore_completed_distribution_stock() RETURNS trigger
        LANGUAGE plpgsql AS $$
        BEGIN
            UPDATE allocations
            SET remaining_quantity = remaining_quantity + OLD.quantity_distributed,
                status = CASE WHEN status = 'cancelled' THEN status ELSE 'active' END,
                updated_at = CURRENT_TIMESTAMP
            WHERE allocation_id = OLD.allocation_id;
            RETURN OLD;
        END;
        $$
    """
    )
    op.execute("DROP TRIGGER update_allocation_on_distribution_delete ON distributions")
    op.execute(
        """
        CREATE TRIGGER update_allocation_on_distribution_delete
        AFTER DELETE ON distributions
        FOR EACH ROW WHEN (OLD.status = 'completed')
        EXECUTE FUNCTION restore_completed_distribution_stock()
    """
    )


def downgrade():
    raise RuntimeError("Revision 0002 cannot restore the double-credit delete trigger.")

"""Aid Allocation models for EFAS."""

from typing import Any, Dict, List, Optional
from datetime import datetime
from sqlalchemy import text
from app.models import db
import logging

logger = logging.getLogger(__name__)


class AidCategory(db.Model):
    """Aid Category model for categorizing aid resources."""

    __tablename__ = "aid_categories"

    category_id = db.Column(db.Integer, primary_key=True)
    category_name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())

    def to_dict(self) -> Dict[str, Any]:
        """Convert aid category to dictionary."""
        return {
            "category_id": self.category_id,
            "category_name": self.category_name,
            "description": self.description,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self) -> str:
        return f"<AidCategory(category_id={self.category_id}, name='{self.category_name}')>"

    @classmethod
    def get_all_active(cls) -> List["AidCategory"]:
        """Get all active aid categories."""
        results = db.session.execute(
            text("SELECT * FROM aid_categories WHERE is_active = TRUE ORDER BY category_name")
        ).fetchall()

        categories = []
        for row in results:
            try:
                categories.append(cls(**row._asdict()))
            except Exception as e:
                logger.error("Error converting row to AidCategory: %s", str(e))

        return categories

    @classmethod
    def get_by_id(cls, category_id: int) -> Optional["AidCategory"]:
        """Get aid category by ID."""
        result = db.session.execute(
            text("SELECT * FROM aid_categories WHERE category_id = :category_id"),
            {"category_id": category_id}
        ).fetchone()

        if not result:
            return None

        try:
            return cls(**result._asdict())
        except Exception as e:
            logger.error("Error converting row to AidCategory: %s", str(e))
            return None


class Allocation(db.Model):
    """Allocation model for tracking aid resources allocated to centers."""

    __tablename__ = "allocations"

    allocation_id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, nullable=False)
    center_id = db.Column(db.Integer, nullable=False)
    event_id = db.Column(db.Integer, nullable=False)
    resource_name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    total_quantity = db.Column(db.Integer, nullable=False)
    remaining_quantity = db.Column(db.Integer, nullable=False)
    distribution_type = db.Column(db.String(20), nullable=False)
    suggested_amount = db.Column(db.Integer, nullable=True)
    status = db.Column(db.String(20), nullable=False, default="active")
    allocated_by_user_id = db.Column(db.Integer, nullable=False)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())

    def to_dict(self) -> Dict[str, Any]:
        """Convert allocation to dictionary."""
        return {
            "allocation_id": self.allocation_id,
            "category_id": self.category_id,
            "center_id": self.center_id,
            "event_id": self.event_id,
            "resource_name": self.resource_name,
            "description": self.description,
            "total_quantity": self.total_quantity,
            "remaining_quantity": self.remaining_quantity,
            "distribution_type": self.distribution_type,
            "suggested_amount": self.suggested_amount,
            "status": self.status,
            "allocated_by_user_id": self.allocated_by_user_id,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self) -> str:
        return f"<Allocation(allocation_id={self.allocation_id}, resource='{self.resource_name}', center={self.center_id})>"

    @classmethod
    def _row_to_allocation(cls, row) -> Optional["Allocation"]:
        """Convert SQLAlchemy Row to Allocation object."""
        if not row:
            return None

        try:
            row_dict = row._asdict()
        except AttributeError:
            row_dict = dict(row)

        return cls(**row_dict)

    @classmethod
    def get_by_id(cls, allocation_id: int) -> Optional["Allocation"]:
        """Get allocation by ID."""
        result = db.session.execute(
            text("SELECT * FROM allocations WHERE allocation_id = :allocation_id"),
            {"allocation_id": allocation_id}
        ).fetchone()

        return cls._row_to_allocation(result)

    @classmethod
    def create(cls, data: Dict[str, Any]) -> Optional["Allocation"]:
        """Create a new allocation."""
        required_fields = [
            "category_id", "center_id", "event_id", "resource_name",
            "total_quantity", "distribution_type", "allocated_by_user_id"
        ]

        for field in required_fields:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")

        # Set remaining_quantity equal to total_quantity initially
        data["remaining_quantity"] = data["total_quantity"]

        # Build dynamic INSERT query
        fields = []
        values = []
        params = {}

        for field in [
            "category_id", "center_id", "event_id", "resource_name",
            "description", "total_quantity", "remaining_quantity",
            "distribution_type", "suggested_amount", "status",
            "allocated_by_user_id", "notes"
        ]:
            if field in data and data[field] is not None:
                fields.append(field)
                values.append(f":{field}")
                params[field] = data[field]

        query = text(
            f"""
            INSERT INTO allocations ({', '.join(fields)})
            VALUES ({', '.join(values)})
            RETURNING *
            """
        )

        try:
            result = db.session.execute(query, params).fetchone()
            db.session.commit()
            return cls._row_to_allocation(result)
        except Exception as e:
            db.session.rollback()
            raise ValueError(f"Failed to create allocation: {str(e)}")

    @classmethod
    def update(cls, allocation_id: int, update_data: Dict[str, Any]) -> Optional["Allocation"]:
        """Update allocation."""
        current_allocation = cls.get_by_id(allocation_id)
        if not current_allocation:
            return None

        # Prevent updating certain fields
        restricted_fields = ["center_id", "event_id", "allocated_by_user_id", "remaining_quantity"]
        for field in restricted_fields:
            if field in update_data:
                del update_data[field]

        # Build dynamic UPDATE query
        set_clauses = []
        params = {"allocation_id": allocation_id}

        for field, value in update_data.items():
            if field != "allocation_id":
                set_clauses.append(f"{field} = :{field}")
                params[field] = value

        if not set_clauses:
            return None

        # Add updated_at timestamp
        set_clauses.append("updated_at = NOW()")

        query = text(
            f"""
            UPDATE allocations 
            SET {', '.join(set_clauses)}
            WHERE allocation_id = :allocation_id
            RETURNING *
            """
        )

        result = db.session.execute(query, params).fetchone()
        db.session.commit()

        return cls._row_to_allocation(result)

    @classmethod
    def update_quantity(cls, allocation_id, quantity, operation='subtract'):
        """Manually adjusts the remaining_quantity of an allocation."""
        if operation == 'subtract':
            # Check for sufficient stock before subtracting
            check_sql = text("SELECT remaining_quantity FROM allocations WHERE allocation_id = :id")
            current_stock = db.session.execute(check_sql, {"id": allocation_id}).scalar()
            if current_stock is None or current_stock < quantity:
                raise ValueError(f"Insufficient stock for allocation ID {allocation_id}. Required: {quantity}, Available: {current_stock}")

            update_sql = text("UPDATE allocations SET remaining_quantity = remaining_quantity - :qty WHERE allocation_id = :id")
        else: # 'add'
            update_sql = text("UPDATE allocations SET remaining_quantity = remaining_quantity + :qty, status = 'active' WHERE allocation_id = :id")
        
        db.session.execute(update_sql, {"qty": quantity, "id": allocation_id})

    @classmethod
    def delete(cls, allocation_id: int) -> bool:
        """Delete an allocation.

        This method will first check for dependent distributions and prevent deletion
        if any distributions reference this allocation to avoid integrity errors.
        Returns:
            True if deleted, False if not deleted due to existing dependencies.
        """
        try:
            # Check for existing distributions referencing this allocation
            count_result = db.session.execute(
                text("SELECT COUNT(*) FROM distributions WHERE allocation_id = :allocation_id"),
                {"allocation_id": allocation_id},
            ).fetchone()

            if count_result and count_result[0] > 0:
                # Do not attempt delete; caller can decide how to handle this.
                logger.debug(
                    "Allocation %s cannot be deleted; %s distribution(s) reference it.",
                    allocation_id,
                    count_result[0] if count_result else 0,
                )
                return False

            result = db.session.execute(
                text(
                    """
                    DELETE FROM allocations
                    WHERE allocation_id = :allocation_id 
                    RETURNING allocation_id
                    """
                ),
                {"allocation_id": allocation_id},
            ).fetchone()

            db.session.commit()
            return result is not None
        except Exception as e:
            db.session.rollback()
            logger.exception("Error deleting allocation %s: %s", allocation_id, str(e))
            # Returning False to indicate failure; preserve DB integrity
            return False
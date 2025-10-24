"""Evacuation Center model for EFAS."""

from typing import List, Optional

from sqlalchemy import text

from app.models import db


class EvacuationCenter(db.Model):
    """Evacuation Center model for managing evacuation facilities."""

    __tablename__ = "evacuation_center"

    center_id = db.Column(db.Integer, primary_key=True)
    address = db.Column(db.String(255), nullable=False)
    capacity = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), nullable=False, default="active")
    current_occupancy = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())

    def to_dict(self):
        """Convert center to dictionary for JSON serialization."""
        return {
            "center_id": self.center_id,
            "address": self.address,
            "capacity": self.capacity,
            "status": self.status,
            "current_occupancy": self.current_occupancy,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<EvacuationCenter(center_id={self.center_id}, address='{self.address}', capacity={self.capacity})>"

    @classmethod
    def _row_to_center(cls, row) -> Optional["EvacuationCenter"]:
        """Convert SQLAlchemy Row to EvacuationCenter object."""
        if not row:
            return None

        try:
            row_dict = row._asdict()
        except AttributeError:
            row_dict = dict(row)

        return cls(**row_dict)

    @classmethod
    def get_by_id(cls, center_id: int) -> Optional["EvacuationCenter"]:
        """Get center by ID using raw SQL."""
        result = db.session.execute(
            text("SELECT * FROM evacuation_center WHERE center_id = :center_id"),
            {"center_id": center_id},
        ).fetchone()

        return cls._row_to_center(result)

    @classmethod
    def get_all_active(cls) -> List["EvacuationCenter"]:
        """Get all active centers using raw SQL."""
        results = db.session.execute(
            text(
                "SELECT * FROM evacuation_center WHERE status = 'active' ORDER BY center_id"
            )
        ).fetchall()

        return [cls._row_to_center(row) for row in results if cls._row_to_center(row)]

    @classmethod
    def get_all(cls) -> List["EvacuationCenter"]:
        """Get all centers using raw SQL."""
        results = db.session.execute(
            text("SELECT * FROM evacuation_center ORDER BY center_id")
        ).fetchall()

        return [cls._row_to_center(row) for row in results if cls._row_to_center(row)]

    @classmethod
    def create_center(
        cls, address: str, capacity: int, status: str = "active"
    ) -> "EvacuationCenter":
        """Create a new evacuation center using raw SQL."""
        result = db.session.execute(
            text(
                """
            INSERT INTO evacuation_center (address, capacity, status, current_occupancy)
            VALUES (:address, :capacity, :status, 0)
            RETURNING *
            """
            ),
            {"address": address, "capacity": capacity, "status": status},
        ).fetchone()

        db.session.commit()
        return cls._row_to_center(result)

    @classmethod
    def update_occupancy(cls, center_id: int, new_occupancy: int) -> bool:
        """Update center occupancy using raw SQL."""
        result = db.session.execute(
            text(
                """
            UPDATE evacuation_center 
            SET current_occupancy = :occupancy, updated_at = NOW()
            WHERE center_id = :center_id AND capacity >= :occupancy
            RETURNING center_id
            """
            ),
            {"center_id": center_id, "occupancy": new_occupancy},
        ).fetchone()

        db.session.commit()
        return result is not None

    @classmethod
    def update_status(cls, center_id: int, status: str) -> bool:
        """Update center status using raw SQL."""
        result = db.session.execute(
            text(
                """
            UPDATE evacuation_center 
            SET status = :status, updated_at = NOW()
            WHERE center_id = :center_id
            RETURNING center_id
            """
            ),
            {"center_id": center_id, "status": status},
        ).fetchone()

        db.session.commit()
        return result is not None

    @classmethod
    def get_available_capacity(cls, center_id: int) -> Optional[int]:
        """Get available capacity for a center using raw SQL."""
        result = db.session.execute(
            text(
                """
            SELECT capacity - current_occupancy as available 
            FROM evacuation_center 
            WHERE center_id = :center_id AND status = 'active'
            """
            ),
            {"center_id": center_id},
        ).fetchone()

        return result[0] if result else None

    @classmethod
    def get_centers_with_capacity(cls) -> List["EvacuationCenter"]:
        """Get all active centers with available capacity using raw SQL."""
        results = db.session.execute(
            text(
                """
            SELECT * FROM evacuation_center 
            WHERE status = 'active' AND current_occupancy < capacity
            ORDER BY (capacity - current_occupancy) DESC
            """
            )
        ).fetchall()

        return [cls._row_to_center(row) for row in results if cls._row_to_center(row)]

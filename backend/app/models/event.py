"""Event model for EFAS."""

from typing import Any, Dict, List, Optional
from datetime import datetime

from sqlalchemy import text

from app.models import db
from app.schemas.event import EventResponseSchema


class Event(db.Model):
    """Event model for managing events."""

    __tablename__ = "events"

    event_id = db.Column(db.Integer, primary_key=True)
    event_name = db.Column(db.String(150), nullable=False, index=True)
    event_type = db.Column(db.String(50), nullable=False)
    date_declared = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(20), nullable=False, default="active")
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())

    def to_dict(self):
        """Convert event to dictionary for JSON serialization."""
        schema = EventResponseSchema()
        return schema.dump(self)

    def to_schema(self):
        """Convert event to Marshmallow response schema."""
        schema = EventResponseSchema()
        return schema.dump(self)

    def __repr__(self):
        return f"<Event(event_id={self.event_id}, name='{self.event_name}', type='{self.event_type}')>"

    @classmethod
    def _row_to_event(cls, row) -> Optional["Event"]:
        """Convert SQLAlchemy Row to Event object."""
        if not row:
            return None

        try:
            row_dict = row._asdict()
        except AttributeError:
            row_dict = dict(row)

        return cls(**row_dict)

    @classmethod
    def get_by_id(cls, event_id: int) -> Optional["Event"]:
        """Get event by ID using raw SQL."""
        result = db.session.execute(
            text("SELECT * FROM events WHERE event_id = :event_id"),
            {"event_id": event_id},
        ).fetchone()

        return cls._row_to_event(result)

    @classmethod
    def get_centers_by_event(cls, event_id: int) -> List[Dict[str, Any]]:
        """Get all centers associated with an event."""
        try:
            result = db.session.execute(
                text(
                    """
                    SELECT 
                        ec.center_id, 
                        ec.center_name, 
                        ec.address, 
                        ec.capacity, 
                        ec.current_occupancy,
                        CASE 
                            WHEN ec.capacity > 0 THEN 
                                ROUND((ec.current_occupancy * 100.0 / ec.capacity), 2)
                            ELSE 0 
                        END as usage_percentage,
                        ec.status
                    FROM event_centers ecj
                    JOIN evacuation_centers ec ON ecj.center_id = ec.center_id
                    WHERE ecj.event_id = :event_id
                """
                ),
                {"event_id": event_id},
            )
            return [dict(row._mapping) for row in result.fetchall()]
        except Exception:
            return []

    @classmethod
    def create(cls, data: Dict[str, Any]) -> "Event":
        """Create a new event using raw SQL."""
        result = db.session.execute(
            text(
                """  
                INSERT INTO events (event_name, event_type, date_declared, end_date, status)
                VALUES (:event_name, :event_type, :date_declared, :end_date, :status)
                RETURNING event_id, created_at, updated_at
                """
            ),
            {
                "event_name": data["event_name"],
                "event_type": data["event_type"],
                "date_declared": data["date_declared"],
                "end_date": data.get("end_date"),
                "status": data.get("status", "active"),
            },
        ).fetchone()

        db.session.commit()

        result_dict = result._asdict()

        # Handle center associations if provided
        if "center_ids" in data and data["center_ids"]:
            from .event import EventCenter

            EventCenter.add_centers(result_dict["event_id"], data["center_ids"])

        event = cls(
            event_id=result_dict["event_id"],
            event_name=data["event_name"],
            event_type=data["event_type"],
            date_declared=data["date_declared"],
            end_date=data.get("end_date"),
            status=data.get("status", "active"),
            created_at=result_dict["created_at"],
            updated_at=result_dict["updated_at"],
        )
        return event

    @classmethod
    def update(cls, event_id: int, update_data: Dict[str, Any]) -> Optional["Event"]:
        """Update event information using raw SQL."""
        # Check if we're updating the status to 'resolved'
        is_updating_to_resolved = (
            update_data.get("status") == "resolved"
            and update_data.get("status") is not None
        )

        # Get current event data before update to check previous status
        current_event = cls.get_by_id(event_id)

        # Extract center_ids from update_data before building the UPDATE query
        center_ids = update_data.pop("center_ids", None)

        # Build dynamic UPDATE query (only for event table fields)
        set_clauses = []
        params = {"event_id": event_id}

        for field, value in update_data.items():
            if value is not None and field != "event_id":  # Prevent ID modification
                set_clauses.append(f"{field} = :{field}")
                params[field] = value

        if not set_clauses:
            return None

        # Add updated_at timestamp
        set_clauses.append("updated_at = NOW()")

        query = text(
            f"""  
            UPDATE events 
            SET {', '.join(set_clauses)}
            WHERE event_id = :event_id
            RETURNING *
            """
        )

        result = db.session.execute(query, params).fetchone()

        # Handle center associations if provided
        if center_ids is not None:  # Changed from "center_ids" in update_data
            from .event import EventCenter

            # Remove all existing centers
            EventCenter.remove_centers(event_id)
            # Add new centers
            if center_ids:  # Only add if there are centers
                EventCenter.add_centers(event_id, center_ids)

        # If we're updating the status to 'resolved', handle center status changes
        if (
            is_updating_to_resolved
            and current_event
            and current_event.status != "resolved"
        ):
            cls._handle_event_resolved(event_id)

        db.session.commit()
        return cls._row_to_event(result)

    @classmethod
    def _handle_event_resolved(cls, event_id: int) -> None:
        """Handle center status changes when an event is resolved."""
        # Get all centers associated with this event
        from .event import EventCenter

        centers = EventCenter.get_centers_by_event(event_id)

        for center in centers:
            center_id = center["center_id"]

            # Check if center is associated with any other active events
            result = db.session.execute(
                text(
                    """
                    SELECT COUNT(*) FROM event_centers ec
                    JOIN events e ON ec.event_id = e.event_id
                    WHERE ec.center_id = :center_id 
                    AND e.event_id != :event_id 
                    AND e.status = 'active'
                    """
                ),
                {"center_id": center_id, "event_id": event_id},
            ).scalar()

            # If center is not associated with any other active events, set status to 'inactive'
            if result == 0:
                db.session.execute(
                    text(
                        """
                        UPDATE evacuation_centers 
                        SET status = 'inactive', updated_at = NOW()
                        WHERE center_id = :center_id
                        """
                    ),
                    {"center_id": center_id},
                )

    @classmethod
    def delete(cls, event_id: int) -> bool:
        """Delete an event using raw SQL."""
        result = db.session.execute(
            text(
                """  
                DELETE FROM events 
                WHERE event_id = :event_id 
                RETURNING event_id
                """
            ),
            {"event_id": event_id},
        ).fetchone()

        db.session.commit()
        return result is not None


class EventCenter(db.Model):
    """Event-Center association model."""

    __tablename__ = "event_centers"

    event_id = db.Column(
        db.Integer,
        db.ForeignKey("events.event_id", ondelete="CASCADE"),
        primary_key=True,
    )
    center_id = db.Column(
        db.Integer,
        db.ForeignKey("evacuation_centers.center_id", ondelete="CASCADE"),
        primary_key=True,
    )
    created_at = db.Column(db.DateTime, default=db.func.now())

    @classmethod
    def get_centers_by_event(cls, event_id: int) -> List[Dict[str, Any]]:
        """Get all centers associated with an event."""
        try:
            result = db.session.execute(
                text(
                    """
                    SELECT 
                        ec.center_id, 
                        ec.center_name, 
                        ec.address, 
                        ec.capacity, 
                        ec.current_occupancy,
                        CASE 
                            WHEN ec.capacity > 0 THEN 
                                ROUND((ec.current_occupancy * 100.0 / ec.capacity), 2)
                            ELSE 0 
                        END as usage_percentage,
                        ec.status
                    FROM event_centers ecj
                    JOIN evacuation_centers ec ON ecj.center_id = ec.center_id
                    WHERE ecj.event_id = :event_id
                """
                ),
                {"event_id": event_id},
            )
            return [dict(row._mapping) for row in result.fetchall()]
        except Exception:
            return []

    @classmethod
    def add_centers(cls, event_id: int, center_ids: List[int]) -> None:
        """Add centers to an event and set their status to 'active'."""
        for center_id in center_ids:
            # Add center to event_centers table
            db.session.execute(
                text(
                    """
                    INSERT INTO event_centers (event_id, center_id)
                    VALUES (:event_id, :center_id)
                    ON CONFLICT DO NOTHING
                """
                ),
                {"event_id": event_id, "center_id": center_id},
            )

            # Update center status to 'active'
            db.session.execute(
                text(
                    """
                    UPDATE evacuation_centers 
                    SET status = 'active', updated_at = NOW()
                    WHERE center_id = :center_id
                """
                ),
                {"center_id": center_id},
            )

        db.session.commit()

    @classmethod
    def remove_centers(cls, event_id: int, center_ids: List[int] = None) -> None:
        """Remove centers from an event and optionally set their status to 'inactive'."""
        if center_ids:
            for center_id in center_ids:
                db.session.execute(
                    text(
                        "DELETE FROM event_centers WHERE event_id = :event_id AND center_id = :center_id"
                    ),
                    {"event_id": event_id, "center_id": center_id},
                )

                # Check if center is still associated with any active events
                result = db.session.execute(
                    text(
                        """
                        SELECT COUNT(*) FROM event_centers ec
                        JOIN events e ON ec.event_id = e.event_id
                        WHERE ec.center_id = :center_id AND e.status = 'active'
                        """
                    ),
                    {"center_id": center_id},
                ).scalar()

                # If center is not associated with any active events, set status to 'inactive'
                if result == 0:
                    db.session.execute(
                        text(
                            """
                            UPDATE evacuation_centers 
                            SET status = 'inactive', updated_at = NOW()
                            WHERE center_id = :center_id
                            """
                        ),
                        {"center_id": center_id},
                    )
        else:
            # Remove all centers from event
            db.session.execute(
                text("DELETE FROM event_centers WHERE event_id = :event_id"),
                {"event_id": event_id},
            )

            # Get all centers that were associated with this event
            centers_result = db.session.execute(
                text("SELECT center_id FROM event_centers WHERE event_id = :event_id"),
                {"event_id": event_id},
            ).fetchall()

            center_ids_removed = [row[0] for row in centers_result]

            # For each center, check if it's still associated with any active events
            for center_id in center_ids_removed:
                result = db.session.execute(
                    text(
                        """
                        SELECT COUNT(*) FROM event_centers ec
                        JOIN events e ON ec.event_id = e.event_id
                        WHERE ec.center_id = :center_id AND e.status = 'active'
                        """
                    ),
                    {"center_id": center_id},
                ).scalar()

                # If center is not associated with any active events, set status to 'inactive'
                if result == 0:
                    db.session.execute(
                        text(
                            """
                            UPDATE evacuation_centers 
                            SET status = 'inactive', updated_at = NOW()
                            WHERE center_id = :center_id
                            """
                        ),
                        {"center_id": center_id},
                    )

        db.session.commit()

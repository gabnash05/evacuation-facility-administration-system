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
    def get_all(
        cls,
        search: Optional[str] = None,
        status: Optional[str] = None,
        page: int = 1,
        limit: int = 10,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = "asc",
    ) -> Dict[str, Any]:
        """Get all events with pagination, search, and sorting."""
        # Base query
        base_query = "FROM events WHERE 1=1"
        count_query = "SELECT COUNT(*) as total_count FROM events WHERE 1=1"
        params = {}

        # Add search filter
        if search:
            base_query += " AND (LOWER(event_name) LIKE LOWER(:search) OR LOWER(event_type) LIKE LOWER(:search))"
            count_query += " AND (LOWER(event_name) LIKE LOWER(:search) OR LOWER(event_type) LIKE LOWER(:search))"
            params["search"] = f"%{search}%"

        # Add status filter
        if status:
            base_query += " AND status = :status"
            count_query += " AND status = :status"
            params["status"] = status

        # Get total count
        count_result = db.session.execute(text(count_query), params).fetchone()
        total_count = count_result[0] if count_result else 0

        # Build main query
        select_query = f"SELECT * {base_query}"

        # Add sorting
        if sort_by and sort_by in [
            "event_name",
            "event_type",
            "date_declared",
            "end_date",
            "status",
            "created_at",
        ]:
            order_direction = (
                "DESC" if sort_order and sort_order.lower() == "desc" else "ASC"
            )
            select_query += f" ORDER BY {sort_by} {order_direction}"
        else:
            select_query += " ORDER BY date_declared DESC"

        # Add pagination
        offset = (page - 1) * limit
        select_query += " LIMIT :limit OFFSET :offset"
        params["limit"] = limit
        params["offset"] = offset

        # Execute query
        results = db.session.execute(text(select_query), params).fetchall()

        events = [cls._row_to_event(row) for row in results if cls._row_to_event(row)]

        return {
            "events": events,
            "total_count": total_count,
            "page": page,
            "limit": limit,
            "total_pages": (total_count + limit - 1) // limit,
        }

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
        # Build dynamic UPDATE query
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
        db.session.commit()

        # Handle center associations if provided
        if "center_ids" in update_data:
            from .event import EventCenter

            # Remove all existing centers
            EventCenter.remove_centers(event_id)
            # Add new centers
            if update_data["center_ids"]:
                EventCenter.add_centers(event_id, update_data["center_ids"])

        return cls._row_to_event(result)

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
                    SELECT ec.center_id, ec.center_name, ec.address, ec.capacity, ec.current_occupancy
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
        """Add centers to an event."""
        for center_id in center_ids:
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
        db.session.commit()

    @classmethod
    def remove_centers(cls, event_id: int, center_ids: List[int] = None) -> None:
        """Remove centers from an event."""
        if center_ids:
            for center_id in center_ids:
                db.session.execute(
                    text(
                        "DELETE FROM event_centers WHERE event_id = :event_id AND center_id = :center_id"
                    ),
                    {"event_id": event_id, "center_id": center_id},
                )
        else:
            db.session.execute(
                text("DELETE FROM event_centers WHERE event_id = :event_id"),
                {"event_id": event_id},
            )
        db.session.commit()

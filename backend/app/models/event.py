"""Event model for EFAS."""

from typing import Any, Dict, List, Optional
from datetime import datetime

from sqlalchemy import text

from app.models import db
from app.schemas.event import EventResponseSchema

import logging

logger = logging.getLogger(__name__)


class Event(db.Model):
    """Event model for managing events."""

    __tablename__ = "events"

    event_id = db.Column(db.Integer, primary_key=True)
    event_name = db.Column(db.String(150), nullable=False, index=True)
    event_type = db.Column(db.String(50), nullable=False)
    date_declared = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(20), nullable=False, default="active")
    capacity = db.Column(db.Integer, nullable=False, default=0)
    max_occupancy = db.Column(db.Integer, nullable=False, default=0)
    usage_percentage = db.Column(db.Numeric(5, 2), nullable=False, default=0.00)
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

        # Extract the additional fields for capacity and occupancy
        event_data = {k: v for k, v in row_dict.items() if hasattr(cls, k)}
        
        event = cls(**event_data)
        
        # Add the additional fields as attributes to the event object
        # Keep existing aggregated fields for backward compatibility
        if 'total_capacity' in row_dict:
            event.total_capacity = row_dict.get('total_capacity', 0)
        if 'total_occupancy' in row_dict:
            event.total_occupancy = row_dict.get('total_occupancy', 0)
        if 'overall_usage_percentage' in row_dict:
            event.overall_usage_percentage = row_dict.get('overall_usage_percentage', 0)
        
        return event

    @classmethod
    def update_event_occupancy(cls, event_id: int, new_occupancy: int) -> Optional["Event"]:
        """Update event's max_occupancy if new_occupancy is higher and recalculate usage_percentage."""
        event = cls.get_by_id(event_id)
        if not event:
            return None

        # Only update if new occupancy is higher than current max_occupancy
        if new_occupancy > event.max_occupancy:
            # Calculate new usage percentage
            new_usage_percentage = 0.00
            if event.capacity > 0:
                new_usage_percentage = round((new_occupancy * 100.0 / event.capacity), 2)
            
            # Update the event
            return cls.update(event_id, {
                "max_occupancy": new_occupancy,
                "usage_percentage": new_usage_percentage
            })
        
        logger.info(f"Max occupancy not updated for event {event_id}: current max_occupancy={event.max_occupancy}, new_occupancy={new_occupancy}")
        
        return event

    @classmethod
    def recalculate_event_capacity(cls, event_id: int) -> Optional["Event"]:
        """Recalculate event capacity and occupancy based on associated centers."""
        # Get sum of capacities and current occupancies from associated centers
        result = db.session.execute(
            text("""
                SELECT 
                    COALESCE(SUM(ec.capacity), 0) as total_capacity,
                    COALESCE(SUM(ec.current_occupancy), 0) as current_occupancy
                FROM event_centers evc
                JOIN evacuation_centers ec ON evc.center_id = ec.center_id
                WHERE evc.event_id = :event_id
            """),
            {"event_id": event_id}
        ).fetchone()

        if not result:
            return None

        total_capacity = result[0] or 0
        current_occupancy = result[1] or 0
        
        # Get current event to check if we need to update max_occupancy
        event = cls.get_by_id(event_id)
        if not event:
            return None

        # Update capacity - always set to total
        update_data = {"capacity": total_capacity}
        
        # Update max_occupancy - use the maximum between current max and new occupancy
        # This ensures max_occupancy tracks the highest occupancy ever reached
        new_max_occupancy = max(current_occupancy, event.max_occupancy)
        update_data["max_occupancy"] = new_max_occupancy
        
        # Calculate usage percentage based on max_occupancy
        if total_capacity > 0:
            update_data["usage_percentage"] = round((new_max_occupancy * 100.0 / total_capacity), 2)
        else:
            update_data["usage_percentage"] = 0.00

        logger.info(
            f"Recalculating event {event_id}: capacity={total_capacity}, "
            f"current_occupancy={current_occupancy}, max_occupancy={new_max_occupancy}, "
            f"usage_percentage={update_data['usage_percentage']}"
        )

        return cls.update(event_id, update_data)

    @classmethod
    def get_all(
        cls,
        search: Optional[str] = None,
        status: Optional[str] = None,
        center_id: Optional[int] = None,
        page: int = 1,
        limit: int = 10,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = "asc",
    ) -> Dict[str, Any]:
        """Get all events with pagination, search, and sorting."""
        # Updated base query to include center capacity and occupancy data
        if center_id:
            base_query = """
                FROM events e
                INNER JOIN event_centers ec ON e.event_id = ec.event_id
                WHERE ec.center_id = :center_id
            """
            count_query = """
                SELECT COUNT(DISTINCT e.event_id) as total_count
                FROM events e
                INNER JOIN event_centers ec ON e.event_id = ec.event_id
                WHERE ec.center_id = :center_id
            """
            params = {"center_id": center_id}
        else:
            base_query = """
                FROM events e
                LEFT JOIN event_centers ec ON e.event_id = ec.event_id
                LEFT JOIN evacuation_centers evc ON ec.center_id = evc.center_id
                WHERE 1=1
            """
            count_query = "SELECT COUNT(DISTINCT e.event_id) as total_count FROM events e WHERE 1=1"
            params = {}

        # Add search filter
        if search:
            if center_id:
                base_query += " AND (LOWER(e.event_name) LIKE LOWER(:search) OR LOWER(e.event_type) LIKE LOWER(:search))"
                count_query += " AND (LOWER(e.event_name) LIKE LOWER(:search) OR LOWER(e.event_type) LIKE LOWER(:search))"
            else:
                base_query += " AND (LOWER(e.event_name) LIKE LOWER(:search) OR LOWER(e.event_type) LIKE LOWER(:search))"
                count_query += " AND (LOWER(e.event_name) LIKE LOWER(:search) OR LOWER(e.event_type) LIKE LOWER(:search))"
            params["search"] = f"%{search}%"

        # Add status filter
        if status:
            if center_id:
                base_query += " AND e.status = :status"
                count_query += " AND e.status = :status"
            else:
                base_query += " AND e.status = :status"
                count_query += " AND e.status = :status"
            params["status"] = status

        # Get total count
        count_result = db.session.execute(text(count_query), params).fetchone()
        total_count = count_result[0] if count_result else 0

        # Build main query - include aggregated capacity and occupancy data
        if center_id:
            select_query = f"SELECT DISTINCT e.* {base_query}"
        else:
            select_query = f"""
                SELECT 
                    e.*,
                    COALESCE(SUM(evc.capacity), 0) as total_capacity,
                    COALESCE(SUM(evc.current_occupancy), 0) as total_occupancy,
                    CASE 
                        WHEN COALESCE(SUM(evc.capacity), 0) > 0 THEN 
                            ROUND((COALESCE(SUM(evc.current_occupancy), 0) * 100.0 / COALESCE(SUM(evc.capacity), 1)), 2)
                        ELSE 0 
                    END as overall_usage_percentage
                {base_query}
                GROUP BY e.event_id
            """

        # Add sorting
        if sort_by and sort_by in [
            "event_name", "event_type", "date_declared", "end_date", 
            "status", "created_at", "capacity", "max_occupancy", "usage_percentage"
        ]:
            order_direction = (
                "DESC" if sort_order and sort_order.lower() == "desc" else "ASC"
            )
            sort_field = f"e.{sort_by}" if center_id else sort_by
            select_query += f" ORDER BY {sort_field} {order_direction}"
        else:
            date_field = "e.date_declared" if center_id else "date_declared"
            select_query += f" ORDER BY {date_field} DESC"

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
    def get_by_id(cls, event_id: int) -> Optional["Event"]:
        """Get event by ID using raw SQL."""
        result = db.session.execute(
            text("SELECT * FROM events WHERE event_id = :event_id"),
            {"event_id": event_id},
        ).fetchone()

        return cls._row_to_event(result)

    @classmethod
    def create(cls, data: Dict[str, Any]) -> "Event":
        """Create a new event using raw SQL."""
        # Check if there's already an active event
        if data.get("status", "active") == "active":
            active_event_result = db.session.execute(
                text("SELECT COUNT(*) FROM events WHERE status = 'active'")
            ).fetchone()
            
            if active_event_result and active_event_result[0] > 0:
                raise ValueError("There is already an active event. Only one event can be active at a time.")

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
        
        if not current_event:
            return None
            
        # Check if event is resolved and trying to update (not allowed)
        if current_event.status == "resolved":
            raise ValueError("Cannot edit a resolved event")

        # Check if trying to make another event active while one is already active
        if update_data.get("status") == "active" and current_event.status != "active":
            active_event_result = db.session.execute(
                text("SELECT COUNT(*) FROM events WHERE status = 'active' AND event_id != :event_id"),
                {"event_id": event_id}
            ).fetchone()
            
            if active_event_result and active_event_result[0] > 0:
                raise ValueError("There is already an active event. Only one event can be active at a time.")

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
        # Check if event exists and is not resolved
        event = cls.get_by_id(event_id)
        if not event:
            return False
            
        if event.status == "resolved":
            raise ValueError("Cannot delete a resolved event")

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

    @classmethod
    def get_current_active_event(cls) -> Optional["Event"]:
        """Get the current active event."""
        result = db.session.execute(
            text("SELECT * FROM events WHERE status = 'active' LIMIT 1")
        ).fetchone()
        
        return cls._row_to_event(result)

    @classmethod
    def validate_event_active_for_center(cls, center_id: int) -> bool:
        """Validate that a center has an active event."""
        result = db.session.execute(
            text("""
                SELECT EXISTS(
                    SELECT 1 FROM event_centers ec
                    JOIN events e ON ec.event_id = e.event_id
                    WHERE ec.center_id = :center_id
                      AND e.status = 'active'
                )
            """),
            {"center_id": center_id}
        ).fetchone()
        
        return result[0] if result else False


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

        db.session.commit()
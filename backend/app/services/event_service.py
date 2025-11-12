"""Service layer for event operations."""

import logging
from typing import Any, Dict, Optional

from app.models.event import Event
from app.schemas.event import EventCreateSchema, EventUpdateSchema

# Configure logger for this module
logger = logging.getLogger(__name__)

# Initialize schemas for validation
create_schema = EventCreateSchema()
update_schema = EventUpdateSchema()


def get_events(
    search: Optional[str] = None,
    status: Optional[str] = None,
    center_id: Optional[int] = None,
    page: int = 1,
    limit: int = 10,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = "asc",
) -> Dict[str, Any]:
    """
    Get all events with filtering, pagination, and sorting.

    Args:
        search: Search term for event name or type
        status: Filter by status
        center_id: Filter by specific center (for center-specific roles)
        page: Page number for pagination
        limit: Number of items per page
        sort_by: Field to sort by
        sort_order: Sort direction (asc/desc)

    Returns:
        Dictionary with events and pagination info
    """
    try:
        result = Event.get_all(
            search=search,
            status=status,
            center_id=center_id,
            page=page,
            limit=limit,
            sort_by=sort_by,
            sort_order=sort_order,
        )

        events_data = []
        for event in result["events"]:
            event_dict = event.to_schema()
            # Add the new capacity, occupancy, and usage percentage fields
            if hasattr(event, 'total_capacity'):
                event_dict['total_capacity'] = event.total_capacity
            if hasattr(event, 'total_occupancy'):
                event_dict['total_occupancy'] = event.total_occupancy
            if hasattr(event, 'overall_usage_percentage') and event.overall_usage_percentage is not None:
                event_dict['overall_usage_percentage'] = float(event.overall_usage_percentage)
            else:
                event_dict['overall_usage_percentage'] = 0.0
            
            # Add the new database-stored fields
            event_dict['capacity'] = event.capacity
            event_dict['max_occupancy'] = event.max_occupancy
            if event.usage_percentage is not None:
                event_dict['usage_percentage'] = float(event.usage_percentage)
            else:
                event_dict['usage_percentage'] = 0.0
            
            events_data.append(event_dict)

        return {
            "success": True,
            "data": {
                "results": events_data,
                "pagination": {
                    "current_page": result["page"],
                    "total_pages": result["total_pages"],
                    "total_items": result["total_count"],
                    "limit": result["limit"],
                },
            },
        }

    except Exception as error:
        logger.error("Error fetching events: %s", str(error))
        return {"success": False, "message": "Failed to fetch events"}

def get_event_by_id(event_id: int) -> Dict[str, Any]:
    """
    Get a specific event by ID.

    Args:
        event_id: Event ID

    Returns:
        Dictionary with event data or error message
    """
    try:
        event = Event.get_by_id(event_id)

        if not event:
            return {"success": False, "message": "Event not found"}

        return {"success": True, "data": event.to_schema()}

    except Exception as error:
        logger.error("Error fetching event %s: %s", event_id, str(error))
        return {"success": False, "message": "Failed to fetch event"}


def create_event(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a new event.

    Args:
        data: Event data

    Returns:
        Dictionary with creation result
    """
    try:
        # Validate input data
        try:
            valid_data = create_schema.load(data)
        except Exception as validation_error:
            return {
                "success": False,
                "message": f"Validation error: {str(validation_error)}",
            }

        # Check if event name already exists
        existing_events = Event.get_all(search=valid_data["event_name"])
        if existing_events["events"]:
            for event in existing_events["events"]:
                if event.event_name.lower() == valid_data["event_name"].lower():
                    return {"success": False, "message": "Event name already exists"}

        # Create new event - now includes capacity fields with default values
        event = Event.create(valid_data)

        # Recalculate capacity for the new event if centers were added
        if "center_ids" in data and data["center_ids"]:
            event = Event.recalculate_event_capacity(event.event_id) or event

        logger.info("Event created: %s", event.event_name)

        return {
            "success": True,
            "message": "Event created successfully",
            "data": event.to_schema(),
        }

    except Exception as error:
        logger.error("Error creating event: %s", str(error))
        return {"success": False, "message": "Failed to create event"}


def update_event(event_id: int, update_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update an event.

    Args:
        event_id: Event ID
        update_data: Fields to update

    Returns:
        Dictionary with update result
    """
    try:
        # Validate input data
        try:
            valid_data = update_schema.load(update_data)
        except Exception as validation_error:
            return {
                "success": False,
                "message": f"Validation error: {str(validation_error)}",
            }

        # Check if event exists
        existing_event = Event.get_by_id(event_id)
        if not existing_event:
            return {"success": False, "message": "Event not found"}

        # Check for duplicate event name if name is being updated
        if "event_name" in valid_data and valid_data["event_name"]:
            existing_events = Event.get_all(search=valid_data["event_name"])
            for event in existing_events["events"]:
                if (
                    event.event_id != event_id
                    and event.event_name.lower() == valid_data["event_name"].lower()
                ):
                    return {"success": False, "message": "Event name already exists"}

        # Update event
        updated_event = Event.update(event_id, valid_data)

        if not updated_event:
            return {"success": False, "message": "Failed to update event"}

        # Recalculate capacity if centers were updated
        if "center_ids" in valid_data:
            updated_event = Event.recalculate_event_capacity(event_id)

        logger.info("Event updated: %s", event_id)

        return {
            "success": True,
            "message": "Event updated successfully",
            "data": updated_event.to_schema(),
        }

    except Exception as error:
        logger.error("Error updating event %s: %s", event_id, str(error))
        return {"success": False, "message": "Failed to update event"}


def delete_event(event_id: int) -> Dict[str, Any]:
    """
    Delete an event.

    Args:
        event_id: Event ID

    Returns:
        Dictionary with deletion result
    """
    try:
        # Check if event exists
        existing_event = Event.get_by_id(event_id)
        if not existing_event:
            return {"success": False, "message": "Event not found"}

        # Delete event
        success = Event.delete(event_id)

        if not success:
            return {"success": False, "message": "Failed to delete event"}

        logger.info("Event deleted: %s", event_id)

        return {"success": True, "message": "Event deleted successfully"}

    except Exception as error:
        logger.error("Error deleting event %s: %s", event_id, str(error))
        return {"success": False, "message": "Failed to delete event"}


def get_event_centers(event_id: int) -> Dict[str, Any]:
    """
    Get centers associated with an event.

    Args:
        event_id: Event ID

    Returns:
        Dictionary with centers data or error message
    """
    try:
        from app.models.event import EventCenter

        centers = EventCenter.get_centers_by_event(event_id)

        # Process centers for frontend
        processed_centers = []
        for center in centers:
            # Calculate occupancy percentage
            capacity = center.get("capacity", 0)
            current_occupancy = center.get("current_occupancy", 0)
            occupancy_percentage = 0
            if capacity > 0:
                occupancy_percentage = int((current_occupancy / capacity) * 100)

            processed_centers.append(
                {
                    "center_id": center["center_id"],
                    "center_name": center["center_name"],
                    "address": center["address"],
                    "capacity": capacity,
                    "current_occupancy": current_occupancy,
                    "occupancy": f"{occupancy_percentage}%",
                }
            )

        return {"success": True, "data": processed_centers}

    except Exception as error:
        logger.error(
            "Error fetching event centers for event %s: %s", event_id, str(error)
        )
        return {"success": False, "message": "Failed to fetch event centers"}


def add_center_to_event(event_id: int, center_id: int) -> Dict[str, Any]:
    """
    Add a center to an event.

    Args:
        event_id: Event ID
        center_id: Center ID

    Returns:
        Dictionary with operation result
    """
    try:
        from app.models.event import EventCenter

        # Check if event exists
        existing_event = Event.get_by_id(event_id)
        if not existing_event:
            return {"success": False, "message": "Event not found"}

        # Add center to event
        EventCenter.add_centers(event_id, [center_id])

        # Recalculate event capacity after adding center
        Event.recalculate_event_capacity(event_id)

        logger.info("Center %s added to event %s", center_id, event_id)

        return {"success": True, "message": "Center added to event successfully"}

    except Exception as error:
        logger.error("Error adding center to event %s: %s", event_id, str(error))
        return {"success": False, "message": "Failed to add center to event"}


def remove_center_from_event(event_id: int, center_id: int) -> Dict[str, Any]:
    """
    Remove a center from an event.

    Args:
        event_id: Event ID
        center_id: Center ID

    Returns:
        Dictionary with operation result
    """
    try:
        from app.models.event import EventCenter

        # Check if event exists
        existing_event = Event.get_by_id(event_id)
        if not existing_event:
            return {"success": False, "message": "Event not found"}

        # Remove center from event
        EventCenter.remove_centers(event_id, [center_id])

        # Recalculate event capacity after removing center
        Event.recalculate_event_capacity(event_id)

        logger.info("Center %s removed from event %s", center_id, event_id)

        return {"success": True, "message": "Center removed from event successfully"}

    except Exception as error:
        logger.error("Error removing center from event %s: %s", event_id, str(error))
        return {"success": False, "message": "Failed to remove center from event"}


def remove_center_from_event(event_id: int, center_id: int) -> Dict[str, Any]:
    """
    Remove a center from an event.

    Args:
        event_id: Event ID
        center_id: Center ID

    Returns:
        Dictionary with operation result
    """
    try:
        from app.models.event import EventCenter

        # Check if event exists
        existing_event = Event.get_by_id(event_id)
        if not existing_event:
            return {"success": False, "message": "Event not found"}

        # Remove center from event
        EventCenter.remove_centers(event_id, [center_id])

        logger.info("Center %s removed from event %s", center_id, event_id)

        return {"success": True, "message": "Center removed from event successfully"}

    except Exception as error:
        logger.error("Error removing center from event %s: %s", event_id, str(error))
        return {"success": False, "message": "Failed to remove center from event"}


def get_event_details(event_id: int) -> Dict[str, Any]:
    """
    Get detailed event information including centers.

    Args:
        event_id: Event ID

    Returns:
        Dictionary with event details or error message
    """
    try:
        from app.models.event import EventCenter

        # Get event
        event = Event.get_by_id(event_id)
        if not event:
            return {"success": False, "message": "Event not found"}

        # Get centers
        centers = EventCenter.get_centers_by_event(event_id)

        # Process centers for frontend - now includes usage_percentage from the query
        processed_centers = []
        for center in centers:
            processed_centers.append(
                {
                    "center_id": center["center_id"],
                    "center_name": center["center_name"],
                    "address": center["address"],
                    "capacity": center["capacity"],
                    "current_occupancy": center["current_occupancy"],
                    "usage_percentage": center.get("usage_percentage", 0),
                    "status": center["status"],
                }
            )

        # Calculate current total occupancy and capacity for the event
        total_capacity = sum(center["capacity"] for center in centers)
        current_occupancy = sum(center["current_occupancy"] for center in centers)
        current_usage_percentage = 0
        if total_capacity > 0:
            current_usage_percentage = round((current_occupancy * 100.0 / total_capacity), 2)

        return {
            "success": True,
            "data": {
                "event_id": event.event_id,
                "event_name": event.event_name,
                "event_type": event.event_type,
                "status": event.status,
                "date_declared": (
                    event.date_declared.isoformat() if event.date_declared else None
                ),
                "end_date": event.end_date.isoformat() if event.end_date else None,
                # Add the new event fields
                "capacity": event.capacity,
                "max_occupancy": event.max_occupancy,
                "usage_percentage": float(event.usage_percentage) if event.usage_percentage else 0.0,
                # Add current calculated fields for real-time display
                "current_capacity": total_capacity,
                "current_occupancy": current_occupancy,
                "current_usage_percentage": current_usage_percentage,
                "evacuation_centers": processed_centers,
            },
        }

    except Exception as error:
        logger.error(
            "Error fetching event details for event %s: %s", event_id, str(error)
        )
        return {"success": False, "message": "Failed to fetch event details"}
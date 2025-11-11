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
    center_id: Optional[int] = None,  # NEW
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
        center_id: Filter by evacuation center ID
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
            center_id=center_id,  # NEW
            page=page,
            limit=limit,
            sort_by=sort_by,
            sort_order=sort_order,
        )

        events_data = [event.to_schema() for event in result["events"]]

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

        # Create new event
        event = Event.create(valid_data)

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
                "evacuation_centers": processed_centers,
            },
        }

    except Exception as error:
        logger.error(
            "Error fetching event details for event %s: %s", event_id, str(error)
        )
        return {"success": False, "message": "Failed to fetch event details"}

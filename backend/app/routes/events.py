"""Flask routes for event operations."""

import logging
from typing import Tuple

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.services.event_service import (
    create_event,
    delete_event,
    get_event_by_id,
    get_events,
    update_event,
)
from app.services.user_service import get_current_user

# Configure logger for this module
logger = logging.getLogger(__name__)

event_bp = Blueprint("event_bp", __name__)


@event_bp.route("/events", methods=["GET"])
@jwt_required()
def get_all_events() -> Tuple:
    """
    Get all events with filtering, pagination, and sorting.

    Query Parameters:
        search (string) - Search in event name or type
        status (string) - Filter by status
        center_id (integer) - Filter by evacuation center ID
        page (integer) - Page number (default: 1)
        limit (integer) - Items per page (default: 10)
        sortBy (string) - Field to sort by
        sortOrder (string) - Sort direction (asc/desc)

    Returns:
        Tuple containing:
            - JSON response with standardized format
            - HTTP status code
    """
    try:
        # Extract query parameters
        search = request.args.get("search", type=str)
        status = request.args.get("status", type=str)
        center_id = request.args.get("center_id", type=int)
        page = request.args.get("page", 1, type=int)
        limit = request.args.get("limit", 10, type=int)
        sort_by = request.args.get("sortBy", type=str)
        sort_order = request.args.get("sortOrder", type=str)

        # Get current user for role-based access control
        current_user_id = get_jwt_identity()
        current_user = get_current_user(current_user_id)
        
        # If user is center_admin or volunteer, restrict to their center
        if current_user and current_user.role in ['center_admin', 'volunteer'] and current_user.center_id:
            if center_id and center_id != current_user.center_id:
                return jsonify({
                    "success": False, 
                    "message": "Access denied: Cannot view events for other centers"
                }), 403
            center_id = current_user.center_id  # Force filter by user's center

        # Validate pagination parameters
        if page < 1:
            return (
                jsonify({"success": False, "message": "Page must be at least 1"}),
                400,
            )

        if limit < 1 or limit > 100:
            return (
                jsonify(
                    {"success": False, "message": "Limit must be between 1 and 100"}
                ),
                400,
            )

        logger.info(
            "Fetching events - search: %s, status: %s, center_id: %s, page: %s, limit: %s, user_role: %s",
            search,
            status,
            center_id,
            page,
            limit,
            current_user.role if current_user else 'unknown',
        )

        # Get events from service
        result = get_events(
            search=search,
            status=status,
            center_id=center_id,
            page=page,
            limit=limit,
            sort_by=sort_by,
            sort_order=sort_order,
        )

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error fetching events: %s", str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while fetching events",
                }
            ),
            500,
        )


@event_bp.route("/events/<int:event_id>", methods=["GET"])
@jwt_required()
def get_event(event_id: int) -> Tuple:
    """
    Get a specific event by ID.

    Args:
        event_id: Event ID

    Returns:
        Tuple containing:
            - JSON response with standardized format
            - HTTP status code
    """
    try:
        # Get current user for role-based access control
        current_user_id = get_jwt_identity()
        current_user = get_current_user(current_user_id)
        
        if current_user and current_user.role in ['center_admin', 'volunteer'] and current_user.center_id:
            from app.models.event import EventCenter
            # Check if event is associated with user's center
            event_centers = EventCenter.get_centers_by_event(event_id)
            user_has_access = any(center['center_id'] == current_user.center_id for center in event_centers)
            
            if not user_has_access:
                return jsonify({
                    "success": False, 
                    "message": "Access denied: Cannot view events for other centers"
                }), 403

        logger.info("Fetching event with ID: %s", event_id)

        result = get_event_by_id(event_id)

        if not result["success"]:
            return jsonify(result), 404

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error fetching event %s: %s", event_id, str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while fetching event",
                }
            ),
            500,
        )


@event_bp.route("/events", methods=["POST"])
@jwt_required()
def create_new_event() -> Tuple:
    """
    Create a new event.

    Request Body:
        event_name (string) - Event name
        event_type (string) - Event type
        date_declared (string) - Date declared
        end_date (string, optional) - End date
        status (string, optional) - Event status (default: active)
        center_ids (array, optional) - Array of center IDs

    Returns:
        Tuple containing:
            - JSON response with standardized format
            - HTTP status code
    """
    try:
        # Get current user for role-based access control
        current_user_id = get_jwt_identity()
        current_user = get_current_user(current_user_id)
        
        # Only super_admin can create events
        if not current_user or current_user.role != 'super_admin':
            return jsonify({
                "success": False, 
                "message": "Access denied: Only super_admin can create events"
            }), 403
        
        # Check if there's already an active event
        from app.models.event import Event
        active_events = Event.get_all(status='active')
        if active_events["total_count"] > 0:
            return jsonify({
                "success": False,
                "message": "Cannot create new event: There is already an active event. Resolve the current event first."
            }), 400

        data = request.get_json()

        if not data:
            return jsonify({"success": False, "message": "No data provided"}), 400

        logger.info("Creating new event: %s", data.get("event_name"))

        result = create_event(data)

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 201

    except Exception as error:
        logger.error("Error creating event: %s", str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while creating event",
                }
            ),
            500,
        )


@event_bp.route("/events/<int:event_id>", methods=["PUT"])
@jwt_required()
def update_existing_event(event_id: int) -> Tuple:
    """
    Update an existing event.

    Args:
        event_id: Event ID

    Request Body:
        event_name (string, optional) - Event name
        event_type (string, optional) - Event type
        date_declared (string, optional) - Date declared
        end_date (string, optional) - End date
        status (string, optional) - Event status
        center_ids (array, optional) - Array of center IDs

    Returns:
        Tuple containing:
            - JSON response with standardized format
            - HTTP status code
    """
    try:
        # Get current user for role-based access control
        current_user_id = get_jwt_identity()
        current_user = get_current_user(current_user_id)
        
        # Only super_admin can update events
        if not current_user or current_user.role != 'super_admin':
            return jsonify({
                "success": False, 
                "message": "Access denied: Only super_admin can update events"
            }), 403

        data = request.get_json()

        if not data:
            return jsonify({"success": False, "message": "No data provided"}), 400

        logger.info("Updating event with ID: %s", event_id)

        result = update_event(event_id, data)

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error updating event %s: %s", event_id, str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while updating event",
                }
            ),
            500,
        )


@event_bp.route("/events/<int:event_id>/resolve", methods=["POST"])
@jwt_required()
def resolve_event(event_id: int) -> Tuple:
    """
    Resolve an event (mark as resolved).
    Args:
        event_id: Event ID
    Returns:
        Tuple containing:
            - JSON response with standardized format
            - HTTP status code
    """
    try:
        # Get current user for role-based access control
        current_user_id = get_jwt_identity()
        current_user = get_current_user(current_user_id)
        
        # Only super_admin can resolve events
        if not current_user or current_user.role != 'super_admin':
            return jsonify({
                "success": False, 
                "message": "Access denied: Only super_admin can resolve events"
            }), 403
        data = request.get_json() or {}
        end_date = data.get('end_date')
        
        if not end_date:
            return jsonify({
                "success": False,
                "message": "End date is required to resolve an event"
            }), 400
        logger.info("Resolving event with ID: %s", event_id)
        # Update event status to resolved and set end date
        from app.models.event import Event
        from datetime import datetime
        
        event = Event.get_by_id(event_id)
        if not event:
            return jsonify({"success": False, "message": "Event not found"}), 404
        
        if event.status == 'resolved':
            return jsonify({"success": False, "message": "Event is already resolved"}), 400
        # Update event status and end date
        update_data = {
            "status": "resolved",
            "end_date": end_date
        }
        
        result = update_event(event_id, update_data)
        
        if not result["success"]:
            return jsonify(result), 400
        # Deactivate all centers associated with this event
        from app.models.evacuation_center import EvacuationCenter
        from app.models.event import EventCenter
        
        event_centers = EventCenter.get_centers_by_event(event_id)
        for center in event_centers:
            EvacuationCenter.update(center['center_id'], {"status": "inactive"})
        
        # Auto-check-out all currently checked-in individuals
        from app.models.attendance_records import AttendanceRecord
        from datetime import datetime
        
        # Get all attendance records for this event
        attendance_result = AttendanceRecord.get_event_attendance(event_id, center_id=None, page=1, limit=1000)
        
        # Handle the result based on its actual structure
        records = []
        if isinstance(attendance_result, dict):
            records = attendance_result.get('records', [])
        elif isinstance(attendance_result, list):
            records = attendance_result
        elif hasattr(attendance_result, '__iter__'):
            records = list(attendance_result)
        
        for record in records:
            # Handle both dict and object attribute access
            record_id = record.get('record_id') if isinstance(record, dict) else getattr(record, 'record_id', None)
            status = record.get('status') if isinstance(record, dict) else getattr(record, 'status', None)
            individual_id = record.get('individual_id') if isinstance(record, dict) else getattr(record, 'individual_id', None)
            
            if status == 'checked_in' and record_id:
                try:
                    AttendanceRecord.check_out_individual(
                        record_id=record_id,
                        check_out_time=datetime.now().isoformat(),
                        notes="Auto-checked out due to event resolution"
                    )
                except Exception as e:
                    logger.warning(f"Failed to auto-check-out individual {individual_id}: {str(e)}")
        
        logger.info(f"Event {event_id} resolved. Centers deactivated and individuals auto-checked out.")
        return jsonify({
            "success": True,
            "message": "Event resolved successfully. All associated centers have been deactivated and individuals have been auto-checked out.",
            "data": result.get("data", {})
        }), 200
    except Exception as error:
        logger.error("Error resolving event %s: %s", event_id, str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while resolving event",
                }
            ),
            500,
        )


@event_bp.route("/events/<int:event_id>", methods=["DELETE"])
@jwt_required()
def delete_existing_event(event_id: int) -> Tuple:
    """
    Delete an event.

    Args:
        event_id: Event ID

    Returns:
        Tuple containing:
            - JSON response with standardized format
            - HTTP status code
    """
    try:
        # Get current user for role-based access control
        current_user_id = get_jwt_identity()
        current_user = get_current_user(current_user_id)
        
        # Only super_admin can delete events
        if not current_user or current_user.role != 'super_admin':
            return jsonify({
                "success": False, 
                "message": "Access denied: Only super_admin can delete events"
            }), 403

        logger.info("Deleting event with ID: %s", event_id)

        result = delete_event(event_id)

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error deleting event %s: %s", event_id, str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while deleting event",
                }
            ),
            500,
        )


@event_bp.route("/events/<int:event_id>/centers", methods=["GET"])
@jwt_required()
def get_event_centers(event_id: int) -> Tuple:
    """
    Get centers associated with an event.

    Args:
        event_id: Event ID

    Returns:
        Tuple containing:
            - JSON response with standardized format
            - HTTP status code
    """
    try:
        from app.services.event_service import get_event_centers

        logger.info("Fetching centers for event ID: %s", event_id)

        result = get_event_centers(event_id)

        if not result["success"]:
            return jsonify(result), 404

        return jsonify(result), 200

    except Exception as error:
        logger.error(
            "Error fetching event centers for event %s: %s", event_id, str(error)
        )
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while fetching event centers",
                }
            ),
            500,
        )


@event_bp.route("/events/<int:event_id>/centers", methods=["POST"])
@jwt_required()
def add_event_center(event_id: int) -> Tuple:
    """
    Add a center to an event.

    Args:
        event_id: Event ID

    Request Body:
        center_id (integer) - Center ID

    Returns:
        Tuple containing:
            - JSON response with standardized format
            - HTTP status code
    """
    try:
        # Get current user for role-based access control
        current_user_id = get_jwt_identity()
        current_user = get_current_user(current_user_id)
        
        # Only super_admin can add centers to events
        if not current_user or current_user.role != 'super_admin':
            return jsonify({
                "success": False, 
                "message": "Access denied: Only super_admin can add centers to events"
            }), 403

        from app.services.event_service import add_center_to_event
        from app.schemas.event import AddCenterSchema

        add_center_schema = AddCenterSchema()
        data = add_center_schema.load(request.get_json())

        logger.info("Adding center %s to event %s", data["center_id"], event_id)

        result = add_center_to_event(event_id, data["center_id"])

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error adding center to event %s: %s", event_id, str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while adding center to event",
                }
            ),
            500,
        )


@event_bp.route("/events/<int:event_id>/centers/<int:center_id>", methods=["DELETE"])
@jwt_required()
def remove_event_center(event_id: int, center_id: int) -> Tuple:
    """
    Remove a center from an event.

    Args:
        event_id: Event ID
        center_id: Center ID

    Returns:
        Tuple containing:
            - JSON response with standardized format
            - HTTP status code
    """
    try:
        # Get current user for role-based access control
        current_user_id = get_jwt_identity()
        current_user = get_current_user(current_user_id)
        
        # Only super_admin can remove centers from events
        if not current_user or current_user.role != 'super_admin':
            return jsonify({
                "success": False, 
                "message": "Access denied: Only super_admin can remove centers from events"
            }), 403

        from app.services.event_service import remove_center_from_event

        logger.info("Removing center %s from event %s", center_id, event_id)

        result = remove_center_from_event(event_id, center_id)

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error removing center from event %s: %s", event_id, str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while removing center from event",
                }
            ),
            500,
        )


@event_bp.route("/events/<int:event_id>/details", methods=["GET"])
@jwt_required()
def get_event_details(event_id: int) -> Tuple:
    """
    Get detailed event information including centers.

    Args:
        event_id: Event ID

    Returns:
        Tuple containing:
            - JSON response with standardized format
            - HTTP status code
    """
    try:
        from app.services.event_service import get_event_details

        logger.info("Fetching details for event ID: %s", event_id)

        result = get_event_details(event_id)

        if not result["success"]:
            return jsonify(result), 404

        return jsonify(result), 200

    except Exception as error:
        logger.error(
            "Error fetching event details for event %s: %s", event_id, str(error)
        )
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while fetching event details",
                }
            ),
            500,
        )


@event_bp.route("/events/active", methods=["GET"])
@jwt_required()
def get_active_event() -> Tuple:
    """
    Get the currently active event.

    Returns:
        Tuple containing:
            - JSON response with active event data
            - HTTP status code
    """
    try:
        from app.models.event import Event
        
        active_events = Event.get_all(status='active', limit=1)
        
        if active_events["total_count"] == 0:
            return jsonify({
                "success": True,
                "data": None,
                "message": "No active event found"
            }), 200
        
        event = active_events["events"][0]
        event_dict = event.to_schema()
        
        # Add capacity fields
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
        
        return jsonify({
            "success": True,
            "data": event_dict,
            "message": "Active event found"
        }), 200

    except Exception as error:
        logger.error("Error fetching active event: %s", str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while fetching active event",
                }
            ),
            500,
        )
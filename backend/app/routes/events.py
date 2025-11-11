"""Flask routes for event operations."""

import logging
from typing import Tuple

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt

from app.services.event_service import (
    create_event,
    delete_event,
    get_event_by_id,
    get_events,
    update_event,
)

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

        # For center-specific roles, automatically filter by their center_id
        # This ensures security - users can only see events for their assigned centers
        current_user = get_jwt()
        user_role = current_user.get('role')
        user_center_id = current_user.get('center_id')
        
        # If user is center_admin or volunteer, restrict to their center
        if user_role in ['center_admin', 'volunteer'] and user_center_id:
            if center_id and center_id != user_center_id:
                return jsonify({
                    "success": False, 
                    "message": "Access denied: Cannot view events for other centers"
                }), 403
            center_id = user_center_id  # Force filter by user's center

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
            user_role,
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
        # For center-specific roles, verify they have access to this event
        from app.models.user import User
        
        jwt_claims = get_jwt()
        user_id = jwt_claims.get('sub')
        user = User.get_by_id(int(user_id)) if user_id else None
        
        user_role = user.role if user else None
        user_center_id = user.center_id if user else None
        
        if user_role in ['center_admin', 'volunteer'] and user_center_id:
            from app.models.event import EventCenter
            # Check if event is associated with user's center
            event_centers = EventCenter.get_centers_by_event(event_id)
            user_has_access = any(center['center_id'] == user_center_id for center in event_centers)
            
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
        # For center-specific roles, restrict which centers they can add
        from app.models.user import User
        
        jwt_claims = get_jwt()
        user_id = jwt_claims.get('sub')
        user = User.get_by_id(int(user_id)) if user_id else None
        
        user_role = user.role if user else None
        user_center_id = user.center_id if user else None
        
        data = request.get_json()

        if not data:
            return jsonify({"success": False, "message": "No data provided"}), 400

        # Center admins and volunteers can only create events for their own center
        if user_role in ['center_admin', 'volunteer'] and user_center_id:
            if 'center_ids' in data:
                # Ensure they only include their own center
                if data['center_ids'] != [user_center_id]:
                    return jsonify({
                        "success": False, 
                        "message": "Access denied: Can only create events for your assigned center"
                    }), 403
            else:
                # Auto-assign their center if not provided
                data['center_ids'] = [user_center_id]

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

    Returns:
        Tuple containing:
            - JSON response with standardized format
            - HTTP status code
    """
    try:
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

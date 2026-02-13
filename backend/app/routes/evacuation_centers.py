"""Flask routes for evacuation center operations."""

import logging
from typing import Tuple

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from app.services.s3_service import S3Service
from sqlalchemy import text

from app.models import db
from app.services.evacuation_center_service import (
    create_center,
    delete_center,
    get_center_by_id,
    get_centers,
    update_center,
    get_all_centers,
    get_city_summary,
    get_centers_by_proximity,
    get_centers_in_bounds,
)

# Configure logger for this module
logger = logging.getLogger(__name__)

evacuation_center_bp = Blueprint("evacuation_center_bp", __name__)


@evacuation_center_bp.route("/evacuation_centers", methods=["GET"])
@jwt_required()
def get_centers_route() -> Tuple:
    """
    Get all evacuation centers with filtering, pagination, and sorting.

    Query Parameters:
        search (string) - Search in center name or address
        status (string) - Filter by status
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
        page = request.args.get("page", 1, type=int)
        limit = request.args.get("limit", 10, type=int)
        sort_by = request.args.get("sortBy", type=str)
        sort_order = request.args.get("sortOrder", type=str)

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
            "Fetching centers - search: %s, status: %s, page: %s, limit: %s",
            search,
            status,
            page,
            limit,
        )

        # Get centers from service
        result = get_centers(
            search=search,
            status=status,
            page=page,
            limit=limit,
            sort_by=sort_by,
            sort_order=sort_order,
        )

        if result["success"] and "data" in result and "results" in result["data"]:
            from app.services.s3_service import S3Service
            s3_service = S3Service()
            
            for center in result["data"]["results"]:
                if center.get("s3_key"):
                    center["photo_url"] = s3_service.generate_download_url(
                        center["s3_key"],
                        expires_in=3600
                    )

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error fetching evacuation centers: %s", str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while fetching centers",
                }
            ),
            500,
        )


@evacuation_center_bp.route("/evacuation_centers/all", methods=["GET"])
@jwt_required()
def get_all_centers_no_pagination_route() -> Tuple:
    """
    Get all evacuation centers without pagination for dropdowns and maps.

    Returns:
        Tuple containing:
            - JSON response with all centers
            - HTTP status code
    """
    try:
        logger.info("Fetching all evacuation centers without pagination")

        # Get all centers without pagination
        result = get_all_centers()

        if not result["success"]:
            return jsonify(result), 400

        # Return just the centers array without pagination metadata
        return jsonify(result), 200

    except Exception as error:
        logger.error("Error fetching all evacuation centers: %s", str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while fetching all centers",
                }
            ),
            500,
        )


@evacuation_center_bp.route("/evacuation_centers/<int:center_id>", methods=["GET"])
@jwt_required()
def get_center_route(center_id: int) -> Tuple:
    """
    Get a specific evacuation center by ID.

    Args:
        center_id: Center ID

    Returns:
        Tuple containing:
            - JSON response with standardized format
            - HTTP status code
    """
    try:
        logger.info("Fetching center with ID: %s", center_id)

        result = get_center_by_id(center_id)

        if result["data"].get("s3_key"):
            from app.services.s3_service import S3Service
            s3_service = S3Service()
            result["data"]["photo_url"] = s3_service.generate_download_url(
                result["data"]["s3_key"],
                expires_in=3600
            )

        if not result["success"]:
            return jsonify(result), 404

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error fetching center %s: %s", center_id, str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while fetching center",
                }
            ),
            500,
        )
    


@evacuation_center_bp.route("/evacuation_centers/<int:center_id>/status", methods=["GET"])
@jwt_required()
def get_center_status(center_id: int) -> Tuple:
    """
    Get the status of a center and validate if attendance can be taken.
    
    Args:
        center_id: Center ID
        
    Returns:
        Tuple containing:
            - JSON response with center status and validation info
            - HTTP status code
    """
    try:
        from app.models.evacuation_center import EvacuationCenter
        from app.models.event import Event
        
        logger.info("Checking status for center ID: %s", center_id)
        
        # Get center
        center = EvacuationCenter.get_by_id(center_id)
        if not center:
            return jsonify({
                "success": False,
                "message": "Center not found"
            }), 404
        
        # Check if center is active
        if center.status != 'active':
            return jsonify({
                "success": True,
                "data": {
                    "center_id": center_id,
                    "status": center.status,
                    "can_take_attendance": False,
                    "message": f"Center is {center.status}. Only active centers can accept attendance."
                }
            }), 200
        
        # Check if there's an active event
        active_events = Event.get_all(status='active', limit=1)
        if active_events["total_count"] == 0:
            return jsonify({
                "success": True,
                "data": {
                    "center_id": center_id,
                    "status": center.status,
                    "can_take_attendance": False,
                    "message": "No active event found. An event must be active to take attendance."
                }
            }), 200
        
        active_event = active_events["events"][0]
        
        # Check if center is associated with the active event
        from app.models.event import EventCenter
        event_centers = EventCenter.get_centers_by_event(active_event.event_id)
        is_center_in_event = any(ec['center_id'] == center_id for ec in event_centers)
        
        if not is_center_in_event:
            return jsonify({
                "success": True,
                "data": {
                    "center_id": center_id,
                    "status": center.status,
                    "can_take_attendance": False,
                    "message": f"Center is not associated with the active event '{active_event.event_name}'."
                }
            }), 200
        
        # All validations passed
        return jsonify({
            "success": True,
            "data": {
                "center_id": center_id,
                "status": center.status,
                "can_take_attendance": True,
                "active_event": {
                    "event_id": active_event.event_id,
                    "event_name": active_event.event_name,
                    "event_type": active_event.event_type,
                    "date_declared": active_event.date_declared.isoformat() if active_event.date_declared else None
                },
                "message": "Center is ready to accept attendance."
            }
        }), 200
        
    except Exception as error:
        logger.error("Error checking center status %s: %s", center_id, str(error))
        return (
            jsonify({
                "success": False,
                "message": "Internal server error while checking center status"
            }),
            500
        )


@evacuation_center_bp.route(
    "/evacuation_centers/<int:center_id>/events", methods=["GET"]
)
@jwt_required()
def get_center_events(center_id: int):
    """
    Get all events associated with a specific evacuation center.
    Uses the event_centers junction table for efficient querying.
    """
    try:
        # Direct SQL query using the event_centers junction table
        query = """
            SELECT e.* 
            FROM events e
            JOIN event_centers ec ON e.event_id = ec.event_id
            WHERE ec.center_id = :center_id
            ORDER BY e.date_declared DESC
        """
        result = db.session.execute(text(query), {"center_id": center_id})
        events = [dict(row._mapping) for row in result.fetchall()]

        return jsonify({"success": True, "data": events}), 200

    except Exception as error:
        logger.error("Error fetching center events: %s", str(error))
        return (
            jsonify({"success": False, "message": "Failed to fetch center events"}),
            500,
        )


@evacuation_center_bp.route("/evacuation_centers", methods=["POST"])
@jwt_required()
def create_new_center_route() -> Tuple:
    """
    Create a new evacuation center.

    Request Body (application/json):
        center_name (string) - Center name
        address (string) - Center address
        latitude (float) - Latitude coordinate
        longitude (float) - Longitude coordinate
        capacity (integer) - Center capacity
        current_occupancy (integer, optional) - Current occupancy (default: 0)
        status (string, optional) - Center status (default: active)
        s3Key (string, optional) - S3 key for uploaded photo
        fileName (string, optional) - Original filename

    Returns:
        Tuple containing:
            - JSON response with standardized format
            - HTTP status code
    """
    try:
        # Get JSON data (no multipart/form-data)
        data = request.get_json()
        
        if not data:
            return jsonify({"success": False, "message": "No data provided"}), 400

        logger.info("Creating new evacuation center: %s", data.get("center_name"))
        
        result = create_center(data)

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 201

    except Exception as error:
        logger.error("Error creating evacuation center: %s", str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while creating center",
                }
            ),
            500,
        )
    

@evacuation_center_bp.route("/evacuation_centers/<int:center_id>", methods=["PUT"])
@jwt_required()
def update_existing_center_route(center_id: int) -> Tuple:
    """
    Update an existing evacuation center.

    Args:
        center_id: Center ID to update

    Request Body (application/json):
        center_name (string, optional) - Center name
        address (string, optional) - Center address
        latitude (float, optional) - Latitude coordinate
        longitude (float, optional) - Longitude coordinate
        capacity (integer, optional) - Center capacity
        current_occupancy (integer, optional) - Current occupancy
        status (string, optional) - Center status
        s3Key (string, optional) - New S3 key for photo
        remove_photo (boolean, optional) - Set to true to remove existing photo

    Returns:
        Tuple containing:
            - JSON response with standardized format
            - HTTP status code
    """
    try:
        # Get JSON data (no multipart/form-data)
        data = request.get_json()
        
        if not data:
            return jsonify({"success": False, "message": "No data provided"}), 400

        logger.info("Updating center with ID: %s", center_id)

        result = update_center(
            center_id, 
            data, 
            photo_file=None, 
            remove_photo=data.get("remove_photo", False)
        )

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error updating center %s: %s", center_id, str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while updating center",
                }
            ),
            500,
        )
    

@evacuation_center_bp.route("/evacuation_centers/<int:center_id>", methods=["DELETE"])
@jwt_required()
def delete_existing_center_route(center_id: int) -> Tuple:
    """
    Delete an evacuation center.

    Args:
        center_id: Center ID

    Returns:
        Tuple containing:
            - JSON response with standardized format
            - HTTP status code
    """
    try:
        logger.info("Deleting center with ID: %s", center_id)

        result = delete_center(center_id)

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error deleting center %s: %s", center_id, str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while deleting center",
                }
            ),
            500,
        )


@evacuation_center_bp.route("/evacuation_centers/summary", methods=["GET"])
@jwt_required()
def get_city_summary_route() -> Tuple:
    """
    Get aggregated summary of all evacuation centers in Iligan City.
    
    Returns:
        Tuple containing:
            - JSON response with summary data
            - HTTP status code
            
    Response format:
        {
            "success": true,
            "data": {
                "total_capacity": 5000,
                "total_current_occupancy": 2500,
                "usage_percentage": 50,
                "status": "active",
                "active_centers_count": 12,
                "total_centers_count": 15
            }
        }
    """
    try:
        logger.info("Fetching Iligan City evacuation centers summary")
        
        result = get_city_summary()
        
        if not result["success"]:
            return jsonify(result), 400
        
        return jsonify(result), 200
        
    except Exception as error:
        logger.error("Error fetching city summary: %s", str(error))
        return (
            jsonify({
                "success": False,
                "message": "Internal server error while fetching city summary"
            }),
            500
        )


@evacuation_center_bp.route("/evacuation_centers/nearby", methods=["GET"])
@jwt_required()
def get_nearby_centers_route() -> Tuple:
    """
    Find evacuation centers within a specified radius of given coordinates.
    
    Query Parameters:
        lat (float) - Latitude of reference point (required)
        lng (float) - Longitude of reference point (required)
        radius (float) - Search radius in kilometers (default: 10.0)
        limit (int) - Maximum number of results to return (default: 10)
        
    Returns:
        Tuple containing:
            - JSON response with centers data including distance
            - HTTP status code
    """
    try:
        # Extract query parameters
        latitude = request.args.get("lat", type=float)
        longitude = request.args.get("lng", type=float)
        radius = request.args.get("radius", 10.0, type=float)
        limit = request.args.get("limit", 10, type=int)
        
        # Validate required parameters
        if latitude is None or longitude is None:
            return jsonify({
                "success": False,
                "message": "Latitude (lat) and longitude (lng) parameters are required"
            }), 400
            
        if radius <= 0:
            return jsonify({
                "success": False,
                "message": "Radius must be greater than 0"
            }), 400
            
        if limit <= 0 or limit > 100:
            return jsonify({
                "success": False,
                "message": "Limit must be between 1 and 100"
            }), 400
            
        logger.info(
            "Finding centers near coordinates: (%s, %s), radius: %skm, limit: %s",
            latitude, longitude, radius, limit
        )
        
        result = get_centers_by_proximity(
            latitude=latitude,
            longitude=longitude,
            radius_km=radius,
            limit=limit
        )
        
        if not result["success"]:
            return jsonify(result), 400
            
        return jsonify(result), 200
        
    except Exception as error:
        logger.error("Error finding nearby centers: %s", str(error))
        return (
            jsonify({
                "success": False,
                "message": "Internal server error while finding nearby centers"
            }),
            500
        )


@evacuation_center_bp.route("/evacuation_centers/in-bounds", methods=["GET"])
@jwt_required()
def get_centers_in_bounds_route() -> Tuple:
    """
    Get all centers within a geographic bounding box.
    Useful for map viewport filtering.
    
    Query Parameters:
        north (float) - Northern boundary latitude (required)
        south (float) - Southern boundary latitude (required)
        east (float) - Eastern boundary longitude (required)
        west (float) - Western boundary longitude (required)
        status (string) - Filter by status (optional, default: "active")
        
    Returns:
        Tuple containing:
            - JSON response with centers data
            - HTTP status code
    """
    try:
        # Extract query parameters
        north = request.args.get("north", type=float)
        south = request.args.get("south", type=float)
        east = request.args.get("east", type=float)
        west = request.args.get("west", type=float)
        status = request.args.get("status", "active")
        
        # Validate required parameters
        if None in [north, south, east, west]:
            return jsonify({
                "success": False,
                "message": "All bounding box parameters (north, south, east, west) are required"
            }), 400
            
        logger.info(
            "Finding centers in bounds: north=%s, south=%s, east=%s, west=%s, status=%s",
            north, south, east, west, status
        )
        
        result = get_centers_in_bounds(
            north=north,
            south=south,
            east=east,
            west=west,
            status=status
        )
        
        if not result["success"]:
            return jsonify(result), 400
            
        return jsonify(result), 200
        
    except Exception as error:
        logger.error("Error finding centers in bounds: %s", str(error))
        return (
            jsonify({
                "success": False,
                "message": "Internal server error while finding centers in bounds"
            }),
            500
        )


@evacuation_center_bp.route("/evacuation_centers/upload-url", methods=["POST"])
@jwt_required()
def get_upload_url():
    """
    Generate a presigned URL for direct S3 upload.
    Frontend can use this to upload photos directly to S3.
    """
    try:
        data = request.get_json()
        file_name = data.get("fileName")
        file_type = data.get("fileType")
        
        if not file_name or not file_type:
            return jsonify({
                "success": False,
                "message": "fileName and fileType are required"
            }), 400
        
        s3_service = S3Service()

        print(file_name, file_type)
        
        upload_data = s3_service.generate_upload_url(
            file_name=file_name,
            file_type=file_type,
        )

        print(upload_data)
        
        if not upload_data:
            return jsonify({
                "success": False,
                "message": "Failed to generate upload URL"
            }), 500
        
        return jsonify({
            "success": True,
            "data": {
                "uploadUrl": upload_data["url"],
                "s3Key": upload_data["key"],
                "bucket": upload_data["bucket"]
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error generating upload URL: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Failed to generate upload URL"
        }), 500
    

@evacuation_center_bp.route("/evacuation_centers/delete-url", methods=["POST"])
@jwt_required()
def get_delete_url():
    """
    Generate a presigned URL for S3 deletion.
    Frontend uses this to delete photos from S3.
    """
    try:
        data = request.get_json()
        s3_key = data.get("s3Key")
        
        if not s3_key:
            return jsonify({
                "success": False,
                "message": "s3Key is required"
            }), 400
        
        s3_service = S3Service()
        
        delete_url = s3_service.generate_delete_url(s3_key)
        
        if not delete_url:
            return jsonify({
                "success": False,
                "message": "Failed to generate delete URL"
            }), 500
        
        return jsonify({
            "success": True,
            "data": {
                "deleteUrl": delete_url,
                "s3Key": s3_key
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error generating delete URL: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Failed to generate delete URL"
        }), 500
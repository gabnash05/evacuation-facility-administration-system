"""Flask routes for evacuation center operations."""

import logging
from typing import Any, Dict, Tuple

from flask import Blueprint, jsonify, request

from app.services.center_service import (
    create_center,
    delete_center,
    get_all_centers,
    get_center_by_id,
    update_center,
)

# Configure logger for this module
logger = logging.getLogger(__name__)

center_bp = Blueprint("center_bp", __name__)


@center_bp.route("/api/centers", methods=["GET"])
def get_centers() -> Tuple[Dict[str, Any], int]:
    """
    Retrieve all evacuation centers with optional filtering and pagination.

    Query Parameters:
        search (string) - Filter by address
        status (string) - Filter by status (open, full, closed)
        page (integer) - Page number (default: 1)
        limit (integer) - Items per page (default: 10)

    Returns:
        Tuple containing:
            - JSON response with standardized format
            - HTTP status code
    """
    try:
        # Extract query parameters
        search = request.args.get("search", "")
        status = request.args.get("status", "")
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))

        logger.info(
            "Fetching evacuation centers with filters: search=%s, status=%s",
            search,
            status,
        )

        # Get centers with pagination and filtering
        centers_data = get_all_centers(
            search=search, status=status, page=page, limit=limit
        )

        response = {
            "success": True,
            "message": "Centers retrieved successfully",
            "data": {
                "results": centers_data["results"],
                "pagination": centers_data["pagination"],
            },
        }
        return jsonify(response), 200

    except Exception as error:
        logger.error("Error fetching evacuation centers: %s", str(error))
        return jsonify({"success": False, "message": "Internal server error"}), 500


@center_bp.route("/api/centers", methods=["POST"])
def create_new_center() -> Tuple[Dict[str, Any], int]:
    """
    Create a new evacuation center.

    Request Body:
        {
            "address": "string",
            "capacity": 0,
            "status": "open"
        }

    Returns:
        Tuple containing standardized response
    """
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ["address", "capacity"]
        for field in required_fields:
            if field not in data:
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": f"Missing required field: {field}",
                        }
                    ),
                    400,
                )

        logger.info("Creating new evacuation center at: %s", data["address"])

        # Create center and get ID
        center_id = create_center(data)

        response = {
            "success": True,
            "message": "Center created successfully",
            "data": {"center_id": center_id},
        }
        return jsonify(response), 201

    except Exception as error:
        logger.error("Error creating evacuation center: %s", str(error))
        return jsonify({"success": False, "message": "Internal server error"}), 500


@center_bp.route("/api/centers/<int:center_id>", methods=["GET"])
def get_center(center_id: int) -> Tuple[Dict[str, Any], int]:
    """
    Retrieve specific center details.

    Path Parameters:
        center_id (integer) - ID of the center to retrieve

    Returns:
        Tuple containing standardized response
    """
    try:
        logger.info("Fetching center with ID: %d", center_id)

        center = get_center_by_id(center_id)

        if not center:
            return jsonify({"success": False, "message": "Center not found"}), 404

        response = {
            "success": True,
            "message": "Center retrieved successfully",
            "data": center,
        }
        return jsonify(response), 200

    except Exception as error:
        logger.error("Error fetching center %d: %s", center_id, str(error))
        return jsonify({"success": False, "message": "Internal server error"}), 500


@center_bp.route("/api/centers/<int:center_id>", methods=["PUT"])
def update_center_info(center_id: int) -> Tuple[Dict[str, Any], int]:
    """
    Update evacuation center info.

    Path Parameters:
        center_id (integer) - ID of the center to update

    Request Body:
        { "status": "full" }

    Returns:
        Tuple containing standardized response
    """
    try:
        data = request.get_json()

        logger.info("Updating center with ID: %d", center_id)

        success = update_center(center_id, data)

        if not success:
            return jsonify({"success": False, "message": "Center not found"}), 404

        response = {"success": True, "message": "Center updated successfully"}
        return jsonify(response), 200

    except Exception as error:
        logger.error("Error updating center %d: %s", center_id, str(error))
        return jsonify({"success": False, "message": "Internal server error"}), 500


@center_bp.route("/api/centers/<int:center_id>", methods=["DELETE"])
def delete_center_route(center_id: int) -> Tuple[Dict[str, Any], int]:
    """
    Delete an evacuation center.

    Path Parameters:
        center_id (integer) - ID of the center to delete

    Returns:
        Tuple containing standardized response
    """
    try:
        logger.info("Deleting center with ID: %d", center_id)

        success = delete_center(center_id)

        if not success:
            return jsonify({"success": False, "message": "Center not found"}), 404

        response = {"success": True, "message": "Center deleted successfully"}
        return jsonify(response), 200

    except Exception as error:
        logger.error("Error deleting center %d: %s", center_id, str(error))
        return jsonify({"success": False, "message": "Internal server error"}), 500

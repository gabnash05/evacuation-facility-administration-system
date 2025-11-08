"""Flask routes for evacuation center operations."""

import logging
from typing import Tuple

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from app.services.evacuation_center_service import (
    create_center,
    delete_center,
    get_center_by_id,
    get_centers,
    update_center,
)

# Configure logger for this module
logger = logging.getLogger(__name__)

evacuation_center_bp = Blueprint("evacuation_center_bp", __name__)


@evacuation_center_bp.route("/evacuation_centers", methods=["GET"])
@jwt_required()
def get_all_centers() -> Tuple:
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


@evacuation_center_bp.route("/evacuation_centers/<int:center_id>", methods=["GET"])
@jwt_required()
def get_center(center_id: int) -> Tuple:
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


@evacuation_center_bp.route("/evacuation_centers", methods=["POST"])
# @jwt_required()
def create_new_center() -> Tuple:
    """
    Create a new evacuation center.

    Request Body (multipart/form-data):
        center_name (string) - Center name
        address (string) - Center address
        capacity (integer) - Center capacity
        current_occupancy (integer, optional) - Current occupancy (default: 0)
        status (string, optional) - Center status (default: active)
        photo (file, optional) - Center photo

    Returns:
        Tuple containing:
            - JSON response with standardized format
            - HTTP status code
    """
    try:
        # Check if request is multipart/form-data for file upload
        if request.content_type and "multipart/form-data" in request.content_type:
            data = {
                "center_name": request.form.get("center_name"),
                "address": request.form.get("address"),
                "capacity": request.form.get("capacity", type=int),
                "current_occupancy": request.form.get("current_occupancy", 0, type=int),
                "status": request.form.get("status", "active"),
            }
            photo_file = request.files.get("photo")
        else:
            data = request.get_json()
            photo_file = None

        if not data:
            return jsonify({"success": False, "message": "No data provided"}), 400

        logger.info("Creating new evacuation center: %s", data.get("center_name"))

        result = create_center(data, photo_file)

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
def update_existing_center(center_id: int) -> Tuple:
    try:
        # Check if request is multipart/form-data for file upload
        if request.content_type and "multipart/form-data" in request.content_type:
            data = {
                "center_name": request.form.get("center_name"),
                "address": request.form.get("address"),
                "capacity": request.form.get("capacity", type=int),
                "current_occupancy": request.form.get("current_occupancy", type=int),
                "status": request.form.get("status"),
            }
            # Remove None values
            data = {k: v for k, v in data.items() if v is not None}
            photo_file = request.files.get("photo")
            remove_photo = (
                request.form.get("remove_photo") == "true"
            )  # This should be working
        else:
            data = request.get_json()
            photo_file = None
            remove_photo = False

        if not data and not photo_file and not remove_photo:
            return jsonify({"success": False, "message": "No data provided"}), 400

        logger.info(
            "Updating center with ID: %s, remove_photo: %s", center_id, remove_photo
        )

        result = update_center(
            center_id, data, photo_file, remove_photo
        )  # This calls the service

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
def delete_existing_center(center_id: int) -> Tuple:
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

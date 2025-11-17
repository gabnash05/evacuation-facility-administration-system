"""Flask routes for attendance operations."""

import logging
from typing import Tuple

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.services.attendance_records_service import (
    get_attendance_records,
    get_attendance_record_by_id,
    check_in_individual,
    check_out_individual,
    transfer_individual,
    get_current_evacuees_by_center,
    get_all_current_evacuees,
    get_attendance_summary_by_center,
    get_individual_attendance_history,
    get_transfer_records,
    get_event_attendance,
    recalculate_center_occupancy,
    recalculate_all_center_occupancies,
    delete_attendance_record,
)

# Configure logger for this module
logger = logging.getLogger(__name__)

attendance_bp = Blueprint("attendance_bp", __name__)


@attendance_bp.route("/attendance", methods=["GET"])
@jwt_required()
def get_attendance_records_route() -> Tuple:
    """
    Get all attendance records with filtering, pagination, and sorting.

    Query Parameters:
        center_id (integer) - Filter by center ID
        individual_id (integer) - Filter by individual ID
        event_id (integer) - Filter by event ID
        household_id (integer) - Filter by household ID
        status (string) - Filter by status (checked_in, checked_out, transferred)
        date (string) - Filter by date (YYYY-MM-DD)
        page (integer) - Page number (default: 1)
        limit (integer) - Items per page (default: 10)
        sort_by (string) - Field to sort by
        sort_order (string) - Sort direction (asc/desc)

    Returns:
        Tuple containing:
            - JSON response with standardized format
            - HTTP status code
    """
    try:
        # Extract query parameters
        center_id = request.args.get("center_id", type=int)
        individual_id = request.args.get("individual_id", type=int)
        event_id = request.args.get("event_id", type=int)
        household_id = request.args.get("household_id", type=int)
        status = request.args.get("status", type=str)
        date = request.args.get("date", type=str)
        page = request.args.get("page", 1, type=int)
        limit = request.args.get("limit", 10, type=int)
        sort_by = request.args.get("sort_by", type=str)
        sort_order = request.args.get("sort_order", "desc", type=str)

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
            "Fetching attendance records - center_id: %s, event_id: %s, status: %s, page: %s, limit: %s",
            center_id,
            event_id,
            status,
            page,
            limit,
        )

        # Get attendance records from service
        result = get_attendance_records(
            center_id=center_id,
            individual_id=individual_id,
            event_id=event_id,
            household_id=household_id,
            status=status,
            date=date,
            page=page,
            limit=limit,
            sort_by=sort_by,
            sort_order=sort_order,
        )

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error fetching attendance records: %s", str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while fetching attendance records",
                }
            ),
            500,
        )


@attendance_bp.route("/attendance/current", methods=["GET"])
@jwt_required()
def get_current_attendees_route() -> Tuple:
    """
    Get all currently checked-in attendees (per evacuation center or for all centers).

    Query Parameters:
        center_id (integer, optional) - Specific center ID, if not provided returns all centers
        page (integer) - Page number (default: 1)
        limit (integer) - Items per page (default: 10)

    Returns:
        Tuple containing:
            - JSON response with current attendees
            - HTTP status code
    """
    try:
        center_id = request.args.get("center_id", type=int)
        page = request.args.get("page", 1, type=int)
        limit = request.args.get("limit", 10, type=int)

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

        if center_id:
            # Get current evacuees for specific center
            result = get_current_evacuees_by_center(center_id)
            if not result["success"]:
                return jsonify(result), 400
                
            # Convert to consistent format with pagination
            return jsonify({
                "success": True,
                "data": {
                    "results": result["data"],
                    "pagination": {
                        "current_page": 1,
                        "total_pages": 1,
                        "total_items": len(result["data"]),
                        "limit": len(result["data"])
                    }
                }
            }), 200
        else:
            # Get all current evacuees across all centers
            result = get_all_current_evacuees(
                page=page,
                limit=limit,
                sort_by="check_in_time",
                sort_order="desc"
            )

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error fetching current attendees: %s", str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while fetching current attendees",
                }
            ),
            500,
        )


@attendance_bp.route("/attendance/event/<int:event_id>", methods=["GET"])
@jwt_required()
def get_event_attendance_route(event_id: int) -> Tuple:
    """
    Get all attendance records during an event across all evacuation centers.

    Args:
        event_id: Event ID

    Query Parameters:
        center_id (integer, optional) - Filter by specific center
        page (integer) - Page number (default: 1)
        limit (integer) - Items per page (default: 10)
        sort_by (string) - Field to sort by
        sort_order (string) - Sort direction (asc/desc)

    Returns:
        Tuple containing:
            - JSON response with event attendance records
            - HTTP status code
    """
    try:
        center_id = request.args.get("center_id", type=int)
        page = request.args.get("page", 1, type=int)
        limit = request.args.get("limit", 10, type=int)
        sort_by = request.args.get("sort_by", type=str)
        sort_order = request.args.get("sort_order", "desc", type=str)

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

        logger.info("Fetching attendance records for event: %s", event_id)

        # Get event attendance records
        result = get_event_attendance(
            event_id=event_id,
            center_id=center_id,
            page=page,
            limit=limit,
            sort_by=sort_by,
            sort_order=sort_order
        )

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error fetching event attendance for event %s: %s", event_id, str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while fetching event attendance",
                }
            ),
            500,
        )


@attendance_bp.route("/attendance/transfers", methods=["GET"])
@jwt_required()
def get_transfer_records_route() -> Tuple:
    """
    Get all transfer records (per evacuation center or for all centers).

    Query Parameters:
        center_id (integer, optional) - Filter by center ID (shows transfers from this center)
        page (integer) - Page number (default: 1)
        limit (integer) - Items per page (default: 10)
        sort_by (string) - Field to sort by
        sort_order (string) - Sort direction (asc/desc)

    Returns:
        Tuple containing:
            - JSON response with transfer records
            - HTTP status code
    """
    try:
        center_id = request.args.get("center_id", type=int)
        page = request.args.get("page", 1, type=int)
        limit = request.args.get("limit", 10, type=int)
        sort_by = request.args.get("sort_by", type=str)
        sort_order = request.args.get("sort_order", "desc", type=str)

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

        logger.info("Fetching transfer records - center_id: %s", center_id)

        # Get transfer records
        result = get_transfer_records(
            center_id=center_id,
            page=page,
            limit=limit,
            sort_by=sort_by,
            sort_order=sort_order
        )

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error fetching transfer records: %s", str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while fetching transfer records",
                }
            ),
            500,
        )


@attendance_bp.route("/attendance/check-in", methods=["POST"])
@jwt_required()
def check_in_individual_route() -> Tuple:
    """
    Check in an individual to an evacuation center.

    Request Body (JSON):
        individual_id (integer) - Individual ID
        center_id (integer) - Center ID
        event_id (integer) - Event ID
        household_id (integer) - Household ID
        recorded_by_user_id (integer, optional) - User ID who recorded the check-in (defaults to current user)
        check_in_time (string, optional) - Check-in time (ISO format, defaults to current time)
        notes (string, optional) - Additional notes

    Returns:
        Tuple containing:
            - JSON response with check-in result
            - HTTP status code
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"success": False, "message": "No data provided"}), 400

        # Get current user ID from JWT token if recorded_by_user_id not provided
        current_user_id = get_jwt_identity()
        if "recorded_by_user_id" not in data:
            data["recorded_by_user_id"] = current_user_id

        # Validate required fields
        required_fields = ["individual_id", "center_id", "event_id", "household_id"]
        for field in required_fields:
            if field not in data:
                return jsonify({"success": False, "message": f"Missing required field: {field}"}), 400

        logger.info("Checking in individual %s to center %s", 
                   data.get("individual_id"), data.get("center_id"))

        result = check_in_individual(
            individual_id=data["individual_id"],
            center_id=data["center_id"],
            event_id=data["event_id"],
            household_id=data["household_id"],
            recorded_by_user_id=data["recorded_by_user_id"],
            check_in_time=data.get("check_in_time"),
            notes=data.get("notes")
        )

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 201

    except Exception as error:
        logger.error("Error checking in individual: %s", str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while checking in individual",
                }
            ),
            500,
        )


@attendance_bp.route("/attendance/<int:record_id>/check-out", methods=["PUT"])
@jwt_required()
def check_out_individual_route(record_id: int) -> Tuple:
    """
    Check out an individual from an evacuation center.

    Args:
        record_id: Attendance record ID

    Request Body (JSON):
        check_out_time (string, optional) - Check-out time (ISO format, defaults to current time)
        notes (string, optional) - Additional notes

    Returns:
        Tuple containing:
            - JSON response with check-out result
            - HTTP status code
    """
    try:
        data = request.get_json() or {}

        logger.info("Checking out individual from record: %s", record_id)

        result = check_out_individual(
            record_id=record_id,
            check_out_time=data.get("check_out_time"),
            notes=data.get("notes")
        )

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error checking out individual from record %s: %s", record_id, str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while checking out individual",
                }
            ),
            500,
        )


@attendance_bp.route("/attendance/<int:record_id>/transfer", methods=["PUT"])
@jwt_required()
def transfer_individual_route(record_id: int) -> Tuple:
    """
    Transfer an individual to a different evacuation center.

    Args:
        record_id: Current attendance record ID

    Request Body (JSON):
        transfer_to_center_id (integer) - Center ID to transfer to
        transfer_time (string, optional) - Transfer time (ISO format, defaults to current time)
        recorded_by_user_id (integer, optional) - User ID who recorded the transfer (defaults to current user)
        notes (string, optional) - Additional notes

    Returns:
        Tuple containing:
            - JSON response with transfer result
            - HTTP status code
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"success": False, "message": "No data provided"}), 400

        if "transfer_to_center_id" not in data:
            return jsonify({"success": False, "message": "Missing required field: transfer_to_center_id"}), 400

        # Get current user ID from JWT token if recorded_by_user_id not provided
        current_user_id = get_jwt_identity()
        if "recorded_by_user_id" not in data:
            data["recorded_by_user_id"] = current_user_id

        logger.info("Transferring individual from record %s to center %s", 
                   record_id, data.get("transfer_to_center_id"))

        result = transfer_individual(
            record_id=record_id,
            transfer_to_center_id=data["transfer_to_center_id"],
            transfer_time=data.get("transfer_time"),
            recorded_by_user_id=data.get("recorded_by_user_id"),
            notes=data.get("notes")
        )

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error transferring individual from record %s: %s", record_id, str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while transferring individual",
                }
            ),
            500,
        )


@attendance_bp.route("/attendance/<int:record_id>", methods=["GET"])
@jwt_required()
def get_attendance_record_route(record_id: int) -> Tuple:
    """
    Get a specific attendance record by ID.

    Args:
        record_id: Attendance record ID

    Returns:
        Tuple containing:
            - JSON response with record data
            - HTTP status code
    """
    try:
        logger.info("Fetching attendance record: %s", record_id)

        result = get_attendance_record_by_id(record_id)

        if not result["success"]:
            return jsonify(result), 404

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error fetching attendance record %s: %s", record_id, str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while fetching attendance record",
                }
            ),
            500,
        )


@attendance_bp.route("/attendance/summary/center/<int:center_id>", methods=["GET"])
@jwt_required()
def get_attendance_summary_route(center_id: int) -> Tuple:
    """
    Get attendance summary for a specific center.

    Args:
        center_id: Center ID

    Query Parameters:
        event_id (integer, optional) - Filter by event ID

    Returns:
        Tuple containing:
            - JSON response with attendance summary
            - HTTP status code
    """
    try:
        event_id = request.args.get("event_id", type=int)

        logger.info("Fetching attendance summary for center: %s", center_id)

        result = get_attendance_summary_by_center(center_id, event_id)

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error fetching attendance summary for center %s: %s", center_id, str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while fetching attendance summary",
                }
            ),
            500,
        )


@attendance_bp.route("/attendance/history/individual/<int:individual_id>", methods=["GET"])
@jwt_required()
def get_individual_attendance_history_route(individual_id: int) -> Tuple:
    """
    Get complete attendance history for an individual.

    Args:
        individual_id: Individual ID

    Returns:
        Tuple containing:
            - JSON response with attendance history
            - HTTP status code
    """
    try:
        logger.info("Fetching attendance history for individual: %s", individual_id)

        result = get_individual_attendance_history(individual_id)

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error fetching attendance history for individual %s: %s", individual_id, str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while fetching attendance history",
                }
            ),
            500,
        )


@attendance_bp.route("/attendance/recalculate/center/<int:center_id>", methods=["POST"])
@jwt_required()
def recalculate_center_occupancy_route(center_id: int) -> Tuple:
    """
    Recalculate occupancy for a specific center.

    Args:
        center_id: Center ID

    Returns:
        Tuple containing:
            - JSON response with recalculation result
            - HTTP status code
    """
    try:
        logger.info("Recalculating occupancy for center: %s", center_id)

        result = recalculate_center_occupancy(center_id)

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error recalculating occupancy for center %s: %s", center_id, str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while recalculating occupancy",
                }
            ),
            500,
        )


@attendance_bp.route("/attendance/recalculate/all", methods=["POST"])
@jwt_required()
def recalculate_all_center_occupancies_route() -> Tuple:
    """
    Recalculate occupancy for all centers.

    Returns:
        Tuple containing:
            - JSON response with recalculation results
            - HTTP status code
    """
    try:
        logger.info("Recalculating occupancy for all centers")

        result = recalculate_all_center_occupancies()

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error recalculating all center occupancies: %s", str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while recalculating occupancies",
                }
            ),
            500,
        )


@attendance_bp.route("/attendance/<int:record_id>", methods=["DELETE"])
@jwt_required()
def delete_attendance_record_route(record_id: int) -> Tuple:
    """
    Delete an attendance record.

    Args:
        record_id: Attendance record ID

    Returns:
        Tuple containing:
            - JSON response with deletion result
            - HTTP status code
    """
    try:
        logger.info("Deleting attendance record: %s", record_id)

        result = delete_attendance_record(record_id)

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error deleting attendance record %s: %s", record_id, str(error))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error while deleting attendance record",
                }
            ),
            500,
        )
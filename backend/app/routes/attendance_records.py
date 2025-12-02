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
    check_out_multiple_individuals,
    transfer_individual,
    transfer_multiple_individuals,
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
from app.services.user_service import get_current_user

# Configure logger for this module
logger = logging.getLogger(__name__)

attendance_record_bp = Blueprint("attendance_record_bp", __name__)


@attendance_record_bp.route("/attendance", methods=["GET"])
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
        search (string) - Search query for individuals
        page (integer) - Page number (default: 1)
        limit (integer) - Items per page (default: 10)
        sortBy (string) - Field to sort by (camelCase)
        sortOrder (string) - Sort direction (asc/desc)

    Returns:
        Tuple containing:
            - JSON response with standardized format
            - HTTP status code
    """
    try:
        # Extract query parameters - support both snake_case and camelCase
        center_id = request.args.get("center_id", type=int) or request.args.get("centerId", type=int)
        individual_id = request.args.get("individual_id", type=int) or request.args.get("individualId", type=int)
        event_id = request.args.get("event_id", type=int) or request.args.get("eventId", type=int)
        household_id = request.args.get("household_id", type=int) or request.args.get("householdId", type=int)
        status = request.args.get("status", type=str)
        date = request.args.get("date", type=str)
        search = request.args.get("search", type=str)
        page = request.args.get("page", 1, type=int)
        limit = request.args.get("limit", 10, type=int)
        sort_by = request.args.get("sort_by", type=str) or request.args.get("sortBy", type=str)
        sort_order = request.args.get("sort_order", type=str) or request.args.get("sortOrder", "desc", type=str)

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
            "Fetching attendance records - search: %s, center_id: %s, event_id: %s, status: %s, page: %s, limit: %s, sort_by: %s, sort_order: %s",
            search,
            center_id,
            event_id,
            status,
            page,
            limit,
            sort_by,
            sort_order,
        )

        # Get attendance records from service
        result = get_attendance_records(
            center_id=center_id,
            individual_id=individual_id,
            event_id=event_id,
            household_id=household_id,
            status=status,
            date=date,
            search=search,  # Pass search parameter
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


@attendance_record_bp.route("/attendance/current", methods=["GET"])
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


@attendance_record_bp.route("/attendance/event/<int:event_id>", methods=["GET"])
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


@attendance_record_bp.route("/attendance/transfers", methods=["GET"])
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


@attendance_record_bp.route("/attendance/check-in", methods=["POST"])
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


@attendance_record_bp.route("/attendance/check-in/batch", methods=["POST"])
@jwt_required()
def check_in_multiple_individuals_route() -> Tuple:
    """
    Check in multiple individuals to an evacuation center in a single operation.

    Request Body (JSON array):
        [
            {
                "individual_id": integer,      # Individual ID
                "center_id": integer,          # Center ID
                "event_id": integer,           # Event ID
                "household_id": integer,       # Household ID
                "recorded_by_user_id": integer, # User ID (optional, defaults to current user)
                "check_in_time": string,       # Check-in time (ISO format, optional)
                "notes": string                # Additional notes (optional)
            },
            ...
        ]

    Returns:
        Tuple containing:
            - JSON response with check-in results
            - HTTP status code
    """
    try:
        data = request.get_json()

        if not data or not isinstance(data, list):
            return jsonify({
                "success": False, 
                "message": "Request body must be a JSON array of individual check-in data"
            }), 400

        if len(data) == 0:
            return jsonify({
                "success": False, 
                "message": "No individuals provided for check-in"
            }), 400

        # Validate maximum batch size
        if len(data) > 50:
            return jsonify({
                "success": False, 
                "message": "Maximum batch size is 50 individuals per request"
            }), 400

        # Get current user ID from JWT token
        current_user_id = get_jwt_identity()
        
        # Validate and prepare check-in data
        validated_data = []
        required_fields = ["individual_id", "center_id", "event_id", "household_id"]
        
        for i, item in enumerate(data):
            if not isinstance(item, dict):
                return jsonify({
                    "success": False, 
                    "message": f"Item at index {i} must be a JSON object"
                }), 400

            # Check required fields
            for field in required_fields:
                if field not in item:
                    return jsonify({
                        "success": False, 
                        "message": f"Missing required field '{field}' for individual at index {i}"
                    }), 400

            # Set default recorded_by_user_id if not provided
            if "recorded_by_user_id" not in item:
                item["recorded_by_user_id"] = current_user_id

            validated_data.append(item)

        logger.info(
            "Batch checking in %s individuals to center %s for event %s", 
            len(validated_data),
            validated_data[0].get("center_id"),  # All should have same center/event in typical use
            validated_data[0].get("event_id")
        )

        # Process batch check-in
        results = []
        errors = []
        
        for i, check_in_data in enumerate(validated_data):
            try:
                result = check_in_individual(
                    individual_id=check_in_data["individual_id"],
                    center_id=check_in_data["center_id"],
                    event_id=check_in_data["event_id"],
                    household_id=check_in_data["household_id"],
                    recorded_by_user_id=check_in_data["recorded_by_user_id"],
                    check_in_time=check_in_data.get("check_in_time"),
                    notes=check_in_data.get("notes")
                )
                
                if result["success"]:
                    results.append(result["data"])
                else:
                    errors.append({
                        "index": i,
                        "individual_id": check_in_data["individual_id"],
                        "error": result["message"]
                    })
                    
            except Exception as error:
                errors.append({
                    "index": i,
                    "individual_id": check_in_data["individual_id"],
                    "error": str(error)
                })

        # Determine overall success with descriptive messages
        if errors:
            if len(errors) == len(validated_data):
                # All failed - provide detailed analysis
                error_types = {}
                for error in errors:
                    error_msg = error["error"]
                    if error_msg not in error_types:
                        error_types[error_msg] = 0
                    error_types[error_msg] += 1
                
                # Create descriptive message based on error patterns
                if len(error_types) == 1:
                    # All same error
                    common_error = list(error_types.keys())[0]
                    message = f"All check-ins failed: {common_error}"
                else:
                    # Multiple types of errors
                    common_errors = list(error_types.items())[:3]  # Show top 3
                    error_summary = ", ".join([f"{count}× {error}" for error, count in common_errors])
                    if len(error_types) > 3:
                        error_summary += f" and {len(error_types) - 3} more error types"
                    message = f"All check-ins failed with various errors: {error_summary}"
                
                return jsonify({
                    "success": False,
                    "message": message,
                    "data": {
                        "successful_checkins": [],
                        "failed_checkins": errors,
                        "error_summary": {
                            "total_failed": len(errors),
                            "error_types": error_types
                        }
                    }
                }), 400
            else:
                # Partial success
                success_count = len(results)
                total_count = len(validated_data)
                failed_count = len(errors)
                
                # Analyze error patterns for partial failures
                error_types = {}
                for error in errors:
                    error_msg = error["error"]
                    if error_msg not in error_types:
                        error_types[error_msg] = 0
                    error_types[error_msg] += 1
                
                if len(error_types) == 1:
                    common_error = list(error_types.keys())[0]
                    message = f"Successfully checked in {success_count} out of {total_count} individuals. {failed_count} failed due to: {common_error}"
                else:
                    common_errors = list(error_types.items())[:2]  # Show top 2
                    error_summary = ", ".join([f"{count}× {error}" for error, count in common_errors])
                    if len(error_types) > 2:
                        error_summary += f" and {len(error_types) - 2} more error types"
                    message = f"Successfully checked in {success_count} out of {total_count} individuals. {failed_count} failed with various errors: {error_summary}"
                
                return jsonify({
                    "success": True,
                    "message": message,
                    "data": {
                        "successful_checkins": results,
                        "failed_checkins": errors,
                        "error_summary": {
                            "total_successful": success_count,
                            "total_failed": failed_count,
                            "error_types": error_types
                        }
                    }
                }), 207  # Multi-Status

        # All successful
        return jsonify({
            "success": True,
            "message": f"Successfully checked in {len(results)} individual{'s' if len(results) != 1 else ''}",
            "data": {
                "successful_checkins": results,
                "failed_checkins": []
            }
        }), 201

    except Exception as error:
        logger.error("Error in batch check-in: %s", str(error))
        return (
            jsonify({
                "success": False,
                "message": f"Internal server error while processing batch check-in: {str(error)}",
            }),
            500,
        )
    
    
@attendance_record_bp.route("/attendance/<int:record_id>/check-out", methods=["PUT"])
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

        # Determine current user and enforce center-based restriction for center-bound roles
        current_user_id = get_jwt_identity()
        try:
            current_user_id_int = int(current_user_id) if current_user_id is not None else None
        except (TypeError, ValueError):
            current_user_id_int = None

        current_user = get_current_user(current_user_id_int) if current_user_id_int is not None else None

        if not current_user:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Unauthorized: Unable to determine current user",
                    }
                ),
                401,
            )

        # Only enforce center restrictions for roles that are tied to a specific center
        if current_user.role in ["center_admin", "volunteer"] and current_user.center_id is not None:
            record_result = get_attendance_record_by_id(record_id)

            if not record_result.get("success"):
                # Preserve existing 404 behaviour when record is not found
                return jsonify(record_result), 404

            record_data = record_result.get("data") or {}
            record_center_id = record_data.get("center_id")

            if record_center_id != current_user.center_id:
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": "You can only check out individuals who are checked in to your assigned center.",
                        }
                    ),
                    403,
                )

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


@attendance_record_bp.route("/attendance/check-out/batch", methods=["POST"])
@jwt_required()
def check_out_multiple_individuals_route() -> Tuple:
    """
    Check out multiple individuals from evacuation centers in a single operation.

    Request Body (JSON array):
        [
            {
                "record_id": integer,           # Attendance record ID
                "check_out_time": string,       # Check-out time (ISO format, optional)
                "notes": string                 # Additional notes (optional)
            },
            ...
        ]

    Returns:
        Tuple containing:
            - JSON response with check-out results
            - HTTP status code
    """
    try:
        data = request.get_json()

        if not data or not isinstance(data, list):
            return jsonify({
                "success": False, 
                "message": "Request body must be a JSON array of check-out data"
            }), 400

        if len(data) == 0:
            return jsonify({
                "success": False, 
                "message": "No check-outs provided"
            }), 400

        # Validate maximum batch size
        if len(data) > 50:
            return jsonify({
                "success": False, 
                "message": "Maximum batch size is 50 check-outs per request"
            }), 400

        # Determine current user for center-based restriction checks
        current_user_id = get_jwt_identity()
        try:
            current_user_id_int = int(current_user_id) if current_user_id is not None else None
        except (TypeError, ValueError):
            current_user_id_int = None

        current_user = get_current_user(current_user_id_int) if current_user_id_int is not None else None

        if not current_user:
            return jsonify({
                "success": False,
                "message": "Unauthorized: Unable to determine current user",
            }), 401

        # Validate each check-out item
        required_fields = ["record_id"]
        validated_data = []
        
        for i, item in enumerate(data):
            if not isinstance(item, dict):
                return jsonify({
                    "success": False, 
                    "message": f"Item at index {i} must be a JSON object"
                }), 400

            # Check required fields
            for field in required_fields:
                if field not in item:
                    return jsonify({
                        "success": False, 
                        "message": f"Missing required field '{field}' for check-out at index {i}"
                    }), 400

            validated_data.append(item)

        # Enforce center restriction for center-bound roles: all records in batch must belong to user's center
        if current_user.role in ["center_admin", "volunteer"] and current_user.center_id is not None:
            invalid_records = []

            for i, item in enumerate(validated_data):
                record_id = item.get("record_id")
                record_result = get_attendance_record_by_id(record_id)

                if not record_result.get("success"):
                    invalid_records.append(
                        {
                            "index": i,
                            "record_id": record_id,
                            "error": "Attendance record not found",
                        }
                    )
                    continue

                record_data = record_result.get("data") or {}
                record_center_id = record_data.get("center_id")

                if record_center_id != current_user.center_id:
                    invalid_records.append(
                        {
                            "index": i,
                            "record_id": record_id,
                            "error": f"Record belongs to center {record_center_id}, not your assigned center {current_user.center_id}",
                        }
                    )

            if invalid_records:
                return jsonify({
                    "success": False,
                    "message": "You can only check out individuals who are checked in to your assigned center.",
                    "data": {
                        "invalid_checkouts": invalid_records
                    }
                }), 403

        logger.info("Batch checking out %s individuals", len(validated_data))

        # Process batch check-out
        result = check_out_multiple_individuals(validated_data)

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error in batch check-out: %s", str(error))
        return (
            jsonify({
                "success": False,
                "message": f"Internal server error while processing batch check-out: {str(error)}",
            }),
            500,
        )
    

@attendance_record_bp.route("/attendance/<int:record_id>/transfer", methods=["PUT"])
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

        # Get current user ID from JWT token
        current_user_id = get_jwt_identity()
        try:
            current_user_id_int = int(current_user_id) if current_user_id is not None else None
        except (TypeError, ValueError):
            current_user_id_int = None

        current_user = get_current_user(current_user_id_int) if current_user_id_int is not None else None

        if not current_user:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Unauthorized: Unable to determine current user",
                    }
                ),
                401,
            )

        # Enforce center restriction for center-bound roles: record must belong to user's center
        if current_user.role in ["center_admin", "volunteer"] and current_user.center_id is not None:
            record_result = get_attendance_record_by_id(record_id)

            if not record_result.get("success"):
                return jsonify(record_result), 404

            record_data = record_result.get("data") or {}
            record_center_id = record_data.get("center_id")

            if record_center_id != current_user.center_id:
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": "You can only transfer individuals who are checked in to your assigned center.",
                        }
                    ),
                    403,
                )

        # Default recorded_by_user_id to the authenticated user if not provided
        if "recorded_by_user_id" not in data:
            data["recorded_by_user_id"] = current_user_id_int

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


@attendance_record_bp.route("/attendance/transfer/batch", methods=["POST"])
@jwt_required()
def transfer_multiple_individuals_route() -> Tuple:
    """
    Transfer multiple individuals to different centers in a single operation.

    Request Body (JSON):
        {
            "transfers": [
                {
                    "record_id": integer,           # Current attendance record ID
                    "transfer_to_center_id": integer, # Center ID to transfer to
                    "transfer_time": string,        # Transfer time (ISO format, optional)
                    "recorded_by_user_id": integer, # User ID (optional, defaults to current user)
                    "notes": string                 # Additional notes (optional)
                },
                ...
            ]
        }

    Returns:
        Tuple containing:
            - JSON response with transfer results
            - HTTP status code
    """
    try:
        data = request.get_json()

        if not data or "transfers" not in data:
            return jsonify({
                "success": False, 
                "message": "Request body must contain 'transfers' array"
            }), 400

        transfers_data = data["transfers"]

        if not isinstance(transfers_data, list):
            return jsonify({
                "success": False, 
                "message": "'transfers' must be an array"
            }), 400

        if len(transfers_data) == 0:
            return jsonify({
                "success": False, 
                "message": "No transfers provided"
            }), 400

        # Validate maximum batch size
        if len(transfers_data) > 50:
            return jsonify({
                "success": False, 
                "message": "Maximum batch size is 50 transfers per request"
            }), 400

        # Get current user ID from JWT token
        current_user_id = get_jwt_identity()
        try:
            current_user_id_int = int(current_user_id) if current_user_id is not None else None
        except (TypeError, ValueError):
            current_user_id_int = None

        current_user = get_current_user(current_user_id_int) if current_user_id_int is not None else None

        if not current_user:
            return jsonify({
                "success": False,
                "message": "Unauthorized: Unable to determine current user",
            }), 401
        
        # Validate and prepare transfer data
        validated_transfers = []
        required_fields = ["record_id", "transfer_to_center_id"]
        
        for i, transfer_item in enumerate(transfers_data):
            if not isinstance(transfer_item, dict):
                return jsonify({
                    "success": False, 
                    "message": f"Transfer item at index {i} must be a JSON object"
                }), 400

            # Check required fields
            for field in required_fields:
                if field not in transfer_item:
                    return jsonify({
                        "success": False, 
                        "message": f"Missing required field '{field}' for transfer at index {i}"
                    }), 400

            # Set default recorded_by_user_id if not provided
            if "recorded_by_user_id" not in transfer_item:
                transfer_item["recorded_by_user_id"] = current_user_id_int

            validated_transfers.append(transfer_item)

        # Enforce center restriction for center-bound roles: all records must belong to user's center
        if current_user.role in ["center_admin", "volunteer"] and current_user.center_id is not None:
            invalid_transfers = []

            for i, transfer_item in enumerate(validated_transfers):
                record_id = transfer_item.get("record_id")
                record_result = get_attendance_record_by_id(record_id)

                if not record_result.get("success"):
                    invalid_transfers.append(
                        {
                            "index": i,
                            "record_id": record_id,
                            "error": "Attendance record not found",
                        }
                    )
                    continue

                record_data = record_result.get("data") or {}
                record_center_id = record_data.get("center_id")

                if record_center_id != current_user.center_id:
                    invalid_transfers.append(
                        {
                            "index": i,
                            "record_id": record_id,
                            "error": f"Record belongs to center {record_center_id}, not your assigned center {current_user.center_id}",
                        }
                    )

            if invalid_transfers:
                return jsonify({
                    "success": False,
                    "message": "You can only transfer individuals who are checked in to your assigned center.",
                    "data": {
                        "invalid_transfers": invalid_transfers
                    }
                }), 403

        logger.info("Batch transferring %s individuals", len(validated_transfers))

        # Process batch transfers
        result = transfer_multiple_individuals(validated_transfers)

        if not result["success"]:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as error:
        logger.error("Error in batch transfer: %s", str(error))
        return (
            jsonify({
                "success": False,
                "message": f"Internal server error while processing batch transfers: {str(error)}",
            }),
            500,
        )


@attendance_record_bp.route("/attendance/<int:record_id>", methods=["GET"])
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


@attendance_record_bp.route("/attendance/summary/center/<int:center_id>", methods=["GET"])
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


@attendance_record_bp.route("/attendance/history/individual/<int:individual_id>", methods=["GET"])
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


@attendance_record_bp.route("/attendance/recalculate/center/<int:center_id>", methods=["POST"])
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


@attendance_record_bp.route("/attendance/recalculate/all", methods=["POST"])
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


@attendance_record_bp.route("/attendance/<int:record_id>", methods=["DELETE"])
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
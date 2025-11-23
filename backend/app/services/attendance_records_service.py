"""Service layer for attendance operations."""

import logging
from typing import Any, Dict, List, Optional
from datetime import datetime

from app.models.attendance_records import AttendanceRecord

# Configure logger for this module
logger = logging.getLogger(__name__)


def get_attendance_records(
    center_id: Optional[int] = None,
    individual_id: Optional[int] = None,
    event_id: Optional[int] = None,
    household_id: Optional[int] = None,
    status: Optional[str] = None,
    date: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = "desc",
) -> Dict[str, Any]:
    """
    Get all attendance records with filtering, pagination, and sorting.

    Args:
        center_id: Filter by center ID
        individual_id: Filter by individual ID
        event_id: Filter by event ID
        household_id: Filter by household ID
        status: Filter by status
        date: Filter by date
        search: Search query for individuals (name or ID)
        page: Page number for pagination
        limit: Number of items per page
        sort_by: Field to sort by
        sort_order: Sort direction (asc/desc)

    Returns:
        Dictionary with attendance records and pagination info
    """
    try:
        result = AttendanceRecord.get_all(
            center_id=center_id,
            individual_id=individual_id,
            event_id=event_id,
            household_id=household_id,
            status=status,
            date=date,
            search=search,
            page=page,
            limit=limit,
            sort_by=sort_by,
            sort_order=sort_order,
        )

        # The model now returns properly formatted data, so we can use it directly
        records_data = result["records"]

        return {
            "success": True,
            "data": {
                "results": records_data,
                "pagination": {
                    "current_page": result["page"],
                    "total_pages": result["total_pages"],
                    "total_items": result["total_count"],
                    "limit": result["limit"],
                },
            },
        }

    except Exception as error:
        logger.error("Error fetching attendance records: %s", str(error))
        return {"success": False, "message": "Failed to fetch attendance records"}


def get_attendance_record_by_id(record_id: int) -> Dict[str, Any]:
    """
    Get a specific attendance record by ID.

    Args:
        record_id: Record ID

    Returns:
        Dictionary with record data or error message
    """
    try:
        record = AttendanceRecord.get_by_id(record_id)

        if not record:
            return {"success": False, "message": "Attendance record not found"}

        return {"success": True, "data": record.to_dict()}

    except Exception as error:
        logger.error("Error fetching attendance record %s: %s", record_id, str(error))
        return {"success": False, "message": "Failed to fetch attendance record"}


def check_in_individual(
    individual_id: int,
    center_id: int,
    event_id: int,
    household_id: int,
    recorded_by_user_id: int,
    check_in_time: Optional[str] = None,
    notes: Optional[str] = None
) -> Dict[str, Any]:
    """
    Check in an individual to an evacuation center.
    Automatically handles transfers if individual is checked in elsewhere.

    Args:
        individual_id: Individual ID
        center_id: Center ID
        event_id: Event ID
        household_id: Household ID
        recorded_by_user_id: User ID who recorded the check-in
        check_in_time: Optional check-in time (defaults to current time)
        notes: Optional notes

    Returns:
        Dictionary with check-in result
    """
    try:
        # Use current time if not provided
        if not check_in_time:
            check_in_time = datetime.now().isoformat()

        # Validate required fields
        if not all([individual_id, center_id, event_id, household_id, recorded_by_user_id]):
            return {"success": False, "message": "Missing required fields"}

        # Use model method that handles transfers automatically
        result = AttendanceRecord.check_in_individual(
            individual_id=individual_id,
            center_id=center_id,
            event_id=event_id,
            household_id=household_id,
            recorded_by_user_id=recorded_by_user_id,
            check_in_time=check_in_time,
            notes=notes
        )

        record = result["record"]
        transfer_occurred = result["transfer_occurred"]
        previous_center_name = result["previous_center_name"]

        # Prepare response message
        if transfer_occurred:
            message = f"Individual automatically transferred from {previous_center_name} and checked in successfully"
            logger.info(
                "Individual %s transferred from center %s to center %s", 
                individual_id, result["previous_center_id"], center_id
            )
        else:
            message = "Individual checked in successfully"
            logger.info("Individual %s checked in to center %s", individual_id, center_id)

        return {
            "success": True,
            "message": message,
            "data": {
                **record.to_dict(),
                "transfer_occurred": transfer_occurred,
                "previous_center_id": result["previous_center_id"],
                "previous_center_name": previous_center_name
            },
        }

    except Exception as error:
        logger.error("Error checking in individual %s: %s", individual_id, str(error))
        return {"success": False, "message": f"Failed to check in individual: {str(error)}"}


def check_in_multiple_individuals(data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Check in multiple individuals to an evacuation center in a batch operation.
    Automatically handles transfers if individuals are checked in elsewhere.

    Args:
        data: List of dictionaries containing check-in data for each individual
            Each dictionary should contain:
            - individual_id: Individual ID
            - center_id: Center ID
            - event_id: Event ID
            - household_id: Household ID
            - recorded_by_user_id: User ID who recorded the check-in
            - check_in_time: Optional check-in time (defaults to current time)
            - notes: Optional notes

    Returns:
        Dictionary with batch check-in results including successful and failed check-ins
    """
    try:
        if not data or not isinstance(data, list):
            return {
                "success": False, 
                "message": "Data must be a non-empty list of individual check-in data"
            }

        if len(data) == 0:
            return {
                "success": False, 
                "message": "No individuals provided for check-in"
            }

        # Validate maximum batch size
        if len(data) > 50:
            return {
                "success": False, 
                "message": "Maximum batch size is 50 individuals per request"
            }

        # Validate each item in the batch
        required_fields = ["individual_id", "center_id", "event_id", "household_id", "recorded_by_user_id"]
        for i, item in enumerate(data):
            if not isinstance(item, dict):
                return {
                    "success": False, 
                    "message": f"Item at index {i} must be a JSON object"
                }

            # Check required fields
            for field in required_fields:
                if field not in item:
                    return {
                        "success": False, 
                        "message": f"Missing required field '{field}' for individual at index {i}"
                    }

        logger.info(
            "Batch checking in %s individuals to center %s for event %s", 
            len(data),
            data[0].get("center_id"),  # All should have same center/event in typical use
            data[0].get("event_id")
        )

        # Process batch check-in
        successful_checkins = []
        failed_checkins = []
        
        for i, check_in_data in enumerate(data):
            try:
                # Use current time if not provided
                check_in_time = check_in_data.get("check_in_time")
                if not check_in_time:
                    check_in_time = datetime.now().isoformat()

                # Use model method that handles transfers automatically
                result = AttendanceRecord.check_in_individual(
                    individual_id=check_in_data["individual_id"],
                    center_id=check_in_data["center_id"],
                    event_id=check_in_data["event_id"],
                    household_id=check_in_data["household_id"],
                    recorded_by_user_id=check_in_data["recorded_by_user_id"],
                    check_in_time=check_in_time,
                    notes=check_in_data.get("notes")
                )

                record = result["record"]
                transfer_occurred = result["transfer_occurred"]
                previous_center_name = result["previous_center_name"]

                # Prepare response data for successful check-in
                checkin_result = {
                    **record.to_dict(),
                    "transfer_occurred": transfer_occurred,
                    "previous_center_id": result["previous_center_id"],
                    "previous_center_name": previous_center_name
                }

                successful_checkins.append(checkin_result)

                # Log individual result
                if transfer_occurred:
                    logger.info(
                        "Individual %s transferred from center %s to center %s", 
                        check_in_data["individual_id"], 
                        result["previous_center_id"], 
                        check_in_data["center_id"]
                    )
                else:
                    logger.info(
                        "Individual %s checked in to center %s", 
                        check_in_data["individual_id"], 
                        check_in_data["center_id"]
                    )
                    
            except Exception as error:
                error_message = str(error)
                failed_checkins.append({
                    "index": i,
                    "individual_id": check_in_data["individual_id"],
                    "error": error_message
                })
                logger.error(
                    "Failed to check in individual %s at index %s: %s", 
                    check_in_data["individual_id"], i, error_message
                )

        # Determine overall success and prepare response
        total_processed = len(successful_checkins) + len(failed_checkins)
        
        if failed_checkins:
            if len(failed_checkins) == total_processed:
                # All failed
                return {
                    "success": False,
                    "message": "All check-ins failed",
                    "data": {
                        "successful_checkins": [],
                        "failed_checkins": failed_checkins
                    }
                }
            else:
                # Partial success
                return {
                    "success": True,
                    "message": f"Successfully checked in {len(successful_checkins)} out of {total_processed} individuals",
                    "data": {
                        "successful_checkins": successful_checkins,
                        "failed_checkins": failed_checkins
                    }
                }
        
        # All successful
        return {
            "success": True,
            "message": f"Successfully checked in {len(successful_checkins)} individuals",
            "data": {
                "successful_checkins": successful_checkins,
                "failed_checkins": []
            }
        }
        
    except Exception as error:
        logger.error("Error in batch check-in service: %s", str(error))
        return {
            "success": False,
            "message": f"Failed to process batch check-in: {str(error)}"
        }
    

def check_out_individual(
    record_id: int,
    check_out_time: Optional[str] = None,
    notes: Optional[str] = None
) -> Dict[str, Any]:
    """
    Check out an individual from an evacuation center.

    Args:
        record_id: Attendance record ID
        check_out_time: Optional check-out time (defaults to current time)
        notes: Optional notes

    Returns:
        Dictionary with check-out result
    """
    try:
        # Use current time if not provided
        if not check_out_time:
            check_out_time = datetime.now().isoformat()

        # Check if record exists and is checked in
        record = AttendanceRecord.get_by_id(record_id)
        if not record:
            return {"success": False, "message": "Attendance record not found"}

        if record.status != "checked_in" or record.check_out_time is not None:
            return {"success": False, "message": "Individual is not currently checked in"}

        # Check out individual
        updated_record = AttendanceRecord.check_out_individual(
            record_id=record_id,
            check_out_time=check_out_time,
            notes=notes
        )

        if not updated_record:
            return {"success": False, "message": "Failed to check out individual"}

        logger.info("Individual %s checked out from center %s", record.individual_id, record.center_id)

        return {
            "success": True,
            "message": "Individual checked out successfully",
            "data": updated_record.to_dict(),
        }

    except Exception as error:
        logger.error("Error checking out individual from record %s: %s", record_id, str(error))
        return {"success": False, "message": "Failed to check out individual"}


def transfer_individual(
    record_id: int,
    transfer_to_center_id: int,
    transfer_time: Optional[str] = None,
    recorded_by_user_id: int = None,
    notes: Optional[str] = None
) -> Dict[str, Any]:
    """
    Transfer an individual to a different evacuation center by creating new records.
    
    Args:
        record_id: Current attendance record ID
        transfer_to_center_id: Center ID to transfer to
        transfer_time: Optional transfer time (defaults to current time)
        recorded_by_user_id: User ID who recorded the transfer
        notes: Optional notes

    Returns:
        Dictionary with transfer result
    """
    try:
        # Use current time if not provided
        if not transfer_time:
            transfer_time = datetime.now().isoformat()

        # Check if record exists and get current record
        current_record = AttendanceRecord.get_by_id(record_id)
        if not current_record:
            return {"success": False, "message": "Attendance record not found"}

        # Check if individual is currently checked in
        if current_record.status != "checked_in" or current_record.check_out_time is not None:
            return {"success": False, "message": "Individual is not currently checked in"}

        # Check if transferring to same center
        if current_record.center_id == transfer_to_center_id:
            return {"success": False, "message": "Cannot transfer to the same center"}

        # Use current recorded_by_user_id if not provided
        if recorded_by_user_id is None:
            recorded_by_user_id = current_record.recorded_by_user_id

        # Use the new transfer logic that creates new records
        transfer_record = AttendanceRecord.transfer_individual(
            record_id=record_id,
            transfer_to_center_id=transfer_to_center_id,
            transfer_time=transfer_time,
            recorded_by_user_id=recorded_by_user_id,
            notes=notes
        )

        if not transfer_record:
            return {"success": False, "message": "Failed to transfer individual"}

        logger.info(
            "Individual %s transferred from center %s to center %s",
            current_record.individual_id,
            current_record.center_id,
            transfer_to_center_id
        )

        return {
            "success": True,
            "message": "Individual transferred successfully",
            "data": transfer_record.to_dict(),
        }

    except ValueError as e:
        # Handle specific validation errors from the model
        logger.warning("Transfer validation error for record %s: %s", record_id, str(e))
        return {"success": False, "message": str(e)}
    except Exception as error:
        logger.error("Error transferring individual from record %s: %s", record_id, str(error))
        return {"success": False, "message": "Failed to transfer individual"}


def get_current_evacuees_by_center(center_id: int) -> Dict[str, Any]:
    """
    Get all currently checked-in individuals at a center.

    Args:
        center_id: Center ID

    Returns:
        Dictionary with current evacuees
    """
    try:
        records = AttendanceRecord.get_current_evacuees_by_center(center_id)
        records_data = [record.to_dict() for record in records]

        return {
            "success": True,
            "data": records_data,
        }

    except Exception as error:
        logger.error("Error fetching current evacuees for center %s: %s", center_id, str(error))
        return {"success": False, "message": "Failed to fetch current evacuees"}


def get_attendance_summary_by_center(center_id: int, event_id: Optional[int] = None) -> Dict[str, Any]:
    """
    Get attendance summary for a center.

    Args:
        center_id: Center ID
        event_id: Optional event ID filter

    Returns:
        Dictionary with attendance summary
    """
    try:
        summary = AttendanceRecord.get_attendance_summary_by_center(center_id, event_id)

        return {
            "success": True,
            "data": summary,
        }

    except Exception as error:
        logger.error("Error fetching attendance summary for center %s: %s", center_id, str(error))
        return {"success": False, "message": "Failed to fetch attendance summary"}


def get_individual_attendance_history(individual_id: int) -> Dict[str, Any]:
    """
    Get complete attendance history for an individual.

    Args:
        individual_id: Individual ID

    Returns:
        Dictionary with attendance history
    """
    try:
        records = AttendanceRecord.get_individual_attendance_history(individual_id)
        records_data = [record.to_dict() for record in records]

        return {
            "success": True,
            "data": records_data,
        }

    except Exception as error:
        logger.error("Error fetching attendance history for individual %s: %s", individual_id, str(error))
        return {"success": False, "message": "Failed to fetch attendance history"}


def recalculate_center_occupancy(center_id: int) -> Dict[str, Any]:
    """
    Recalculate occupancy for a specific center.

    Args:
        center_id: Center ID

    Returns:
        Dictionary with recalculation result
    """
    try:
        new_occupancy = AttendanceRecord.recalculate_center_occupancy(center_id)

        return {
            "success": True,
            "message": f"Occupancy recalculated to {new_occupancy}",
            "data": {"new_occupancy": new_occupancy},
        }

    except Exception as error:
        logger.error("Error recalculating occupancy for center %s: %s", center_id, str(error))
        return {"success": False, "message": "Failed to recalculate occupancy"}


def recalculate_all_center_occupancies() -> Dict[str, Any]:
    """
    Recalculate occupancy for all centers.

    Returns:
        Dictionary with recalculation results
    """
    try:
        results = AttendanceRecord.recalculate_all_center_occupancies()

        return {
            "success": True,
            "message": f"Recalculated occupancy for {len(results)} centers",
            "data": results,
        }

    except Exception as error:
        logger.error("Error recalculating all center occupancies: %s", str(error))
        return {"success": False, "message": "Failed to recalculate center occupancies"}


def delete_attendance_record(record_id: int) -> Dict[str, Any]:
    """
    Delete an attendance record.

    Args:
        record_id: Record ID

    Returns:
        Dictionary with deletion result
    """
    try:
        # Check if record exists
        existing_record = AttendanceRecord.get_by_id(record_id)
        if not existing_record:
            return {"success": False, "message": "Attendance record not found"}

        # Delete record
        success = AttendanceRecord.delete(record_id)

        if not success:
            return {"success": False, "message": "Failed to delete attendance record"}

        logger.info("Attendance record deleted: %s", record_id)

        return {"success": True, "message": "Attendance record deleted successfully"}

    except Exception as error:
        logger.error("Error deleting attendance record %s: %s", record_id, str(error))
        return {"success": False, "message": "Failed to delete attendance record"}
    

def get_transfer_records(
    center_id: Optional[int] = None,
    page: int = 1,
    limit: int = 10,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = "desc",
) -> Dict[str, Any]:
    """
    Get all transfer records with optional center filtering.

    Args:
        center_id: Filter by center ID (shows transfers from this center)
        page: Page number for pagination
        limit: Number of items per page
        sort_by: Field to sort by
        sort_order: Sort direction (asc/desc)

    Returns:
        Dictionary with transfer records and pagination info
    """
    try:
        result = AttendanceRecord.get_transfer_records(
            center_id=center_id,
            page=page,
            limit=limit,
            sort_by=sort_by,
            sort_order=sort_order,
        )

        records_data = [record.to_dict() for record in result["records"]]

        return {
            "success": True,
            "data": {
                "results": records_data,
                "pagination": {
                    "current_page": result["page"],
                    "total_pages": result["total_pages"],
                    "total_items": result["total_count"],
                    "limit": result["limit"],
                },
            },
        }

    except Exception as error:
        logger.error("Error fetching transfer records: %s", str(error))
        return {"success": False, "message": "Failed to fetch transfer records"}


def get_event_attendance(
    event_id: int,
    center_id: Optional[int] = None,
    page: int = 1,
    limit: int = 10,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = "desc",
) -> Dict[str, Any]:
    """
    Get comprehensive event attendance reporting across all centers.

    Args:
        event_id: Event ID
        center_id: Optional center ID filter
        page: Page number for pagination
        limit: Number of items per page
        sort_by: Field to sort by
        sort_order: Sort direction (asc/desc)

    Returns:
        Dictionary with event attendance records and pagination info
    """
    try:
        result = AttendanceRecord.get_event_attendance(
            event_id=event_id,
            center_id=center_id,
            page=page,
            limit=limit,
            sort_by=sort_by,
            sort_order=sort_order,
        )

        records_data = [record.to_dict() for record in result["records"]]

        return {
            "success": True,
            "data": {
                "results": records_data,
                "pagination": {
                    "current_page": result["page"],
                    "total_pages": result["total_pages"],
                    "total_items": result["total_count"],
                    "limit": result["limit"],
                },
            },
        }

    except Exception as error:
        logger.error("Error fetching event attendance for event %s: %s", event_id, str(error))
        return {"success": False, "message": "Failed to fetch event attendance"}


def get_all_current_evacuees(
    page: int = 1,
    limit: int = 10,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = "desc",
) -> Dict[str, Any]:
    """
    Get all currently checked-in attendees across all centers.

    Args:
        page: Page number for pagination
        limit: Number of items per page
        sort_by: Field to sort by
        sort_order: Sort direction (asc/desc)

    Returns:
        Dictionary with current evacuees and pagination info
    """
    try:
        result = AttendanceRecord.get_all_current_evacuees(
            page=page,
            limit=limit,
            sort_by=sort_by,
            sort_order=sort_order,
        )

        records_data = [record.to_dict() for record in result["records"]]

        return {
            "success": True,
            "data": {
                "results": records_data,
                "pagination": {
                    "current_page": result["page"],
                    "total_pages": result["total_pages"],
                    "total_items": result["total_count"],
                    "limit": result["limit"],
                },
            },
        }

    except Exception as error:
        logger.error("Error fetching all current evacuees: %s", str(error))
        return {"success": False, "message": "Failed to fetch current evacuees"}
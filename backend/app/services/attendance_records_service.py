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

        # Check if individual is already checked in
        current_records = AttendanceRecord.get_all(
            individual_id=individual_id,
            status="checked_in"
        )
        
        for record in current_records["records"]:
            if record.check_out_time is None:
                return {
                    "success": False, 
                    "message": "Individual is already checked in at another center"
                }

        # Create attendance record
        record = AttendanceRecord.check_in_individual(
            individual_id=individual_id,
            center_id=center_id,
            event_id=event_id,
            household_id=household_id,
            recorded_by_user_id=recorded_by_user_id,
            check_in_time=check_in_time,
            notes=notes
        )

        logger.info("Individual %s checked in to center %s", individual_id, center_id)

        return {
            "success": True,
            "message": "Individual checked in successfully",
            "data": record.to_dict(),
        }

    except Exception as error:
        logger.error("Error checking in individual %s: %s", individual_id, str(error))
        return {"success": False, "message": "Failed to check in individual"}


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
    Transfer an individual to a different evacuation center.

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

        # Check if record exists and is checked in
        current_record = AttendanceRecord.get_by_id(record_id)
        if not current_record:
            return {"success": False, "message": "Attendance record not found"}

        if current_record.status != "checked_in" or current_record.check_out_time is not None:
            return {"success": False, "message": "Individual is not currently checked in"}

        # Check if transferring to same center
        if current_record.center_id == transfer_to_center_id:
            return {"success": False, "message": "Cannot transfer to the same center"}

        # Use current recorded_by_user_id if not provided
        if recorded_by_user_id is None:
            recorded_by_user_id = current_record.recorded_by_user_id

        # Transfer individual
        updated_record = AttendanceRecord.transfer_individual(
            record_id=record_id,
            transfer_to_center_id=transfer_to_center_id,
            transfer_time=transfer_time,
            recorded_by_user_id=recorded_by_user_id,
            notes=notes
        )

        if not updated_record:
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
            "data": updated_record.to_dict(),
        }

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
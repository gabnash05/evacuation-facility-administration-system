"""Service layer for evacuation center operations."""

import logging
from typing import Any, Dict, Optional

from app.models.evacuation_center import EvacuationCenter
from app.schemas.evacuation_center import EvacuationCenterCreateSchema, EvacuationCenterUpdateSchema

# Configure logger for this module
logger = logging.getLogger(__name__)

# Initialize schemas for validation
create_schema = EvacuationCenterCreateSchema()
update_schema = EvacuationCenterUpdateSchema()


def get_centers(
    search: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = "asc"
) -> Dict[str, Any]:
    """
    Get all evacuation centers with filtering, pagination, and sorting.

    Args:
        search: Search term for center name or address
        status: Filter by status
        page: Page number for pagination
        limit: Number of items per page
        sort_by: Field to sort by
        sort_order: Sort direction (asc/desc)

    Returns:
        Dictionary with centers and pagination info
    """
    try:
        result = EvacuationCenter.get_all(
            search=search,
            status=status,
            page=page,
            limit=limit,
            sort_by=sort_by,
            sort_order=sort_order
        )

        centers_data = [center.to_schema() for center in result["centers"]]

        return {
            "success": True,
            "data": {
                "results": centers_data,
                "pagination": {
                    "current_page": result["page"],
                    "total_pages": result["total_pages"],
                    "total_items": result["total_count"],
                    "limit": result["limit"]
                }
            }
        }

    except Exception as error:
        logger.error("Error fetching evacuation centers: %s", str(error))
        return {"success": False, "message": "Failed to fetch evacuation centers"}


def get_center_by_id(center_id: int) -> Dict[str, Any]:
    """
    Get a specific evacuation center by ID.

    Args:
        center_id: Center ID

    Returns:
        Dictionary with center data or error message
    """
    try:
        center = EvacuationCenter.get_by_id(center_id)

        if not center:
            return {"success": False, "message": "Evacuation center not found"}

        return {
            "success": True,
            "data": center.to_schema()
        }

    except Exception as error:
        logger.error("Error fetching evacuation center %s: %s", center_id, str(error))
        return {"success": False, "message": "Failed to fetch evacuation center"}


def create_center(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a new evacuation center.

    Args:
        data: Center data

    Returns:
        Dictionary with creation result
    """
    try:
        # Validate input data
        try:
            valid_data = create_schema.load(data)
        except Exception as validation_error:
            return {"success": False, "message": f"Validation error: {str(validation_error)}"}

        # Check if center name already exists
        existing_centers = EvacuationCenter.get_all(search=valid_data["center_name"])
        if existing_centers["centers"]:
            for center in existing_centers["centers"]:
                if center.center_name.lower() == valid_data["center_name"].lower():
                    return {"success": False, "message": "Evacuation center name already exists"}

        # Create new center
        center = EvacuationCenter.create(valid_data)

        logger.info("Evacuation center created: %s", center.center_name)

        return {
            "success": True,
            "message": "Evacuation center created successfully",
            "data": center.to_schema()
        }

    except Exception as error:
        logger.error("Error creating evacuation center: %s", str(error))
        return {"success": False, "message": "Failed to create evacuation center"}


def update_center(center_id: int, update_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update an evacuation center.

    Args:
        center_id: Center ID
        update_data: Fields to update

    Returns:
        Dictionary with update result
    """
    try:
        # Validate input data
        try:
            valid_data = update_schema.load(update_data)
        except Exception as validation_error:
            return {"success": False, "message": f"Validation error: {str(validation_error)}"}

        # Check if center exists
        existing_center = EvacuationCenter.get_by_id(center_id)
        if not existing_center:
            return {"success": False, "message": "Evacuation center not found"}

        # Check for duplicate center name if name is being updated
        if "center_name" in valid_data and valid_data["center_name"]:
            existing_centers = EvacuationCenter.get_all(search=valid_data["center_name"])
            for center in existing_centers["centers"]:
                if (center.center_id != center_id and 
                    center.center_name.lower() == valid_data["center_name"].lower()):
                    return {"success": False, "message": "Evacuation center name already exists"}

        # Update center
        updated_center = EvacuationCenter.update(center_id, valid_data)

        if not updated_center:
            return {"success": False, "message": "Failed to update evacuation center"}

        logger.info("Evacuation center updated: %s", center_id)

        return {
            "success": True,
            "message": "Evacuation center updated successfully",
            "data": updated_center.to_schema()
        }

    except Exception as error:
        logger.error("Error updating evacuation center %s: %s", center_id, str(error))
        return {"success": False, "message": "Failed to update evacuation center"}


def delete_center(center_id: int) -> Dict[str, Any]:
    """
    Delete an evacuation center.

    Args:
        center_id: Center ID

    Returns:
        Dictionary with deletion result
    """
    try:
        # Check if center exists
        existing_center = EvacuationCenter.get_by_id(center_id)
        if not existing_center:
            return {"success": False, "message": "Evacuation center not found"}

        # Delete center
        success = EvacuationCenter.delete(center_id)

        if not success:
            return {"success": False, "message": "Failed to delete evacuation center"}

        logger.info("Evacuation center deleted: %s", center_id)

        return {
            "success": True,
            "message": "Evacuation center deleted successfully"
        }

    except Exception as error:
        logger.error("Error deleting evacuation center %s: %s", center_id, str(error))
        return {"success": False, "message": "Failed to delete evacuation center"}


def update_center_occupancy(center_id: int, new_occupancy: int) -> Dict[str, Any]:
    """
    Update current occupancy of an evacuation center.

    Args:
        center_id: Center ID
        new_occupancy: New occupancy count

    Returns:
        Dictionary with update result
    """
    try:
        updated_center = EvacuationCenter.update_occupancy(center_id, new_occupancy)

        if not updated_center:
            return {"success": False, "message": "Evacuation center not found"}

        return {
            "success": True,
            "message": "Occupancy updated successfully",
            "data": updated_center.to_schema()
        }

    except ValueError as error:
        return {"success": False, "message": str(error)}
    except Exception as error:
        logger.error("Error updating occupancy for center %s: %s", center_id, str(error))
        return {"success": False, "message": "Failed to update occupancy"}
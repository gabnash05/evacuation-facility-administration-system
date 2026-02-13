"""Service layer for evacuation center operations."""

import logging
import base64
from typing import Any, Dict, Optional, List

from app.models.evacuation_center import EvacuationCenter
from app.schemas.evacuation_center import (
    EvacuationCenterCreateSchema,
    EvacuationCenterUpdateSchema,
)

# Configure logger for this module
logger = logging.getLogger(__name__)

# Initialize schemas for validation
create_schema = EvacuationCenterCreateSchema()
update_schema = EvacuationCenterUpdateSchema()

# Maximum file size for base64 (5MB)
MAX_FILE_SIZE = 5 * 1024 * 1024


def process_photo_file(photo_file) -> Optional[str]:
    """Process uploaded photo file and return base64 string."""
    if not photo_file:
        return None

    # Validate file size
    photo_file.seek(0, 2)  # Seek to end to get file size
    file_size = photo_file.tell()
    photo_file.seek(0)  # Reset file pointer

    if file_size > MAX_FILE_SIZE:
        raise ValueError("Image too large. Maximum size is 5MB.")

    # Read file and encode as base64
    photo_data = photo_file.read()
    base64_data = base64.b64encode(photo_data).decode("utf-8")

    return base64_data


def get_centers(
    search: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = "asc",
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
            sort_order=sort_order,
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
                    "limit": result["limit"],
                },
            },
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

        return {"success": True, "data": center.to_schema()}

    except Exception as error:
        logger.error("Error fetching evacuation center %s: %s", center_id, str(error))
        return {"success": False, "message": "Failed to fetch evacuation center"}


def get_all_centers() -> Dict[str, Any]:
    """
    Get all evacuation centers without pagination for dropdowns and maps.

    Returns:
        Dictionary containing:
            - success: Boolean indicating operation success
            - message: Descriptive message
            - data: List of all centers
    """
    try:
        # Get all centers without pagination - this returns a DICT, not a list
        result = EvacuationCenter.get_all_centers_no_pagination()

        # Extract centers from the result dictionary
        centers_list = result["centers"]

        # Convert centers to dictionaries
        centers_data = []
        for center in centers_list:
            try:
                if hasattr(center, "to_dict"):
                    center_dict = center.to_dict()
                    centers_data.append(center_dict)
                else:
                    # Fallback manual conversion
                    center_dict = {
                        "center_id": getattr(center, "center_id", None),
                        "center_name": getattr(center, "center_name", "Unknown"),
                        "address": getattr(center, "address", ""),
                        "latitude": float(getattr(center, "latitude", 0.0)),
                        "longitude": float(getattr(center, "longitude", 0.0)),
                        "capacity": getattr(center, "capacity", 0),
                        "current_occupancy": getattr(center, "current_occupancy", 0),
                        "status": getattr(center, "status", "inactive"),
                        "photo_data": getattr(center, "photo_data", None),
                    }
                    centers_data.append(center_dict)
            except Exception as center_error:
                logger.error(f"Error converting center: {str(center_error)}")
                continue

        return {
            "success": True,
            "message": f"Successfully retrieved {len(centers_data)} centers",
            "data": centers_data,
        }

    except Exception as error:
        logger.error("Error retrieving all centers: %s", str(error))
        return {"success": False, "message": "Failed to retrieve centers", "data": []}


def create_center(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a new evacuation center.
    
    Args:
        data: Center data (may include s3Key for photo)

    Returns:
        Dictionary with creation result
    """
    try:
        # Validate input data
        try:
            valid_data = create_schema.load(data)
        except Exception as validation_error:
            return {
                "success": False,
                "message": f"Validation error: {str(validation_error)}",
            }

        # Check if center name already exists
        existing_centers = EvacuationCenter.get_all(search=valid_data["center_name"])
        if existing_centers["centers"]:
            for center in existing_centers["centers"]:
                if center.center_name.lower() == valid_data["center_name"].lower():
                    return {
                        "success": False,
                        "message": "Evacuation center name already exists",
                    }

        # Handle S3 key if provided
        if "s3Key" in valid_data and valid_data["s3Key"]:
            # Map s3Key to database column name
            valid_data["s3_key"] = valid_data.pop("s3Key")
            # Extract filename from s3Key for the filename field
            if "fileName" not in valid_data and valid_data["s3_key"]:
                valid_data["filename"] = valid_data["s3_key"].split('/')[-1]

        # Validate coordinates if provided
        if "latitude" in valid_data and "longitude" in valid_data:
            lat = valid_data["latitude"]
            lng = valid_data["longitude"]
            if lat < -90 or lat > 90:
                return {"success": False, "message": "Invalid latitude value"}
            if lng < -180 or lng > 180:
                return {"success": False, "message": "Invalid longitude value"}

        # Create new center
        center = EvacuationCenter.create(valid_data)

        logger.info("Evacuation center created: %s", center.center_name)

        return {
            "success": True,
            "message": "Evacuation center created successfully",
            "data": center.to_schema(),
        }

    except Exception as error:
        logger.error("Error creating evacuation center: %s", str(error))
        return {"success": False, "message": "Failed to create evacuation center"}
    

def update_center(
    center_id: int,
    update_data: Dict[str, Any],
    remove_photo: bool = False,
) -> Dict[str, Any]:
    try:
        valid_data = update_schema.load(update_data)

        existing_center = EvacuationCenter.get_by_id(center_id)
        if not existing_center:
            return {"success": False, "message": "Evacuation center not found"}

        if "center_name" in valid_data and valid_data["center_name"]:
            existing_centers = EvacuationCenter.get_all(
                search=valid_data["center_name"]
            )
            for center in existing_centers["centers"]:
                if (
                    center.center_id != center_id
                    and center.center_name.lower() == valid_data["center_name"].lower()
                ):
                    return {
                        "success": False,
                        "message": "Evacuation center name already exists",
                    }

        if "latitude" in valid_data and "longitude" in valid_data:
            lat = valid_data["latitude"]
            lng = valid_data["longitude"]
            if lat is not None and (lat < -90 or lat > 90):
                return {"success": False, "message": "Invalid latitude value"}
            if lng is not None and (lng < -180 or lng > 180):
                return {"success": False, "message": "Invalid longitude value"}
        
        lat_provided = "latitude" in valid_data and valid_data["latitude"] is not None
        lng_provided = "longitude" in valid_data and valid_data["longitude"] is not None
        
        if lat_provided != lng_provided:
            return {
                "success": False,
                "message": "Both latitude and longitude must be provided together"
            }

        if "s3Key" in valid_data and valid_data["s3Key"]:
            valid_data["s3_key"] = valid_data.pop("s3Key")
            if "fileName" not in valid_data and valid_data["s3_key"]:
                valid_data["filename"] = valid_data["s3_key"].split('/')[-1]
        
        if remove_photo:
            valid_data["s3_key"] = None
            valid_data["filename"] = None
        
        if "photo_data" in valid_data:
            del valid_data["photo_data"]

        if "current_occupancy" in valid_data:
            new_occupancy = valid_data["current_occupancy"]
            updated_center = EvacuationCenter.update_occupancy(center_id, new_occupancy)
            
            if not updated_center:
                return {"success": False, "message": "Failed to update evacuation center occupancy"}
                
            other_fields = {k: v for k, v in valid_data.items() if k != "current_occupancy"}
            if other_fields:
                updated_center = EvacuationCenter.update(center_id, other_fields)
        else:
            updated_center = EvacuationCenter.update(center_id, valid_data)

        if not updated_center:
            return {"success": False, "message": "Failed to update evacuation center"}

        return {
            "success": True,
            "message": "Evacuation center updated successfully",
            "data": updated_center.to_schema(),
        }

    except ValueError as error:
        return {"success": False, "message": str(error)}
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

        return {"success": True, "message": "Evacuation center deleted successfully"}

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
            "data": updated_center.to_schema(),
        }

    except ValueError as error:
        return {"success": False, "message": str(error)}
    except Exception as error:
        logger.error(
            "Error updating occupancy for center %s: %s", center_id, str(error)
        )
        return {"success": False, "message": "Failed to update occupancy"}


def get_city_summary() -> Dict[str, Any]:
    """
    Get aggregated summary of all evacuation centers in Iligan City.
    
    Returns:
        Dictionary with summary data or error message
    """
    try:
        summary = EvacuationCenter.get_city_summary()
        
        return {
            "success": True,
            "data": summary
        }
        
    except Exception as error:
        logger.error("Error getting city summary: %s", str(error))
        return {
            "success": False, 
            "message": "Failed to get city summary"
        }


def get_centers_by_proximity(
    latitude: float,
    longitude: float,
    radius_km: float = 10.0,
    limit: int = 10
) -> Dict[str, Any]:
    """
    Find evacuation centers within a specified radius of given coordinates.
    
    Args:
        latitude: Latitude of reference point
        longitude: Longitude of reference point
        radius_km: Search radius in kilometers (default: 10km)
        limit: Maximum number of results to return
        
    Returns:
        Dictionary with centers data including distance information
    """
    try:
        # Validate coordinates
        if latitude < -90 or latitude > 90:
            return {"success": False, "message": "Invalid latitude value"}
        if longitude < -180 or longitude > 180:
            return {"success": False, "message": "Invalid longitude value"}
        
        centers = EvacuationCenter.get_centers_by_proximity(
            latitude=latitude,
            longitude=longitude,
            radius_km=radius_km,
            limit=limit
        )
        
        # Convert centers to schema format
        centers_data = []
        for center in centers:
            center_data = center.to_schema()
            # Add distance information if available
            if hasattr(center, 'distance_km'):
                center_data['distance_km'] = round(center.distance_km, 2)
            centers_data.append(center_data)
        
        return {
            "success": True,
            "data": centers_data,
            "message": f"Found {len(centers_data)} centers within {radius_km}km radius"
        }
        
    except Exception as error:
        logger.error("Error finding centers by proximity: %s", str(error))
        return {"success": False, "message": "Failed to find centers by proximity"}


def get_centers_in_bounds(
    north: float,
    south: float,
    east: float,
    west: float,
    status: Optional[str] = "active"
) -> Dict[str, Any]:
    """
    Get all centers within a geographic bounding box.
    Useful for map viewport filtering.
    
    Args:
        north: Northern boundary latitude
        south: Southern boundary latitude
        east: Eastern boundary longitude
        west: Western boundary longitude
        status: Optional status filter
        
    Returns:
        Dictionary with centers data
    """
    try:
        # Validate bounds
        if south > north:
            return {"success": False, "message": "South must be less than north"}
        if west > east:
            return {"success": False, "message": "West must be less than east"}
        
        centers = EvacuationCenter.get_centers_in_bounds(
            north=north,
            south=south,
            east=east,
            west=west,
            status=status
        )
        
        centers_data = [center.to_schema() for center in centers]
        
        return {
            "success": True,
            "data": centers_data,
            "message": f"Found {len(centers_data)} centers in the specified area"
        }
        
    except Exception as error:
        logger.error("Error getting centers in bounds: %s", str(error))
        return {"success": False, "message": "Failed to get centers in bounds"}
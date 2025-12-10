"""Service layer for individuals."""
import logging
import math
from typing import Any, Dict, List, Optional

from app.models.individual import Individual
from app.schemas.individual import (
    IndividualCreateSchema,
    IndividualUpdateSchema,
    IndividualSelectionSchema,
)
from app.models import db

logger = logging.getLogger(__name__)

create_schema = IndividualCreateSchema()
update_schema = IndividualUpdateSchema()
response_schema = IndividualSelectionSchema()


class IndividualService:
    @staticmethod
    def get_all_individuals(params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get all individuals with filtering, pagination, and sorting.
        Now includes real-time status, gender, age group, and center filtering.
        
        Args:
            params: Dictionary containing:
                - search: Search string
                - page: Page number
                - limit: Items per page
                - sort_by: Field to sort by
                - sort_order: Sort direction (asc/desc)
                - household_id: Filter by household ID
                - status: Filter by current_status (checked_in, checked_out, transferred, all)
                - gender: Filter by gender (Male, Female, Other, all)
                - age_group: Filter by age group (child, young_adult, middle_aged, senior, all)
                - center_id: Filter by current center ID (for checked-in individuals)
                
        Returns:
            Dictionary with success status and data or error message
        """
        try:
            # Extract parameters with defaults
            page = params.get("page", 1)
            limit = params.get("limit", 10)
            search = params.get("search")
            sort_by = params.get("sort_by")
            sort_order = params.get("sort_order")
            household_id = params.get("household_id")
            
            # NEW: Extract real-time status filtering parameters
            status = params.get("status")
            gender = params.get("gender")
            age_group = params.get("age_group")
            center_id = params.get("center_id")

            # Validate pagination parameters
            if page < 1:
                return {"success": False, "message": "Page must be at least 1"}

            if limit < 1 or limit > 100:
                return {
                    "success": False,
                    "message": "Limit must be between 1 and 100",
                }

            offset = (page - 1) * limit

            # Set default values and ensure no None values
            sort_by = sort_by or "last_name"  # Default sort by last name
            sort_direction = "asc"  # Default to ascending

            # Only override if sort_order is provided and valid
            if sort_order:
                if sort_order.lower() in ["asc", "desc"]:
                    sort_direction = sort_order.lower()

            # Ensure search is never None - convert to empty string
            search = search or ""

            # Get individuals from model with all filters
            individuals = Individual.get_all_paginated(
                search=search,
                offset=offset,
                limit=limit,
                sort_by=sort_by,
                sort_direction=sort_direction,
                household_id=household_id,
                status=status,
                gender=gender,
                age_group=age_group,
                center_id=center_id,
            )

            # Get total count with same filters
            total_records = Individual.get_count(
                search=search, 
                household_id=household_id,
                status=status,
                gender=gender,
                age_group=age_group,
                center_id=center_id,
            )
            
            total_pages = math.ceil(total_records / limit) if total_records > 0 else 1

            # The individuals are already dictionaries with all fields from _map_individual_result
            # So we can use them directly or serialize if needed
            individuals_data = []
            for ind in individuals:
                # If it's a dict (from _map_individual_result), use it directly
                if isinstance(ind, dict):
                    individuals_data.append(ind)
                # If it's a model instance, serialize it
                elif hasattr(ind, 'individual_id'):
                    individuals_data.append(response_schema.dump(ind))
                # If it's something else, try to convert to dict
                else:
                    individuals_data.append(dict(ind))

            # Get status summary for dashboard (optional - can be removed if not needed)
            status_summary = Individual.get_individuals_with_status_summary(
                center_id=center_id if center_id else None
            )

            pagination_meta = {
                "current_page": page,
                "total_pages": total_pages,
                "total_items": total_records,
                "limit": limit,
            }

            # Include filtering metadata
            filter_meta = {
                "applied_filters": {
                    "status": status,
                    "gender": gender,
                    "age_group": age_group,
                    "center_id": center_id,
                    "household_id": household_id,
                    "search": search if search else None
                },
                "status_summary": status_summary
            }


            return {
                "success": True, 
                "message": "Individuals fetched successfully",
                "data": {
                    "results": individuals_data,
                    "pagination": pagination_meta,
                    "filters": filter_meta
                }
            }

        except Exception as error:
            logger.error("Error fetching individuals: %s", str(error), exc_info=True)
            return {
                "success": False,
                "message": "An error occurred while fetching individuals.",
            }

    @staticmethod
    def get_individual_by_id(individual_id: int) -> Dict[str, Any]:
        """
        Get a specific individual by ID with real-time status information.
        
        Args:
            individual_id: Individual ID
            
        Returns:
            Dictionary with success status and data or error message
        """
        try:
            individual = Individual.get_by_id(individual_id)
            if not individual:
                return {"success": False, "message": "Individual not found."}
            
            # Get additional real-time information
            current_center_info = Individual.get_current_center_for_individual(individual_id)
            attendance_summary = Individual.get_attendance_history_summary(individual_id)
            
            # If individual is a dict (from _map_individual_result), add the extra info
            if isinstance(individual, dict):
                individual_data = individual
                if current_center_info:
                    individual_data["current_center_details"] = current_center_info
                if attendance_summary:
                    individual_data["attendance_summary"] = attendance_summary
            else:
                # Serialize model instance
                individual_data = response_schema.dump(individual)
                # Add extra fields if available
                if hasattr(individual, 'current_status'):
                    individual_data["current_status"] = individual.current_status
                if current_center_info:
                    individual_data["current_center_details"] = current_center_info
                if attendance_summary:
                    individual_data["attendance_summary"] = attendance_summary
                
            return {
                "success": True, 
                "message": "Individual fetched successfully",
                "data": individual_data
            }
            
        except Exception as error:
            logger.error("Error fetching individual %s: %s", individual_id, str(error), exc_info=True)
            return {
                "success": False,
                "message": "An error occurred while fetching individual.",
            }

    @staticmethod
    def create_individual(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new individual.
        
        Args:
            data: Individual data
            
        Returns:
            Dictionary with success status and data or error message
        """
        try:
            # Validate input data
            try:
                valid_data = create_schema.load(data)
            except Exception as validation_error:
                return {"success": False, "message": f"Validation error: {str(validation_error)}"}

            # Create individual
            new_individual = Individual.create(valid_data)
            if not new_individual:
                return {"success": False, "message": "Failed to create individual."}

            db.session.commit()
            
            # Get the full individual data with real-time status
            full_individual = Individual.get_by_id(new_individual.get("individual_id"))
            
            return {
                "success": True, 
                "message": "Individual created successfully",
                "data": full_individual if full_individual else new_individual
            }

        except Exception as error:
            db.session.rollback()
            logger.error("Error creating individual: %s", str(error), exc_info=True)
            return {
                "success": False,
                "message": "An error occurred while creating individual.",
            }

    @staticmethod
    def update_individual(individual_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update an existing individual.
        
        Args:
            individual_id: Individual ID
            data: Updated individual data
            
        Returns:
            Dictionary with success status and data or error message
        """
        try:
            # Check if individual exists
            if not Individual.get_by_id(individual_id):
                return {"success": False, "message": "Individual not found."}

            # Validate input data
            try:
                valid_data = update_schema.load(data)
            except Exception as validation_error:
                return {"success": False, "message": f"Validation error: {str(validation_error)}"}

            # Update individual
            updated_individual = Individual.update(individual_id, valid_data)
            if not updated_individual:
                return {"success": False, "message": "Failed to update individual."}

            db.session.commit()
            
            # Get the full updated individual data with real-time status
            full_individual = Individual.get_by_id(individual_id)
            
            return {
                "success": True, 
                "message": "Individual updated successfully",
                "data": full_individual if full_individual else updated_individual
            }

        except Exception as error:
            db.session.rollback()
            logger.error("Error updating individual %s: %s", individual_id, str(error), exc_info=True)
            return {
                "success": False,
                "message": "An error occurred while updating individual.",
            }

    @staticmethod
    def delete_individuals(ids: List[int]) -> Dict[str, Any]:
        """
        Delete multiple individuals.
        
        Args:
            ids: List of individual IDs to delete
            
        Returns:
            Dictionary with success status and data or error message
        """
        try:
            if not ids:
                return {"success": False, "message": "No IDs provided."}

            # Verify all individuals exist
            for individual_id in ids:
                if not Individual.get_by_id(individual_id):
                    return {"success": False, "message": f"Individual {individual_id} not found."}

            # Delete individuals
            deleted_count = Individual.delete_by_ids(ids)
            
            db.session.commit()
            return {
                "success": True, 
                "message": f"Successfully deleted {deleted_count} individual(s).",
                "data": {"deleted_ids": ids}
            }

        except Exception as error:
            db.session.rollback()
            logger.error("Error deleting individuals: %s", str(error), exc_info=True)
            return {
                "success": False,
                "message": "An error occurred while deleting individuals.",
            }

    @staticmethod
    def get_individuals_by_household(household_id: int) -> Dict[str, Any]:
        """
        Get all individuals for a specific household with real-time status.
        
        Args:
            household_id: Household ID
            
        Returns:
            Dictionary with success status and data or error message
        """
        try:
            individuals = Individual.get_by_household_id(household_id)
            
            # Enhance individuals with current center info
            enhanced_individuals = []
            for ind in individuals:
                if isinstance(ind, dict):
                    enhanced_ind = ind.copy()
                    # Get current center info if checked in
                    if ind.get("current_status") == "checked_in":
                        center_info = Individual.get_current_center_for_individual(ind["individual_id"])
                        if center_info:
                            enhanced_ind["current_center_details"] = center_info
                    enhanced_individuals.append(enhanced_ind)
                else:
                    # Serialize model instance
                    ind_data = response_schema.dump(ind) if hasattr(ind, 'individual_id') else dict(ind)
                    enhanced_individuals.append(ind_data)
            
            return {
                "success": True, 
                "message": "Household individuals fetched successfully",
                "data": enhanced_individuals
            }

        except Exception as error:
            logger.error("Error fetching individuals by household %s: %s", household_id, str(error), exc_info=True)
            return {
                "success": False,
                "message": "An error occurred while fetching household individuals.",
            }

    @staticmethod
    def search_individuals_by_name(name: str, limit: int = 10) -> Dict[str, Any]:
        """
        Search individuals by name with real-time status.
        
        Args:
            name: Search term
            limit: Maximum number of results
            
        Returns:
            Dictionary with success status and data or error message
        """
        try:
            if not name or not name.strip():
                return {
                    "success": True,
                    "message": "No search term provided",
                    "data": []
                }
                
            individuals = Individual.search_by_name(name, limit)
            
            # Enhance with current center info
            enhanced_individuals = []
            for ind in individuals:
                enhanced_ind = ind.copy()
                # Get current center info if checked in
                if ind.get("current_status") == "checked_in":
                    center_info = Individual.get_current_center_for_individual(ind["individual_id"])
                    if center_info:
                        enhanced_ind["current_center_details"] = center_info
                enhanced_individuals.append(enhanced_ind)
            
            return {
                "success": True, 
                "message": "Individuals search completed successfully",
                "data": enhanced_individuals
            }

        except Exception as error:
            logger.error("Error searching individuals by name '%s': %s", name, str(error), exc_info=True)
            return {
                "success": False,
                "message": "An error occurred while searching individuals.",
            }

    @staticmethod
    def get_status_summary(params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get summary statistics of individuals grouped by current status.
        Useful for dashboard widgets.
        
        Args:
            params: Dictionary containing optional filters:
                - center_id: Filter by center
                - event_id: Filter by event
                
        Returns:
            Dictionary with success status and summary data
        """
        try:
            center_id = params.get("center_id")
            event_id = params.get("event_id")
            
            summary = Individual.get_individuals_with_status_summary(
                center_id=center_id,
                event_id=event_id
            )
            
            # Calculate totals
            total_individuals = sum(status_data["count"] for status_data in summary.values())
            
            return {
                "success": True,
                "message": "Status summary fetched successfully",
                "data": {
                    "summary": summary,
                    "total_individuals": total_individuals,
                    "filters_applied": {
                        "center_id": center_id,
                        "event_id": event_id
                    }
                }
            }
            
        except Exception as error:
            logger.error("Error getting status summary: %s", str(error), exc_info=True)
            return {
                "success": False,
                "message": "An error occurred while fetching status summary.",
            }

    @staticmethod
    def recalculate_all_statuses() -> Dict[str, Any]:
        """
        Recalculate current_status for all individuals.
        Useful for data integrity checks or after data migrations.
        
        Returns:
            Dictionary with success status and recalculation results
        """
        try:
            updates = Individual.recalculate_all_statuses()
            
            return {
                "success": True,
                "message": f"Recalculated statuses for {len(updates)} individuals",
                "data": {
                    "updates": updates,
                    "total_updated": len(updates)
                }
            }
            
        except Exception as error:
            logger.error("Error recalculating statuses: %s", str(error), exc_info=True)
            return {
                "success": False,
                "message": "An error occurred while recalculating statuses.",
            }
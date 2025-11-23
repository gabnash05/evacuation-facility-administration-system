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
        
        Args:
            params: Dictionary containing:
                - search: Search string
                - page: Page number
                - limit: Items per page
                - sort_by: Field to sort by
                - sort_order: Sort direction (asc/desc)
                - household_id: Filter by household ID
                
        Returns:
            Dictionary with success status and data or error message
        """
        try:
            page = params.get("page", 1)
            limit = params.get("limit", 10)
            search = params.get("search")
            sort_by = params.get("sort_by")
            sort_order = params.get("sort_order")
            household_id = params.get("household_id")

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

            # Get individuals from model
            individuals = Individual.get_all_paginated(
                search=search,
                offset=offset,
                limit=limit,
                sort_by=sort_by,
                sort_direction=sort_direction,
                household_id=household_id,
            )

            total_records = Individual.get_count(search=search, household_id=household_id)
            total_pages = math.ceil(total_records / limit) if total_records > 0 else 1

            # Serialize the data
            individuals_data = [response_schema.dump(ind) if hasattr(ind, 'individual_id') else ind for ind in individuals]

            pagination_meta = {
                "current_page": page,
                "total_pages": total_pages,
                "total_items": total_records,
                "limit": limit,
            }

            return {
                "success": True, 
                "message": "Individuals fetched successfully",
                "data": {
                    "results": individuals_data,
                    "pagination": pagination_meta
                }
            }

        except Exception as error:
            logger.error("Error fetching individuals: %s", str(error))
            return {
                "success": False,
                "message": "An error occurred while fetching individuals.",
            }

    @staticmethod
    def get_individual_by_id(individual_id: int) -> Dict[str, Any]:
        """
        Get a specific individual by ID.
        
        Args:
            individual_id: Individual ID
            
        Returns:
            Dictionary with success status and data or error message
        """
        try:
            individual = Individual.get_by_id(individual_id)
            if not individual:
                return {"success": False, "message": "Individual not found."}
                
            return {
                "success": True, 
                "message": "Individual fetched successfully",
                "data": response_schema.dump(individual)
            }
            
        except Exception as error:
            logger.error("Error fetching individual %s: %s", individual_id, str(error))
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
            return {
                "success": True, 
                "message": "Individual created successfully",
                "data": new_individual
            }

        except Exception as error:
            db.session.rollback()
            logger.error("Error creating individual: %s", str(error))
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
            return {
                "success": True, 
                "message": "Individual updated successfully",
                "data": updated_individual
            }

        except Exception as error:
            db.session.rollback()
            logger.error("Error updating individual %s: %s", individual_id, str(error))
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
            logger.error("Error deleting individuals: %s", str(error))
            return {
                "success": False,
                "message": "An error occurred while deleting individuals.",
            }

    @staticmethod
    def get_individuals_by_household(household_id: int) -> Dict[str, Any]:
        """
        Get all individuals for a specific household.
        
        Args:
            household_id: Household ID
            
        Returns:
            Dictionary with success status and data or error message
        """
        try:
            individuals = Individual.get_by_household_id(household_id)
            
            # Serialize the data
            individuals_data = [response_schema.dump(ind) if hasattr(ind, 'individual_id') else ind for ind in individuals]
            
            return {
                "success": True, 
                "message": "Household individuals fetched successfully",
                "data": individuals_data
            }

        except Exception as error:
            logger.error("Error fetching individuals by household %s: %s", household_id, str(error))
            return {
                "success": False,
                "message": "An error occurred while fetching household individuals.",
            }
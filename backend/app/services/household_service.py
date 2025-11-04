import logging
import math
from app.models.household import Household

logger = logging.getLogger(__name__)

class HouseholdService:
    @staticmethod
    def create_household(data: dict):
        if Household.get_by_name(data["household_name"]):
            return {"success": False, "message": "A household with this name already exists."}, 409
        try:
            new_household = Household.create(data)
            return {"success": True, "data": new_household}, 201
        except Exception as e:
            logger.error(f"Error creating household: {e}")
            return {"success": False, "message": "An error occurred during household creation."}, 500

    @staticmethod
    def get_household_by_id(household_id: int):
        household = Household.get_by_id(household_id)
        if not household:
            return {"success": False, "message": "Household not found."}, 404
        return {"success": True, "data": household}, 200

    @staticmethod
    def update_household(household_id: int, data: dict):
        if not Household.get_by_id(household_id):
            return {"success": False, "message": "Household not found."}, 404
        existing = Household.get_by_name(data["household_name"])
        if existing and existing.household_id != household_id:
            return {"success": False, "message": "Another household with this name already exists."}, 409
        try:
            updated_household = Household.update(household_id, data)
            return {"success": True, "data": updated_household}, 200
        except Exception as e:
            logger.error(f"Error updating household {household_id}: {e}")
            return {"success": False, "message": "An error occurred during household update."}, 500
            
    # --- THIS IS THE CORRECTED METHOD ---
    @staticmethod
    def delete_household(household_id: int):
        # Step 1: First, check if the household exists.
        household_to_delete = Household.get_by_id(household_id)
        if not household_to_delete:
            return {"success": False, "message": "Household not found."}, 404
        
        # Step 2: If it exists, proceed with deletion inside a try block.
        try:
            Household.delete(household_id)
            return {"success": True, "message": "Household deleted successfully."}, 200
        except Exception as e:
            logger.error(f"Error deleting household {household_id}: {e}")
            return {"success": False, "message": "An error occurred during household deletion."}, 500

    @staticmethod
    def get_all_households(params):
        try:
            page = params.get("page")
            per_page = params.get("per_page")
            search = params.get("search")
            offset = (page - 1) * per_page
            sort_by = params.get("sort_by")
            sort_direction = params.get("sort_direction")
            households = Household.get_all_paginated(
                search=search,
                offset=offset,
                limit=per_page,
                sort_by=sort_by,
                sort_direction=sort_direction,
            )
            total_records = Household.get_count(search=search)
            page_count = math.ceil(total_records / per_page) if total_records > 0 else 1
            pagination_meta = {
                "page": page,
                "per_page": per_page,
                "page_count": page_count,
                "total_records": total_records,
                "can_next_page": page < page_count,
                "can_previous_page": page > 1,
            }
            return {
                "success": True,
                "data": households,
                "pagination": pagination_meta,
            }
        except Exception as e:
            logger.error(f"Error fetching households: {e}")
            return {
                "success": False,
                "message": "An error occurred while fetching data.",
            }
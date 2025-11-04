# FILE NAME: app/services/household_service.py

import logging
import math
from app.models.household import Household
from app.models.individual import Individual
from app.models import db

logger = logging.getLogger(__name__)

class HouseholdService:
    @staticmethod
    def update_household(household_id: int, data: dict):
        if not Household.get_by_id(household_id):
            return {"success": False, "message": "Household not found."}, 404
        
        existing_by_name = Household.get_by_name(data["household_name"])
        if existing_by_name and existing_by_name.household_id != household_id:
            return {"success": False, "message": "Another household with this name already exists."}, 409
        
        individuals_payload = data.pop('individuals', [])

        try:
            # --- TRANSACTION START ---
            
            # 1. Update the household details itself
            updated_household = Household.update(household_id, data)
            if not updated_household:
                raise Exception("Household update failed.")

            # 2. Separate individuals into create, update, and delete lists
            existing_individuals = Individual.get_by_household_id(household_id)
            existing_ids = {ind['individual_id'] for ind in existing_individuals}
            
            incoming_individuals = [ind for ind in individuals_payload if 'individual_id' in ind]
            new_individuals = [ind for ind in individuals_payload if 'individual_id' not in ind]
            
            incoming_ids = {ind['individual_id'] for ind in incoming_individuals}
            ids_to_delete = list(existing_ids - incoming_ids)
            
            # 3. Perform database operations
            if ids_to_delete:
                Individual.delete_by_ids(ids_to_delete)

            for ind_data in incoming_individuals:
                Individual.update(ind_data['individual_id'], ind_data)
            
            for ind_data in new_individuals:
                ind_data['household_id'] = household_id
                Individual.create(ind_data)

            # 4. If everything succeeded, commit the transaction
            db.session.commit()
            
            return {"success": True, "data": updated_household}, 200
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error during transactional household update for ID {household_id}: {e}")
            return {"success": False, "message": "A critical error occurred. The operation has been cancelled."}, 500

    # ... (The rest of the file is the same as before)
    @staticmethod
    def create_household_with_individuals(data: dict):
        if Household.get_by_name(data["household_name"]): return {"success": False, "message": "A household with this name already exists."}, 409
        individuals_data = data.pop('individuals', [])
        try:
            new_household = Household.create(data)
            if not new_household: raise Exception("Household creation failed.")
            household_id, head_individual_id = new_household['household_id'], None
            for ind_data in individuals_data:
                ind_data['household_id'] = household_id
                new_individual = Individual.create(ind_data)
                if new_individual and ind_data.get('relationship_to_head', '').lower() == 'head': head_individual_id = new_individual['individual_id']
            if head_individual_id: Household.set_head(household_id, head_individual_id)
            db.session.commit()
            return {"success": True, "data": Household.get_by_id(household_id)}, 201
        except Exception as e:
            db.session.rollback()
            logger.error(f"Transactional household creation failed: {e}")
            return {"success": False, "message": "A critical error occurred."}, 500

    @staticmethod
    def get_household_by_id(household_id: int):
        household = Household.get_by_id(household_id)
        if not household: return {"success": False, "message": "Household not found."}, 404
        return {"success": True, "data": household}, 200
            
    @staticmethod
    def delete_household(household_id: int):
        if not Household.get_by_id(household_id): return {"success": False, "message": "Household not found."}, 404
        try:
            Household.delete(household_id)
            return {"success": True, "message": "Household deleted successfully."}, 200
        except Exception as e:
            logger.error(f"Error deleting household {household_id}: {e}")
            return {"success": False, "message": "An error occurred."}, 500

    @staticmethod
    def get_all_households(params):
        try:
            page, per_page, search = params.get("page"), params.get("per_page"), params.get("search")
            offset, sort_by, sort_direction = (page - 1) * per_page, params.get("sort_by"), params.get("sort_direction")
            households = Household.get_all_paginated(search=search, offset=offset, limit=per_page, sort_by=sort_by, sort_direction=sort_direction)
            total_records = Household.get_count(search=search)
            page_count = math.ceil(total_records / per_page) if total_records > 0 else 1
            pagination_meta = {"page": page, "per_page": per_page, "page_count": page_count, "total_records": total_records, "can_next_page": page < page_count, "can_previous_page": page > 1}
            return {"success": True, "data": households, "pagination": pagination_meta}
        except Exception as e:
            logger.error(f"Error fetching households: {e}")
            return {"success": False, "message": "An error occurred."}
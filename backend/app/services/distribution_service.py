import logging
from app.models import db
from app.models.distribution import DistributionSession, Distribution
from app.models.aid_allocation import Allocation
from app.models.household import Household # <<<< 1. ADD THIS IMPORT

logger = logging.getLogger(__name__)

class DistributionService:
    
    @staticmethod
    def record_distribution(user, data):
        """
        Creates a session and records multiple items.
        Derives center_id from the household.
        """
        try:
            
            household = Household.get_by_id(data["household_id"])
            if not household:
                raise Exception("Household not found.")
                
            distribution_center_id = household.get('center_id')
            if not distribution_center_id:
                 raise Exception("Could not determine the center for this household.")

            session_data = {
                "household_id": data["household_id"],
                "user_id": user.user_id,
                "center_id": distribution_center_id, # <<<< THIS IS THE FIX
                "notes": data.get("notes")
            }
            
            session = DistributionSession.create(session_data)
            if not session:
                raise Exception("Failed to create distribution session")

            for item in data["items"]:
                Distribution.add_item(session["session_id"], item["allocation_id"], item["quantity"])
            
            db.session.commit()
            return {"success": True, "message": "Distribution recorded successfully"}, 201
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Distribution error: {str(e)}")
            return {"success": False, "message": str(e)}, 400

    @staticmethod
    def get_history(params):
        try:
            page = params.get('page', 1)
            limit = params.get('limit', 10)
            
            result = Distribution.get_history_paginated(
                center_id=params.get('center_id'),
                search=params.get('search'),
                page=page,
                limit=limit,
                sort_by=params.get('sort_by', 'distribution_date'),
                sort_order=params.get('sort_order', 'desc')
            )
            
            # Calculate pagination metadata
            total_items = result["total"]
            total_pages = max(1, (total_items + limit - 1) // limit)  # Ceiling division
            
            return {
                "success": True, 
                "data": {
                    "results": result["data"],  # Nest the data array
                    "pagination": {
                        "current_page": page,
                        "total_pages": total_pages,
                        "total_items": total_items,
                        "limit": limit
                    }
                }
            }, 200
            
        except Exception as e:
            logger.error(f"Fetch history error: {str(e)}")
            return {"success": False, "message": "Failed to fetch history"}, 500
    
    @staticmethod
    def update_distribution(distribution_id, update_data):
        try:
            original_dist = Distribution.get_by_id(distribution_id)
            if not original_dist:
                return {"success": False, "message": "Record not found"}, 404

            original_allocation_id = original_dist['allocation_id']
            original_quantity = original_dist['quantity_distributed']
            new_allocation_id = update_data['allocation_id']
            new_quantity = update_data['quantity']
            new_household_id = update_data['household_id']

            Allocation.update_quantity(original_allocation_id, original_quantity, 'add')
            Allocation.update_quantity(new_allocation_id, new_quantity, 'subtract')
            
            if original_dist['household_id'] != new_household_id:
                DistributionSession.update_household(original_dist['session_id'], new_household_id)

            Distribution.update(distribution_id, update_data)
            db.session.commit()
            return {"success": True, "message": "Record updated successfully"}, 200
        except ValueError as ve:
            db.session.rollback()
            return {"success": False, "message": str(ve)}, 400
        except Exception as e:
            db.session.rollback()
            return {"success": False, "message": "An unexpected error occurred during the update."}, 500

    @staticmethod
    def delete_distribution(distribution_id):
        try:
            success = Distribution.delete(distribution_id)
            if not success:
                return {"success": False, "message": "Record not found"}, 404
            return {"success": True, "message": "Record deleted successfully"}, 200
        except Exception as e:
            db.session.rollback()
            return {"success": False, "message": str(e)}, 500
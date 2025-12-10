import logging
from app.models import db
from app.models.distribution import DistributionSession, Distribution
from app.models.aid_allocation import Allocation
from app.models.household import Household

logger = logging.getLogger(__name__)

class DistributionService:
    
    @staticmethod
    def record_distribution(user, data):
        try:
            # 1. Get Household
            household = Household.get_by_id(data["household_id"])
            if not household:
                raise Exception("Household not found.")
                
            # 2. Get Center ID from Household (Fix for Admin bug)
            distribution_center_id = household.get('center_id')
            if not distribution_center_id:
                 raise Exception("Could not determine the center for this household.")

            # 3. Create Session
            session_data = {
                "household_id": data["household_id"],
                "user_id": user.user_id,
                "center_id": distribution_center_id, 
                "notes": data.get("notes")
            }
            session = DistributionSession.create(session_data)
            if not session: raise Exception("Failed to create session")

            # 4. Add Items
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
            
            return {
                "success": True, 
                "data": {
                    "results": result["data"],
                    "pagination": {
                        "current_page": page,
                        "total_pages": max(1, (result["total"] + limit - 1) // limit),
                        "total_items": result["total"],
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
            # 1. Fetch original record
            original_dist = Distribution.get_by_id(distribution_id)
            if not original_dist:
                return {"success": False, "message": "Record not found"}, 404

            original_allocation_id = original_dist['allocation_id']
            original_quantity = original_dist['quantity_distributed']
            new_allocation_id = update_data['allocation_id']
            new_quantity = update_data['quantity']
            new_household_id = update_data['household_id']

            # REMOVED: with db.session.begin(): 
            # Don't use context manager since model methods manage their own transactions
            
            try:
                # 2. Return old stock
                Allocation.update_quantity(original_allocation_id, original_quantity, 'add')
                # 3. Take new stock
                Allocation.update_quantity(new_allocation_id, new_quantity, 'subtract')
                # 4. Update household if changed
                if original_dist['household_id'] != new_household_id:
                    DistributionSession.update_household(original_dist['session_id'], new_household_id)
                # 5. Update record
                Distribution.update(distribution_id, update_data)
                
                # Manually commit at the end
                db.session.commit()
                
            except Exception as e:
                # Rollback if any of the operations fail
                db.session.rollback()
                raise e

            return {"success": True, "message": "Record updated successfully"}, 200
            
        except ValueError as ve:
            # Don't need rollback here since model methods handle their own rollback
            return {"success": False, "message": str(ve)}, 400
        except Exception as e:
            logger.error(f"Update distribution error: {str(e)}")
            return {"success": False, "message": "An unexpected error occurred during the update."}, 500

    @staticmethod
    def delete_distribution(distribution_id):
        try:
            success = Distribution.delete(distribution_id)
            if not success:
                return {"success": False, "message": "Record not found"}, 404
            return {"success": True, "message": "Record deleted successfully"}, 200
        except Exception as e:
            # Don't need rollback here since model methods handle their own rollback
            return {"success": False, "message": str(e)}, 500

    @staticmethod
    def toggle_status(distribution_id):
        try:
            # 1. Fetch record
            record = Distribution.get_by_id(distribution_id)
            if not record:
                return {"success": False, "message": "Record not found"}, 404

            current_status = record['status']
            allocation_id = record['allocation_id']
            quantity = record['quantity_distributed']
            
            try:
                if current_status == 'completed':
                    # VOID: Return stock, set status to voided
                    Allocation.update_quantity(allocation_id, quantity, 'add')
                    Distribution.update_status(distribution_id, 'voided')
                    msg = "Record voided successfully. Stock returned."
                    
                elif current_status == 'voided':
                    # RESTORE: Deduct stock, set status to completed
                    # This will raise ValueError if stock is insufficient
                    Allocation.update_quantity(allocation_id, quantity, 'subtract')
                    Distribution.update_status(distribution_id, 'completed')
                    msg = "Record restored successfully. Stock deducted."
                
                else:
                    return {"success": False, "message": "Invalid status state"}, 400

                # Manually commit the transaction
                db.session.commit()
                
            except Exception as e:
                db.session.rollback()
                raise e

            return {"success": True, "message": msg}, 200

        except ValueError as ve:
            return {"success": False, "message": str(ve)}, 400
        except Exception as e:
            logger.error(f"Toggle status error: {str(e)}")
            return {"success": False, "message": "An unexpected error occurred."}, 500
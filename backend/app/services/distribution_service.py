import logging
from app.models import db
from app.models.distribution import DistributionSession, Distribution, Allocation
from app.schemas.distribution import CreateDistributionSchema, DistributionHistoryParams

logger = logging.getLogger(__name__)

class DistributionService:
    
    @staticmethod
    def record_distribution(user, data):
        """
        Creates a session and records multiple items.
        SQL Triggers will handle stock deduction.
        """
        try:
            # 1. Start Transaction
            # (Implicitly started by SQLAlchemy, committed at end)

            # 2. Create Session
            session_data = {
                "household_id": data["household_id"],
                "user_id": user.user_id,
                "center_id": user.center_id, # Volunteer distributes in their assigned center
                "notes": data.get("notes")
            }
            
            session = DistributionSession.create(session_data)
            if not session:
                raise Exception("Failed to create distribution session")

            # 3. Add Items
            for item in data["items"]:
                # Check stock first (optional, as trigger handles it, but good for specific error msg)
                alloc = Allocation.get_by_id(item["allocation_id"])
                if not alloc:
                    raise Exception(f"Allocation ID {item['allocation_id']} not found")
                
                if alloc['remaining_quantity'] < item['quantity']:
                    raise Exception(f"Insufficient stock for {alloc['resource_name']}")

                Distribution.add_item(
                    session_id=session["session_id"],
                    allocation_id=item["allocation_id"],
                    quantity=item["quantity"]
                )

            # 4. Commit
            db.session.commit()
            return {"success": True, "message": "Distribution recorded successfully"}, 201

        except Exception as e:
            db.session.rollback()
            logger.error(f"Distribution error: {str(e)}")
            return {"success": False, "message": str(e)}, 400

    @staticmethod
    def get_history(params):
        try:
            data = DistributionSession.get_history_paginated(
                center_id=params.get("center_id"),
                search=params.get("search"),
                page=params.get("page"),
                limit=params.get("limit")
            )
            return {"success": True, "data": data}, 200
        except Exception as e:
            logger.error(f"Fetch history error: {str(e)}")
            return {"success": False, "message": "Failed to fetch history"}, 500

    @staticmethod
    def delete_distribution(distribution_id):
        # Note: This deletes a specific LINE ITEM, not the whole session
        # If you want to delete the whole session (the household visit), use session_id
        try:
            # For simplicity based on your UI, let's assume we delete via session or specific ID
            # This example deletes a specific item distribution
            sql = text("DELETE FROM distributions WHERE distribution_id = :id")
            db.session.execute(sql, {"id": distribution_id})
            db.session.commit()
            return {"success": True, "message": "Record deleted"}, 200
        except Exception as e:
            db.session.rollback()
            return {"success": False, "message": str(e)}, 500
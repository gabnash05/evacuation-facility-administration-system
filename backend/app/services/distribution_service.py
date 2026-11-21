import logging

from sqlalchemy.exc import SQLAlchemyError

from app.models import db
from app.models.aid_allocation import Allocation
from app.models.distribution import Distribution, DistributionSession
from app.models.household import Household

logger = logging.getLogger(__name__)


class DistributionService:

    @staticmethod
    def record_distribution(user, data):
        try:
            if not user or not user.is_active:
                return {"success": False, "message": "Invalid token"}, 401
            # 1. Get Household
            household = Household.get_by_id(data["household_id"])
            if not household:
                raise Exception("Household not found.")

            # 2. Get Center ID from Household (Fix for Admin bug)
            distribution_center_id = household.get("center_id")
            if not distribution_center_id:
                raise Exception("Could not determine the center for this household.")
            if data["center_id"] != distribution_center_id:
                return {
                    "success": False,
                    "message": "Household center does not match request center",
                }, 403
            if (
                user.role in {"center_admin", "volunteer"}
                and user.center_id != distribution_center_id
            ):
                return {"success": False, "message": "Insufficient permissions"}, 403

            event_ids = set()
            for item in data["items"]:
                allocation = Allocation.get_by_id(item["allocation_id"])
                if not allocation:
                    return {"success": False, "message": "Allocation not found"}, 404
                if allocation.center_id != distribution_center_id:
                    return {
                        "success": False,
                        "message": "Allocation center does not match household center",
                    }, 403
                if allocation.status != "active":
                    return {
                        "success": False,
                        "message": "Allocation is not active",
                    }, 400
                event_ids.add(allocation.event_id)
            if len(event_ids) != 1:
                return {
                    "success": False,
                    "message": "Distribution items must belong to one event",
                }, 400

            # 3. Create Session
            session_data = {
                "household_id": data["household_id"],
                "user_id": user.user_id,
                "center_id": distribution_center_id,
                "event_id": event_ids.pop(),
                "notes": data.get("notes"),
            }
            session = DistributionSession.create(session_data)
            if not session:
                raise Exception("Failed to create session")

            # 4. Add Items
            for item in data["items"]:
                if not Distribution.add_item(
                    session["session_id"], item["allocation_id"], item["quantity"]
                ):
                    raise RuntimeError("Failed to insert a distribution item.")

            db.session.commit()
            return {
                "success": True,
                "message": "Distribution recorded successfully",
            }, 201

        except SQLAlchemyError as error:
            db.session.rollback()
            diagnostics = getattr(getattr(error, "orig", None), "diag", None)
            reason = getattr(diagnostics, "message_primary", "") or ""
            if reason.startswith("Insufficient quantity in allocation."):
                return {
                    "success": False,
                    "message": "Insufficient quantity in allocation.",
                }, 400
            logger.error("Database rejected distribution creation")
            return {"success": False, "message": "Failed to record distribution."}, 400
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
        committed = False
        try:
            original = Distribution.get_by_id(distribution_id, for_update=True)
            if not original:
                return {"success": False, "message": "Record not found"}, 404
            if original["status"] != "completed":
                return {
                    "success": False,
                    "message": "Restore this record before editing it.",
                }, 409

            old_id = original["allocation_id"]
            new_id = update_data["allocation_id"]
            household_id = update_data["household_id"]
            center_id = update_data["center_id"]
            session_id = original["session_id"]
            changed_destination = (household_id, center_id) != (
                original["household_id"],
                original["center_id"],
            )
            if (
                changed_destination
                and Distribution.count_session_items(session_id) != 1
            ):
                return {
                    "success": False,
                    "message": "This session has multiple items.",
                }, 409

            household = Household.get_by_id(household_id)
            if not household or household.get("center_id") != center_id:
                return {
                    "success": False,
                    "message": "Household does not belong to this center.",
                }, 400

            allocations = {
                allocation_id: Allocation.get_by_id(allocation_id, for_update=True)
                for allocation_id in sorted({old_id, new_id})
            }
            old, new = allocations[old_id], allocations[new_id]
            if (
                not old
                or old.center_id != original["center_id"]
                or old.event_id != original["event_id"]
            ):
                return {
                    "success": False,
                    "message": "The original allocation scope is inconsistent.",
                }, 409
            if (
                not new
                or new.center_id != center_id
                or new.event_id != original["event_id"]
            ):
                return {
                    "success": False,
                    "message": "Allocation must match the center and event.",
                }, 400
            if new_id != old_id and new.status != "active":
                return {
                    "success": False,
                    "message": "Select an active allocation.",
                }, 400

            quantity = update_data["quantity"]
            if old_id == new_id:
                delta = original["quantity_distributed"] - quantity
                if delta:
                    Allocation.update_quantity(
                        old_id, abs(delta), "add" if delta > 0 else "subtract"
                    )
            else:
                Allocation.update_quantity(
                    old_id, original["quantity_distributed"], "add"
                )
                Allocation.update_quantity(new_id, quantity, "subtract")
            if changed_destination:
                DistributionSession.update_household(
                    session_id, household_id, center_id
                )
            Distribution.update(distribution_id, update_data)
            db.session.commit()
            committed = True
            return {"success": True, "message": "Record updated successfully"}, 200

        except ValueError as ve:
            return {"success": False, "message": str(ve)}, 400
        except Exception as e:
            logger.error("Distribution update failed (%s)", type(e).__name__)
            return {
                "success": False,
                "message": "An unexpected error occurred during the update.",
            }, 500
        finally:
            if not committed:
                db.session.rollback()

    @staticmethod
    def delete_distribution(distribution_id):
        try:
            success = Distribution.delete(distribution_id)
            if not success:
                return {"success": False, "message": "Record not found"}, 404
            return {"success": True, "message": "Record deleted successfully"}, 200
        except Exception as e:
            logger.error("Distribution delete failed (%s)", type(e).__name__)
            return {"success": False, "message": "Failed to delete distribution."}, 500

    @staticmethod
    def toggle_status(distribution_id):
        try:
            record = Distribution.get_by_id(distribution_id, for_update=True)
            if not record:
                return {"success": False, "message": "Record not found"}, 404

            current_status = record["status"]
            allocation_id = record["allocation_id"]
            quantity = record["quantity_distributed"]

            if current_status == "completed":
                Allocation.update_quantity(allocation_id, quantity, "add")
                Distribution.update_status(distribution_id, "voided")
                msg = "Record voided successfully. Stock returned."
            elif current_status == "voided":
                Allocation.update_quantity(allocation_id, quantity, "subtract")
                Distribution.update_status(distribution_id, "completed")
                msg = "Record restored successfully. Stock deducted."
            else:
                db.session.rollback()
                return {"success": False, "message": "Invalid status state"}, 400

            db.session.commit()

            return {"success": True, "message": msg}, 200

        except ValueError as ve:
            db.session.rollback()
            return {"success": False, "message": str(ve)}, 400
        except Exception as e:
            db.session.rollback()
            logger.error("Distribution status update failed (%s)", type(e).__name__)
            return {"success": False, "message": "An unexpected error occurred."}, 500

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
            return {
                "success": False,
                "message": "Another household with this name already exists.",
            }, 409

        individuals_payload = data.pop("individuals", [])

        try:
            # First update the household basic info
            updated_household = Household.update(household_id, data)
            if not updated_household:
                raise Exception("Household update failed.")

            existing_individuals = Individual.get_by_household_id(household_id)
            existing_ids = {ind["individual_id"] for ind in existing_individuals}

            incoming_individuals = [
                ind for ind in individuals_payload if "individual_id" in ind
            ]
            new_individuals = [
                ind for ind in individuals_payload if "individual_id" not in ind
            ]

            incoming_ids = {ind["individual_id"] for ind in incoming_individuals}
            ids_to_delete = list(existing_ids - incoming_ids)

            # Find the head individual from the incoming data
            head_individual_id = None
            for ind_data in incoming_individuals:
                if ind_data.get("relationship_to_head", "").lower() == "head":
                    head_individual_id = ind_data["individual_id"]
                    break

            # If no head found in existing individuals, check new individuals
            if not head_individual_id:
                for ind_data in new_individuals:
                    if ind_data.get("relationship_to_head", "").lower() == "head":
                        # We'll set this after creating the new individual
                        pass

            # Delete individuals that are no longer in the household
            if ids_to_delete:
                Individual.delete_by_ids(ids_to_delete)

            # Update existing individuals
            for ind_data in incoming_individuals:
                Individual.update(ind_data["individual_id"], ind_data)

            # Create new individuals
            for ind_data in new_individuals:
                ind_data["household_id"] = household_id
                new_individual = Individual.create(ind_data)
                # If this new individual is the head, set them as head
                if (
                    new_individual
                    and ind_data.get("relationship_to_head", "").lower() == "head"
                ):
                    head_individual_id = new_individual["individual_id"]

            # Update the household head if we found one
            if head_individual_id:
                Household.set_head(household_id, head_individual_id)
            else:
                # If no head specified, clear the household head
                Household.set_head(household_id, None)

            db.session.commit()

            return {"success": True, "data": updated_household}, 200

        except Exception as e:
            db.session.rollback()
            logger.error(
                f"Error during transactional household update for ID {household_id}: {e}"
            )
            return {
                "success": False,
                "message": "A critical error occurred. The operation has been cancelled.",
            }, 500

    @staticmethod
    def create_household_with_individuals(data: dict):
        if Household.get_by_name(data["household_name"]):
            return {
                "success": False,
                "message": "A household with this name already exists.",
            }, 409
        individuals_data = data.pop("individuals", [])
        try:
            new_household = Household.create(data)
            if not new_household:
                raise Exception("Household creation failed.")
            household_id, head_individual_id = new_household["household_id"], None
            for ind_data in individuals_data:
                ind_data["household_id"] = household_id
                new_individual = Individual.create(ind_data)
                if (
                    new_individual
                    and ind_data.get("relationship_to_head", "").lower() == "head"
                ):
                    head_individual_id = new_individual["individual_id"]
            if head_individual_id:
                Household.set_head(household_id, head_individual_id)
            db.session.commit()
            return {"success": True, "data": Household.get_by_id(household_id)}, 201
        except Exception as e:
            db.session.rollback()
            logger.error(f"Transactional household creation failed: {e}")
            return {"success": False, "message": "A critical error occurred."}, 500

    @staticmethod
    def get_household_by_id(household_id: int):
        household = Household.get_by_id(household_id)
        if not household:
            return {"success": False, "message": "Household not found."}, 404
        return {"success": True, "data": household}, 200

    @staticmethod
    def delete_household(household_id: int):
        if not Household.get_by_id(household_id):
            return {"success": False, "message": "Household not found."}, 404
        try:
            Household.delete(household_id)
            return {"success": True, "message": "Household deleted successfully."}, 200
        except Exception as e:
            logger.error(f"Error deleting household {household_id}: {e}")
            return {"success": False, "message": "An error occurred."}, 500

    @staticmethod
    def get_all_households(params):
        try:
            page = params.get("page", 1)
            per_page = params.get("per_page", 10)
            search = params.get("search")
            sort_by = params.get("sort_by")
            sort_order = params.get("sort_order")
            center_id = params.get("center_id")

            if center_id is not None:
                try:
                    center_id = int(center_id)
                except (ValueError, TypeError):
                    return {"success": False, "message": "Invalid center_id format"}

            # Validate pagination parameters
            if page < 1:
                return {"success": False, "message": "Page must be at least 1"}

            if per_page < 1 or per_page > 100:
                return {
                    "success": False,
                    "message": "per_page must be between 1 and 100",
                }

            offset = (page - 1) * per_page

            # Set default values and ensure no None values
            sort_by = sort_by or "household_name"  # Default sort by household name
            sort_direction = "asc"  # Default to ascending

            # Only override if sort_order is provided and valid
            if sort_order:
                if sort_order.lower() in ["asc", "desc"]:
                    sort_direction = sort_order.lower()

            # Ensure search is never None - convert to empty string
            search = search or ""

            households = Household.get_all_paginated(
                search=search,
                offset=offset,
                limit=per_page,
                sort_by=sort_by,
                sort_direction=sort_direction,
                center_id=center_id,  # Pass center_id to the model
            )

            total_records = Household.get_count(search=search, center_id=center_id)
            page_count = math.ceil(total_records / per_page) if total_records > 0 else 1

            pagination_meta = {
                "page": page,
                "per_page": per_page,
                "page_count": page_count,
                "total_records": total_records,
                "can_next_page": page < page_count,
                "can_previous_page": page > 1,
            }

            return {"success": True, "data": households, "pagination": pagination_meta}

        except Exception as e:
            return {
                "success": False,
                "message": "An error occurred while fetching households.",
            }

    @staticmethod
    def get_household_individuals(household_id: int):
        try:
            if not Household.get_by_id(household_id):
                return {"success": False, "message": "Household not found."}, 404

            individuals = Individual.get_by_household_id(household_id)
            return {"success": True, "data": individuals}, 200

        except Exception as e:
            logger.error(
                f"Error fetching individuals for household {household_id}: {e}"
            )
            return {
                "success": False,
                "message": "An error occurred while fetching household individuals.",
            }, 500

    @staticmethod
    def create_individual_for_household(household_id: int, data: dict):
        try:
            if not Household.get_by_id(household_id):
                return {"success": False, "message": "Household not found."}, 404

            data["household_id"] = household_id
            new_individual = Individual.create(data)

            if not new_individual:
                return {
                    "success": False,
                    "message": "Failed to create individual.",
                }, 400

            # If this individual is set as head, update the household
            if data.get("relationship_to_head", "").lower() == "head":
                Household.set_head(household_id, new_individual["individual_id"])

            db.session.commit()
            return {"success": True, "data": new_individual}, 201

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error creating individual for household {household_id}: {e}")
            return {
                "success": False,
                "message": "An error occurred while creating individual.",
            }, 500

    @staticmethod
    def get_center_household_count(center_id: int):
        """
        Get number of households in a center.
        
        Args:
            center_id: Center ID
            
        Returns:
            Dictionary with household count
        """
        try:
            # Validate center_id is integer
            try:
                center_id = int(center_id)
            except (ValueError, TypeError):
                return {"success": False, "message": "Invalid center ID format"}
            
            household_count = Household.get_center_household_count(center_id)
            
            return {
                "success": True,
                "data": {
                    "center_id": center_id,
                    "household_count": household_count
                }
            }
            
        except Exception as e:
            logger.error(f"Error fetching household count for center {center_id}: {e}")
            return {
                "success": False,
                "message": "Failed to fetch center household count"
            }
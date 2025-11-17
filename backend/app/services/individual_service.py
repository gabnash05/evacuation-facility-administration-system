"""Service layer for individuals."""
import logging
from typing import Any, Dict, List, Optional

from app.models.individual import Individual
from app.schemas.individual import (
    IndividualCreateSchema,
    IndividualUpdateSchema,
    IndividualSelectionSchema,
)

logger = logging.getLogger(__name__)

create_schema = IndividualCreateSchema()
update_schema = IndividualUpdateSchema()
response_schema = IndividualSelectionSchema()


def get_individuals(search: Optional[str] = None, page: int = 1, limit: int = 10) -> Dict[str, Any]:
    try:
        result = Individual.get_all(search=search, page=page, limit=limit)
        individuals_data = [response_schema.dump(i) if hasattr(i, 'individual_id') else i for i in result['individuals']]
        return {
            "success": True,
            "data": {
                "results": individuals_data,
                "pagination": {
                    "current_page": result["page"],
                    "total_pages": result["total_pages"],
                    "total_items": result["total_count"],
                    "limit": result["limit"],
                },
            },
        }
    except Exception as error:
        logger.error("Error fetching individuals: %s", str(error))
        return {"success": False, "message": "Failed to fetch individuals"}


def get_individual_by_id(individual_id: int) -> Dict[str, Any]:
    try:
        individual = Individual.get_by_id(individual_id)
        if not individual:
            return {"success": False, "message": "Individual not found"}
        return {"success": True, "data": response_schema.dump(individual)}
    except Exception as error:
        logger.error("Error fetching individual %s: %s", individual_id, str(error))
        return {"success": False, "message": "Failed to fetch individual"}


def create_individual(data: Dict[str, Any]) -> Dict[str, Any]:
    try:
        try:
            valid = create_schema.load(data)
        except Exception as validation_error:
            return {"success": False, "message": f"Validation error: {str(validation_error)}"}

        created = Individual.create(valid)
        if not created:
            return {"success": False, "message": "Failed to create individual"}

        return {"success": True, "message": "Individual created", "data": created}
    except Exception as error:
        logger.error("Error creating individual: %s", str(error))
        return {"success": False, "message": "Failed to create individual"}


def update_individual(individual_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
    try:
        try:
            valid = update_schema.load(data)
        except Exception as validation_error:
            return {"success": False, "message": f"Validation error: {str(validation_error)}"}

        updated = Individual.update(individual_id, valid)
        if not updated:
            return {"success": False, "message": "Failed to update individual"}

        return {"success": True, "message": "Individual updated", "data": updated}
    except Exception as error:
        logger.error("Error updating individual %s: %s", individual_id, str(error))
        return {"success": False, "message": "Failed to update individual"}


def delete_individuals(ids: List[int]) -> Dict[str, Any]:
    try:
        deleted = Individual.delete_by_ids(ids)
        return {"success": True, "message": "Deleted individuals", "data": {"deleted_ids": deleted}}
    except Exception as error:
        logger.error("Error deleting individuals: %s", str(error))
        return {"success": False, "message": "Failed to delete individuals"}


def get_individuals_by_household(household_id: int) -> Dict[str, Any]:
    try:
        rows = Individual.get_by_household_id(household_id)
        return {"success": True, "data": rows}
    except Exception as error:
        logger.error("Error fetching individuals by household %s: %s", household_id, str(error))
        return {"success": False, "message": "Failed to fetch individuals by household"}

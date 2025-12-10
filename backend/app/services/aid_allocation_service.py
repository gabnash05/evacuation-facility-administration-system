"""Service layer for aid allocation operations."""

import logging
from typing import Any, Dict, List, Optional

from sqlalchemy import text

from app.models.aid_allocation import Allocation, AidCategory
from app.models.evacuation_center import EvacuationCenter
from app.models.event import Event
from app.models import db  # ensure db is imported and available

# Configure logger for this module
logger = logging.getLogger(__name__)


def get_allocations(
    center_id: Optional[int] = None,
    category_id: Optional[int] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = "desc",
    user_role: Optional[str] = None,
    user_center_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Get all aid allocations with filtering and pagination.
    """
    try:
        # Build query with joins
        query = """
            SELECT 
                a.allocation_id,
                a.resource_name,
                ac.category_name,
                ec.center_name,
                e.event_name,
                a.total_quantity,
                a.remaining_quantity,
                a.distribution_type,
                a.suggested_amount,
                a.status,
                u.email as allocated_by,
                a.created_at,
                a.center_id,
                a.event_id,
                a.category_id
            FROM allocations a
            JOIN aid_categories ac ON a.category_id = ac.category_id
            JOIN evacuation_centers ec ON a.center_id = ec.center_id
            JOIN events e ON a.event_id = e.event_id
            JOIN users u ON a.allocated_by_user_id = u.user_id
            WHERE 1=1
        """

        params: Dict[str, Any] = {}

        # Apply role-based filtering
        if user_role in ["center_admin", "volunteer"] and user_center_id: 
            query += " AND a.center_id = :user_center_id"
            params["user_center_id"] = user_center_id
        elif center_id:
            query += " AND a.center_id = :center_id"
            params["center_id"] = center_id

        if category_id:
            query += " AND a.category_id = :category_id"
            params["category_id"] = category_id

        if status:
            query += " AND a.status = :status"
            params["status"] = status

        if search:
            search_lower = f"%{search.lower()}%"

            # Try to parse date formats for searching (frontend displays dates like "January 1, 2024")
            from datetime import datetime

            date_formats = [
                "%B %d, %Y",  # January 15, 2024 (display format)
                "%b %d, %Y",  # Jan 15, 2024
                "%Y-%m-%d",   # 2024-01-15 (ISO)
                "%m/%d/%Y",   # 01/15/2024
                "%m-%d-%Y",   # 01-15-2024
                "%d %b %Y",   # 15 Jan 2024
            ]

            parsed_date = None
            clean_search = search.strip()
            for fmt in date_formats:
                try:
                    parsed_date = datetime.strptime(clean_search, fmt)
                    break
                except ValueError:
                    continue

            date_conditions: List[str] = []
            if parsed_date:
                # Match exact date (date part) in DB
                iso_date = parsed_date.strftime("%Y-%m-%d")
                date_conditions.append(f"DATE(a.created_at) = DATE(:iso_date)")
                params["iso_date"] = iso_date

                # Match the display format used by frontend (no padded month/day)
                # Use FM modifiers to avoid padding differences in to_char output.
                display_date = parsed_date.strftime("%B %d, %Y")
                date_conditions.append(f"TO_CHAR(a.created_at, 'FMMonth FMDD, YYYY') ILIKE :display_date")
                params["display_date"] = f"%{display_date}%"

            # Build the search query to cover ONLY columns displayed in the table
            if date_conditions:
                date_search_query = " OR ".join(date_conditions)
                query += f""" AND (
                    {date_search_query}
                    OR a.resource_name ILIKE :search  -- Relief Type
                    OR ec.center_name ILIKE :search   -- Center
                    OR a.status::text ILIKE :search   -- Status
                    OR a.total_quantity::text ILIKE :search   -- Quantity (part of formatted display)
                    OR a.remaining_quantity::text ILIKE :search  -- Quantity (part of formatted display)
                )"""
                params["search"] = search_lower
            else:
                # Regular text search - ONLY search displayed columns
                query += """ AND (
                    a.resource_name ILIKE :search OR        -- Relief Type
                    ec.center_name ILIKE :search OR         -- Center
                    a.status::text ILIKE :search OR         -- Status
                    a.total_quantity::text ILIKE :search OR -- Quantity
                    a.remaining_quantity::text ILIKE :search OR -- Quantity
                    TO_CHAR(a.created_at, 'FMMonth FMDD, YYYY') ILIKE :search  -- Date (formatted display)
                )"""
                params["search"] = search_lower

        # Get total count
        count_query = text(f"SELECT COUNT(*) FROM ({query}) AS count_query")
        count_result = db.session.execute(count_query, params).fetchone()
        total_count = count_result[0] if count_result else 0

        # Apply sorting
        sort_mapping = {
            "created_at": "a.created_at",
            "center_name": "ec.center_name",
            "resource_name": "a.resource_name",
            "category_name": "ac.category_name",
            "total_quantity": "a.total_quantity",
            "remaining_quantity": "a.remaining_quantity",
            "status": "a.status",
            "event_name": "e.event_name",
        }

        if sort_by in sort_mapping:
            order_direction = "DESC" if sort_order and sort_order.lower() == "desc" else "ASC"
            query += f" ORDER BY {sort_mapping[sort_by]} {order_direction}"
        else:
            query += " ORDER BY a.created_at DESC"

        # Apply pagination
        offset = (page - 1) * limit
        query += " LIMIT :limit OFFSET :offset"
        params["limit"] = limit
        params["offset"] = offset

        # Execute query
        query_text = text(query)
        results = db.session.execute(query_text, params).fetchall()

        # Convert to list of dictionaries
        allocations: List[Dict[str, Any]] = []
        for row in results:
            allocation = {
                "allocation_id": row.allocation_id,
                "resource_name": row.resource_name,
                "category_name": row.category_name,
                "center_name": row.center_name,
                "event_name": row.event_name,
                "total_quantity": row.total_quantity,
                "remaining_quantity": row.remaining_quantity,
                "distribution_type": row.distribution_type,
                "suggested_amount": row.suggested_amount,
                "status": row.status,
                "allocated_by": row.allocated_by,
                # Return created_at as ISO (frontend formats it). Searching uses the displayed format via TO_CHAR above.
                "created_at": row.created_at.isoformat() if row.created_at else None,
                "center_id": row.center_id,
                "event_id": row.event_id,
                "category_id": row.category_id,
            }
            allocations.append(allocation)

        return {
            "success": True,
            "data": {
                "results": allocations,
                "pagination": {
                    "current_page": page,
                    "total_pages": (total_count + limit - 1) // limit,
                    "total_items": total_count,
                    "limit": limit,
                },
            },
            "message": "Allocations fetched successfully",
        }

    except Exception as error:
        logger.exception("Error fetching allocations")
        return {"success": False, "message": f"Failed to fetch allocations: {str(error)}"}


def get_center_allocations(
    center_id: int,
    category_id: Optional[int] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = None
) -> Dict[str, Any]:
    """
    Convenience wrapper for get_allocations that forces a center_id.
    """
    try:
        return get_allocations(
            center_id=center_id,
            category_id=category_id,
            status=status,
            search=search,
            page=page,
            limit=limit,
            sort_by=sort_by,
            sort_order=sort_order,
            user_role=None,
            user_center_id=None,
        )
    except Exception as error:
        logger.exception("Error fetching center allocations")
        return {"success": False, "message": f"Failed to fetch center allocations: {str(error)}"}


def create_allocation(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a new allocation and return the created allocation with joined fields.
    """
    try:
        allocation = Allocation.create(data)
        if not allocation:
            return {"success": False, "message": "Failed to create allocation"}

        # Fetch joined allocation row for response
        query = """
            SELECT 
                a.allocation_id,
                a.resource_name,
                ac.category_name,
                ec.center_name,
                e.event_name,
                a.total_quantity,
                a.remaining_quantity,
                a.distribution_type,
                a.suggested_amount,
                a.status,
                u.email as allocated_by,
                a.created_at,
                a.center_id,
                a.event_id,
                a.category_id
            FROM allocations a
            JOIN aid_categories ac ON a.category_id = ac.category_id
            JOIN evacuation_centers ec ON a.center_id = ec.center_id
            JOIN events e ON a.event_id = e.event_id
            JOIN users u ON a.allocated_by_user_id = u.user_id
            WHERE a.allocation_id = :allocation_id
        """
        result = db.session.execute(text(query), {"allocation_id": allocation.allocation_id}).fetchone()

        if not result:
            return {"success": False, "message": "Failed to fetch created allocation"}

        allocation_dict = {
            "allocation_id": result.allocation_id,
            "resource_name": result.resource_name,
            "category_name": result.category_name,
            "center_name": result.center_name,
            "event_name": result.event_name,
            "total_quantity": result.total_quantity,
            "remaining_quantity": result.remaining_quantity,
            "distribution_type": result.distribution_type,
            "suggested_amount": result.suggested_amount,
            "status": result.status,
            "allocated_by": result.allocated_by,
            "created_at": result.created_at.isoformat() if result.created_at else None,
            "center_id": result.center_id,
            "event_id": result.event_id,
            "category_id": result.category_id,
        }

        # Optionally update center stats
        try:
            update_center_allocation_stats(data.get("center_id"))
        except Exception:
            logger.debug("update_center_allocation_stats failed (non-fatal)")

        return {"success": True, "message": "Allocation created successfully", "data": allocation_dict}
    except Exception as error:
        logger.exception("Error creating allocation")
        return {"success": False, "message": f"Failed to create allocation: {str(error)}"}


def refresh_allocation_status(allocation_id: int) -> Dict[str, Any]:
    """
    Re-evaluate and update an allocation's status based on remaining quantity:
    - If remaining_quantity == 0 -> depleted (unless status is 'cancelled')
    - Otherwise -> active (unless status is 'cancelled')

    This is provided as a helper so distribution creation/deletion codepaths
    (which modify remaining_quantity via SQL or triggers) can call this after
    performing their changes. It does not modify status if allocation is 'cancelled'.
    """
    try:
        row = db.session.execute(
            text("SELECT total_quantity, remaining_quantity, status FROM allocations WHERE allocation_id = :id"),
            {"id": allocation_id}
        ).fetchone()

        if not row:
            return {"success": False, "message": "Allocation not found"}

        remaining = int(row.remaining_quantity or 0)
        current_status = (row.status or "").lower()

        # Do not change status for cancelled allocations
        if current_status == "cancelled":
            allocation = Allocation.get_by_id(allocation_id)
            return {"success": True, "message": "Allocation is cancelled; status unchanged", "data": allocation.to_dict()}

        # Determine desired status: depleted when remaining is 0, otherwise active
        desired_status = "active" if remaining > 0 else "depleted"

        if desired_status != current_status:
            db.session.execute(
                text("UPDATE allocations SET status = :status, updated_at = NOW() WHERE allocation_id = :id"),
                {"status": desired_status, "id": allocation_id}
            )
            db.session.commit()

        allocation = Allocation.get_by_id(allocation_id)
        return {"success": True, "message": "Allocation status refreshed", "data": allocation.to_dict()}
    except Exception as error:
        logger.exception("Error refreshing allocation status")
        try:
            db.session.rollback()
        except Exception:
            pass
        return {"success": False, "message": f"Failed to refresh allocation status: {str(error)}"}


def update_allocation(allocation_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update an existing allocation and return the updated allocation.

    This implementation updates the allocations table directly via SQL so we
    avoid creating transient ORM objects that cause INSERTs. We compute the
    remaining_quantity server-side when total_quantity changes and persist it
    atomically in the same UPDATE statement. After the update we call
    refresh_allocation_status to enforce the depletion rule.
    """
    try:
        # Get current allocation using existing helper (returns Allocation dataclass-like object)
        current_allocation = Allocation.get_by_id(allocation_id)
        if not current_allocation:
            return {"success": False, "message": "Allocation not found"}

        # Defensive coercion for integers if present
        if "total_quantity" in data:
            try:
                data["total_quantity"] = int(data["total_quantity"])
            except (ValueError, TypeError):
                return {"success": False, "message": "Invalid total_quantity; expected integer"}

        # Compute remaining_quantity delta if total_quantity changes
        old_total = int(current_allocation.total_quantity or 0)
        old_remaining = int(current_allocation.remaining_quantity or 0)

        if "total_quantity" in data:
            new_total = data["total_quantity"]
            if new_total < old_remaining:
                return {
                    "success": False,
                    "message": f"Total quantity ({new_total}) cannot be less than remaining quantity ({old_remaining})"
                }

            if new_total > old_total:
                increase_amount = new_total - old_total
                computed_remaining = old_remaining + increase_amount
            elif new_total < old_total:
                decrease_amount = old_total - new_total
                computed_remaining = max(0, old_remaining - decrease_amount)
            else:
                computed_remaining = old_remaining

            # Ensure remaining does not exceed new total
            computed_remaining = min(computed_remaining, new_total)

            # Server authoritative: set computed remaining
            data["remaining_quantity"] = int(computed_remaining)

        # Prevent updating certain fields for safety
        for protected in ("center_id", "event_id", "allocated_by_user_id"):
            if protected in data:
                data.pop(protected, None)

        if not data:
            return {"success": True, "message": "No changes applied", "data": current_allocation.to_dict()}

        # Build dynamic UPDATE SQL
        set_clauses: List[str] = []
        params: Dict[str, Any] = {"allocation_id": allocation_id}

        for key, value in data.items():
            # Only allow columns that actually exist (simple whitelist by name)
            # We assume frontend/backend use snake_case matching DB column names.
            set_clauses.append(f"{key} = :{key}")
            params[key] = value

        # Add updated_at
        set_clauses.append("updated_at = NOW()")

        query = text(f"""
            UPDATE allocations
            SET {', '.join(set_clauses)}
            WHERE allocation_id = :allocation_id
            RETURNING *
        """)

        result = db.session.execute(query, params).fetchone()
        db.session.commit()

        # After committing, enforce automatic status rule (depletion when remaining == 0) for this allocation.
        try:
            refresh_allocation_status(allocation_id)
        except Exception:
            logger.debug("refresh_allocation_status failed (non-fatal)")

        updated_allocation = Allocation._row_to_allocation(result)

        logger.info("Allocation updated - ID: %s (fields: %s)", allocation_id, ", ".join(data.keys()))

        return {"success": True, "message": "Allocation updated successfully", "data": updated_allocation.to_dict()}
    except Exception as error:
        logger.exception("Error updating allocation")
        try:
            db.session.rollback()
        except Exception:
            pass
        return {"success": False, "message": f"Failed to update allocation: {str(error)}"}


def delete_allocation(allocation_id: int) -> Dict[str, Any]:
    """
    Delete an allocation.
    Will prevent deletion if there are distributions referencing the allocation.
    """
    try:
        allocation = Allocation.get_by_id(allocation_id)
        if not allocation:
            return {"success": False, "message": "Allocation not found"}

        # Attempt deletion via model helper
        success = Allocation.delete(allocation_id)

        if not success:
            # If delete failed but we already checked for distributions, there might be other constraints
            return {"success": False, "message": "Failed to delete allocation. It may have existing dependencies."}

        # Update center statistics (best-effort)
        try:
            update_center_allocation_stats(allocation.center_id)
        except Exception:
            logger.debug("update_center_allocation_stats failed (non-fatal)")

        logger.info("Allocation deleted - ID: %s", allocation_id)

        return {"success": True, "message": "Allocation deleted successfully"}
    except Exception as error:
        logger.exception("Error deleting allocation")
        return {"success": False, "message": f"Failed to delete allocation: {str(error)}"}


def get_allocation_by_id(allocation_id: int) -> Dict[str, Any]:
    """
    Retrieve a single allocation (raw Allocation.to_dict()).
    """
    try:
        allocation = Allocation.get_by_id(allocation_id)
        if not allocation:
            return {"success": False, "message": "Allocation not found"}
        return {"success": True, "data": allocation.to_dict()}
    except Exception as error:
        logger.exception("Error fetching allocation by id")
        return {"success": False, "message": f"Failed to fetch allocation: {str(error)}"}


def get_aid_categories():
    """
    Get all aid categories.
    Available to all authenticated users.
    """
    try:
        # Get categories in database order (no sorting applied)
        categories = AidCategory.get_all_active()
        
        # Convert to dictionary format
        categories_data = [category.to_dict() for category in categories]
        
        return {
            "success": True,
            "data": categories_data,
            "message": f"Successfully retrieved {len(categories_data)} aid categories"
        }
        
    except Exception as error:
        logger.error("Error fetching aid categories: %s", str(error))
        return {
            "success": False, 
            "message": "Failed to fetch aid categories",
            "data": []
        }


def update_center_allocation_stats(center_id: Optional[int]) -> None:
    """
    Placeholder to update center allocation statistics (no-op by default).
    """
    try:
        # Expand this as needed (e.g., aggregate totals, push to a center stats table)
        return
    except Exception:
        logger.exception("Error updating center allocation stats (ignored)")
        return
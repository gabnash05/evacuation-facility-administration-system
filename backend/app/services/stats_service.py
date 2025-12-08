"""Service layer for dashboard statistics operations."""

import logging
from typing import Any, Dict, Optional
from datetime import datetime, date
from sqlalchemy import text
from app.models import db

logger = logging.getLogger(__name__)


def calculate_age(date_of_birth: date) -> int:
    """Calculate age from date of birth."""
    today = datetime.now().date()
    age = today.year - date_of_birth.year
    if (today.month, today.day) < (date_of_birth.month, date_of_birth.day):
        age -= 1
    return age


def get_age_group(date_of_birth: Optional[date]) -> Optional[str]:
    """Determine age group from date of birth."""
    if not date_of_birth:
        return None
    
    age = calculate_age(date_of_birth)
    
    if age <= 12:
        return "Child"
    elif age <= 17:
        return "Teen"
    elif age <= 59:
        return "Adult"
    else:
        return "Senior"


def get_occupancy_stats(
    center_id: Optional[int] = None,
    gender: Optional[str] = None,
    age_group: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Calculate occupancy utilization rate.
    
    Formula: (Current Occupancy / Total Capacity) × 100%
    
    Args:
        center_id: Optional center ID (for center admin)
        gender: Optional gender filter (Male, Female, Other)
        age_group: Optional age group filter (Child, Teen, Adult, Senior)
    
    Returns:
        Dictionary with occupancy stats
    """
    try:
        # Build base query for capacity
        if center_id:
            # Single center capacity
            capacity_query = text("""
                SELECT COALESCE(capacity, 0) as total_capacity
                FROM evacuation_centers
                WHERE center_id = :center_id AND status = 'active'
            """)
            capacity_result = db.session.execute(
                capacity_query, 
                {"center_id": center_id}
            ).fetchone()
            total_capacity = capacity_result[0] if capacity_result else 0
        else:
            # City-wide capacity
            capacity_query = text("""
                SELECT COALESCE(SUM(capacity), 0) as total_capacity
                FROM evacuation_centers
                WHERE status = 'active'
            """)
            capacity_result = db.session.execute(capacity_query).fetchone()
            total_capacity = capacity_result[0] if capacity_result else 0

        # Build query for current occupancy with filters
        occupancy_query = """
            SELECT COUNT(DISTINCT ar.individual_id) as current_occupancy
            FROM attendance_records ar
            JOIN individuals i ON ar.individual_id = i.individual_id
            WHERE ar.status = 'checked_in' 
            AND ar.check_out_time IS NULL
        """
        params = {}
        
        if center_id:
            occupancy_query += " AND ar.center_id = :center_id"
            params["center_id"] = center_id
        
        if gender:
            occupancy_query += " AND i.gender = :gender"
            params["gender"] = gender
        
        if age_group:
            # Calculate age range based on age group
            if age_group == "Child":
                min_age, max_age = 0, 12
            elif age_group == "Teen":
                min_age, max_age = 13, 17
            elif age_group == "Adult":
                min_age, max_age = 18, 59
            else:  # Senior
                min_age, max_age = 60, 200
            
            # Calculate date range for the age group
            today = datetime.now().date()
            max_birth_date = date(today.year - min_age, today.month, today.day)
            min_birth_date = date(today.year - max_age - 1, today.month, today.day)
            
            occupancy_query += """
                AND i.date_of_birth IS NOT NULL
                AND i.date_of_birth >= :min_birth_date 
                AND i.date_of_birth <= :max_birth_date
            """
            params["min_birth_date"] = min_birth_date
            params["max_birth_date"] = max_birth_date
        
        occupancy_result = db.session.execute(
            text(occupancy_query), 
            params
        ).fetchone()
        
        current_occupancy = occupancy_result[0] if occupancy_result else 0
        
        # Calculate percentage
        percentage = 0
        if total_capacity > 0:
            percentage = round((current_occupancy / total_capacity) * 100, 2)
        
        return {
            "current_occupancy": current_occupancy,
            "total_capacity": total_capacity,
            "percentage": percentage
        }
        
    except Exception as error:
        logger.error("Error calculating occupancy stats: %s", str(error))
        return {
            "current_occupancy": 0,
            "total_capacity": 0,
            "percentage": 0
        }


def get_registration_stats(
    center_id: Optional[int] = None,
    gender: Optional[str] = None,
    age_group: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Calculate individual registration penetration.
    
    Formula: (Check-ins / Registered Population) × 100%
    
    Args:
        center_id: Optional center ID (for center admin)
        gender: Optional gender filter (Male, Female, Other)
        age_group: Optional age group filter (Child, Teen, Adult, Senior)
    
    Returns:
        Dictionary with registration stats
    """
    try:
        # Build query for total registered individuals with filters
        registered_query = """
            SELECT COUNT(DISTINCT i.individual_id) as total_registered
            FROM individuals i
            JOIN households h ON i.household_id = h.household_id
            WHERE 1=1
        """
        params = {}
        
        if center_id:
            registered_query += " AND h.center_id = :center_id"
            params["center_id"] = center_id
        
        if gender:
            registered_query += " AND i.gender = :gender"
            params["gender"] = gender
        
        if age_group:
            # Calculate age range based on age group
            if age_group == "Child":
                min_age, max_age = 0, 12
            elif age_group == "Teen":
                min_age, max_age = 13, 17
            elif age_group == "Adult":
                min_age, max_age = 18, 59
            else:  # Senior
                min_age, max_age = 60, 200
            
            # Calculate date range for the age group
            today = datetime.now().date()
            max_birth_date = date(today.year - min_age, today.month, today.day)
            min_birth_date = date(today.year - max_age - 1, today.month, today.day)
            
            registered_query += """
                AND i.date_of_birth IS NOT NULL
                AND i.date_of_birth >= :min_birth_date 
                AND i.date_of_birth <= :max_birth_date
            """
            params["min_birth_date"] = min_birth_date
            params["max_birth_date"] = max_birth_date
        
        registered_result = db.session.execute(
            text(registered_query),
            params
        ).fetchone()
        
        total_registered = registered_result[0] if registered_result else 0
        
        # Build query for total check-ins with filters
        checkins_query = """
            SELECT COUNT(DISTINCT ar.individual_id) as total_check_ins
            FROM attendance_records ar
            JOIN individuals i ON ar.individual_id = i.individual_id
            JOIN households h ON i.household_id = h.household_id
            WHERE ar.status = 'checked_in'
        """
        checkins_params = {}
        
        if center_id:
            checkins_query += " AND ar.center_id = :center_id"
            checkins_params["center_id"] = center_id
        
        if gender:
            checkins_query += " AND i.gender = :gender"
            checkins_params["gender"] = gender
        
        if age_group:
            # Same age calculation as above
            if age_group == "Child":
                min_age, max_age = 0, 12
            elif age_group == "Teen":
                min_age, max_age = 13, 17
            elif age_group == "Adult":
                min_age, max_age = 18, 59
            else:  # Senior
                min_age, max_age = 60, 200
            
            today = datetime.now().date()
            max_birth_date = date(today.year - min_age, today.month, today.day)
            min_birth_date = date(today.year - max_age - 1, today.month, today.day)
            
            checkins_query += """
                AND i.date_of_birth IS NOT NULL
                AND i.date_of_birth >= :min_birth_date 
                AND i.date_of_birth <= :max_birth_date
            """
            checkins_params["min_birth_date"] = min_birth_date
            checkins_params["max_birth_date"] = max_birth_date
        
        checkins_result = db.session.execute(
            text(checkins_query),
            checkins_params
        ).fetchone()
        
        total_check_ins = checkins_result[0] if checkins_result else 0
        
        # Calculate percentage
        percentage = 0
        if total_registered > 0:
            percentage = round((total_check_ins / total_registered) * 100, 2)
        
        return {
            "total_check_ins": total_check_ins,
            "total_registered": total_registered,
            "percentage": percentage
        }
        
    except Exception as error:
        logger.error("Error calculating registration stats: %s", str(error))
        return {
            "total_check_ins": 0,
            "total_registered": 0,
            "percentage": 0
        }


def get_aid_distribution_stats(
    center_id: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Calculate aid distribution efficiency.
    
    Formula: (Quantity Distributed / Total Allocated) × 100%
    
    Note: Gender and age filters do NOT apply to this stat.
    
    Args:
        center_id: Optional center ID (for center admin)
    
    Returns:
        Dictionary with aid distribution stats
    """
    try:
        # NOTE: Since allocation and distribution models don't exist yet,
        # returning placeholder data. This should be implemented once
        # those models are available.
        
        # TODO: Implement this query once allocations and distributions tables are ready
        # Example query structure:
        # SELECT 
        #     COALESCE(SUM(a.total_quantity), 0) as total_allocated,
        #     COALESCE(SUM(d.quantity_distributed), 0) as total_distributed
        # FROM allocations a
        # LEFT JOIN distributions d ON a.allocation_id = d.allocation_id
        # WHERE a.center_id = :center_id (if center_id provided)
        
        logger.warning("Aid distribution stats not yet implemented - allocation/distribution models pending")
        
        return {
            "total_distributed": 0,
            "total_allocated": 0,
            "percentage": 0
        }
        
    except Exception as error:
        logger.error("Error calculating aid distribution stats: %s", str(error))
        return {
            "total_distributed": 0,
            "total_allocated": 0,
            "percentage": 0
        }


def get_dashboard_stats(
    center_id: Optional[int] = None,
    gender: Optional[str] = None,
    age_group: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Get all dashboard statistics with optional filters.
    
    Args:
        center_id: Optional center ID (for center admin)
        gender: Optional gender filter (applies to occupancy and registration only)
        age_group: Optional age group filter (applies to occupancy and registration only)
    
    Returns:
        Dictionary with all dashboard stats
    """
    try:
        occupancy_stats = get_occupancy_stats(center_id, gender, age_group)
        registration_stats = get_registration_stats(center_id, gender, age_group)
        aid_distribution_stats = get_aid_distribution_stats(center_id)
        
        return {
            "success": True,
            "data": {
                "occupancy_stats": occupancy_stats,
                "registration_stats": registration_stats,
                "aid_distribution_stats": aid_distribution_stats
            }
        }
        
    except Exception as error:
        logger.error("Error fetching dashboard stats: %s", str(error))
        return {
            "success": False,
            "message": "Failed to fetch dashboard statistics"
        }
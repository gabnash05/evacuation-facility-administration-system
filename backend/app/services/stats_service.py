"""Service layer for dashboard statistics operations."""

import logging
from typing import Any, Dict, Optional

from app.models.stats import Stats

logger = logging.getLogger(__name__)


def get_occupancy_stats(
    center_id: Optional[int] = None,
    gender: Optional[str] = None,
    age_group: Optional[str] = None,
    event_id: Optional[int] = None,  # NEW
) -> Dict[str, Any]:
    """
    Calculate occupancy utilization rate.
    
    Formula: (Current Occupancy / Total Capacity) × 100%
    
    Args:
        center_id: Optional center ID (for center admin)
        gender: Optional gender filter (Male, Female, Other)
        age_group: Optional age group filter (Child, Teen, Adult, Senior)
        event_id: Optional event ID to filter stats by specific event
    
    Returns:
        Dictionary with occupancy stats
    """
    return Stats.get_occupancy_stats(center_id, gender, age_group, event_id)


def get_registration_stats(
    center_id: Optional[int] = None,
    gender: Optional[str] = None,
    age_group: Optional[str] = None,
    event_id: Optional[int] = None,  # NEW
) -> Dict[str, Any]:
    """
    Calculate individual registration penetration.
    
    Formula: (Check-ins / Registered Population) × 100%
    
    Args:
        center_id: Optional center ID (for center admin)
        gender: Optional gender filter (Male, Female, Other)
        age_group: Optional age group filter (Child, Teen, Adult, Senior)
        event_id: Optional event ID to filter stats by specific event
    
    Returns:
        Dictionary with registration stats
    """
    return Stats.get_registration_stats(center_id, gender, age_group, event_id)


def get_aid_distribution_stats(
    center_id: Optional[int] = None,
    event_id: Optional[int] = None,  # NEW
) -> Dict[str, Any]:
    """
    Calculate aid distribution efficiency.
    
    Formula: (Quantity Distributed / Total Allocated) × 100%
    
    Note: Gender and age filters do NOT apply to this stat.
    
    Args:
        center_id: Optional center ID (for center admin)
        event_id: Optional event ID to filter stats by specific event
    
    Returns:
        Dictionary with aid distribution stats
    """
    return Stats.get_aid_distribution_stats(center_id, event_id)


def get_dashboard_stats(
    center_id: Optional[int] = None,
    gender: Optional[str] = None,
    age_group: Optional[str] = None,
    event_id: Optional[int] = None,  # NEW
) -> Dict[str, Any]:
    """
    Get all dashboard statistics with optional filters.
    
    Args:
        center_id: Optional center ID (for center admin)
        gender: Optional gender filter (applies to occupancy and registration only)
        age_group: Optional age group filter (applies to occupancy and registration only)
        event_id: Optional event ID to filter stats by specific event
    
    Returns:
        Dictionary with all dashboard stats
    """
    try:
        stats_data = Stats.get_all_stats(center_id, gender, age_group, event_id)
        
        return {
            "success": True,
            "data": stats_data
        }
        
    except Exception as error:
        logger.error("Error fetching dashboard stats: %s", str(error))
        return {
            "success": False,
            "message": "Failed to fetch dashboard statistics"
        }
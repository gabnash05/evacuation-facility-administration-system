from app.models.event import Event, EventCenter
from app.models import db
import logging

logger = logging.getLogger(__name__)

class EventService:
    @staticmethod
    def get_all_events():
        events = Event.get_all()
        return {"success": True, "data": events}

    @staticmethod
    def get_event_details(event_id):
        event = Event.get_by_id(event_id)
        if not event:
            return {"success": False, "message": "Event not found"}
        
        centers = EventCenter.get_centers_by_event(event_id)
        return {"success": True, "data": {"event": event, "centers": centers}}

    @staticmethod
    def create_event(data):
        new_event = Event.create(data)
        return {"success": True, "data": new_event}

    @staticmethod
    def update_event(event_id, data):
        event = Event.get_by_id(event_id)
        if not event:
            return {"success": False, "message": "Event not found"}
        
        updated = Event.update(event_id, data)
        return {"success": True, "data": updated}

    @staticmethod
    def update_event_status(event_id, new_status):
        if new_status not in ["active", "resolved", "monitoring"]:
            return {"success": False, "message": "Invalid status value"}
        
        updated = Event.update_status(event_id, new_status)
        if not updated:
            return {"success": False, "message": "Event not found"}
        return {"success": True, "data": updated}

    @staticmethod
    def delete_event(event_id):
        event = Event.get_by_id(event_id)
        if not event:
            return {"success": False, "message": "Event not found"}
        
        Event.delete(event_id)
        return {"success": True, "message": "Event deleted successfully"}

    @staticmethod
    def get_event_centers(event_id):
        """Get all centers for an event"""
        event = Event.get_by_id(event_id)
        if not event:
            return {"success": False, "message": "Event not found"}
        
        centers = EventCenter.get_centers_by_event(event_id)
        return {"success": True, "data": centers}

    @staticmethod
    def add_center_to_event(event_id, center_id):
        """Add a single center to an event"""
        event = Event.get_by_id(event_id)
        if not event:
            return {"success": False, "message": "Event not found"}
        
        EventCenter.add_centers(event_id, [center_id])
        return {"success": True, "message": "Center added to event"}

    @staticmethod
    def remove_center_from_event(event_id, center_id):
        """Remove a single center from an event"""
        event = Event.get_by_id(event_id)
        if not event:
            return {"success": False, "message": "Event not found"}
        
        EventCenter.remove_centers(event_id, [center_id])
        return {"success": True, "message": "Center removed from event"}
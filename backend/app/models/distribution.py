from sqlalchemy import text
from app.models import db

class Allocation(db.Model):
    __tablename__ = "allocations"
    allocation_id = db.Column(db.Integer, primary_key=True)
    # ... other fields managed by groupmate ...

    @classmethod
    def get_by_id(cls, allocation_id):
        sql = text("SELECT * FROM allocations WHERE allocation_id = :id")
        result = db.session.execute(sql, {"id": allocation_id}).fetchone()
        return result._asdict() if result else None

class DistributionSession(db.Model):
    __tablename__ = "distribution_sessions"

    session_id = db.Column(db.Integer, primary_key=True)
    household_id = db.Column(db.Integer, db.ForeignKey("households.household_id"))
    distributed_by_user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"))
    center_id = db.Column(db.Integer, db.ForeignKey("evacuation_centers.center_id"))
    created_at = db.Column(db.DateTime, default=db.func.now())

    @classmethod
    def create(cls, data: dict):
        # We assume event_id is 1 for active event, or passed in data
        sql = text("""
            INSERT INTO distribution_sessions 
            (household_id, distributed_by_user_id, center_id, event_id, session_notes)
            VALUES (:household_id, :user_id, :center_id, :event_id, :notes)
            RETURNING session_id, created_at
        """)
        # Default event_id to 1 if not provided (temp fix until Event logic exists)
        params = {
            "household_id": data["household_id"],
            "user_id": data["user_id"],
            "center_id": data["center_id"],
            "event_id": data.get("event_id", 1), 
            "notes": data.get("notes", "")
        }
        result = db.session.execute(sql, params).fetchone()
        return result._asdict() if result else None

    @classmethod
    def get_history_paginated(cls, center_id=None, search=None, page=1, limit=10):
        offset = (page - 1) * limit
        
        # Base query joining necessary tables for the UI
        query = """
            SELECT 
                ds.session_id, ds.created_at as distribution_date,
                h.household_name,
                u.email as volunteer_name,
                -- Aggregate items into a single string for display (e.g., "Food (1), Water (2)")
                STRING_AGG(CONCAT(a.resource_name, ' (', d.quantity_distributed, ')'), ', ') as formatted_items,
                -- Also get raw items for editing
                JSON_AGG(JSON_BUILD_OBJECT(
                    'distribution_id', d.distribution_id,
                    'allocation_id', a.allocation_id,
                    'resource_name', a.resource_name,
                    'quantity', d.quantity_distributed
                )) as items
            FROM distribution_sessions ds
            JOIN households h ON ds.household_id = h.household_id
            JOIN users u ON ds.distributed_by_user_id = u.user_id
            JOIN distributions d ON ds.session_id = d.session_id
            JOIN allocations a ON d.allocation_id = a.allocation_id
            WHERE 1=1
        """
        
        params = {"limit": limit, "offset": offset}

        if center_id:
            query += " AND ds.center_id = :center_id"
            params["center_id"] = center_id
            
        if search:
            query += " AND (h.household_name ILIKE :search OR a.resource_name ILIKE :search)"
            params["search"] = f"%{search}%"

        query += """
            GROUP BY ds.session_id, h.household_name, u.email
            ORDER BY ds.created_at DESC
            LIMIT :limit OFFSET :offset
        """
        
        results = db.session.execute(text(query), params).fetchall()
        return [dict(row._mapping) for row in results]

    @classmethod
    def delete(cls, session_id):
        # The SQL trigger 'update_allocation_on_distribution_delete' 
        # will automatically restore stock when we delete rows from 'distributions'.
        # Cascading delete on session will delete distributions first.
        sql = text("DELETE FROM distribution_sessions WHERE session_id = :id")
        db.session.execute(sql, {"id": session_id})
        db.session.commit()

class Distribution(db.Model):
    __tablename__ = "distributions"

    distribution_id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("distribution_sessions.session_id"))
    allocation_id = db.Column(db.Integer, db.ForeignKey("allocations.allocation_id"))
    quantity_distributed = db.Column(db.Integer, nullable=False)

    @classmethod
    def add_item(cls, session_id, allocation_id, quantity):
        # The SQL trigger 'update_allocation_quantity' will run automatically here
        # and raise an error if stock is insufficient.
        sql = text("""
            INSERT INTO distributions (session_id, allocation_id, quantity_distributed)
            VALUES (:session_id, :allocation_id, :quantity)
            RETURNING distribution_id
        """)
        params = {
            "session_id": session_id,
            "allocation_id": allocation_id,
            "quantity": quantity
        }
        result = db.session.execute(sql, params).fetchone()
        return result._asdict() if result else None

    @classmethod
    def update_quantity(cls, distribution_id, new_quantity):
        # We assume an UPDATE trigger exists, or we handle logic in Service
        sql = text("""
            UPDATE distributions 
            SET quantity_distributed = :quantity 
            WHERE distribution_id = :id
        """)
        db.session.execute(sql, {"quantity": new_quantity, "id": distribution_id})
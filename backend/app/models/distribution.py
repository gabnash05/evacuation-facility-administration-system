from sqlalchemy import text
from app.models import db


class DistributionSession(db.Model):
    __tablename__ = "distribution_sessions"

    session_id = db.Column(db.Integer, primary_key=True)
    household_id = db.Column(db.Integer, db.ForeignKey("households.household_id"))
    distributed_by_user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"))
    center_id = db.Column(db.Integer, db.ForeignKey("evacuation_centers.center_id"))
    created_at = db.Column(db.DateTime, default=db.func.now())

    @classmethod
    def create(cls, data: dict):
        try:
            sql = text("""
                INSERT INTO distribution_sessions 
                (household_id, distributed_by_user_id, center_id, event_id, session_notes)
                VALUES (:household_id, :user_id, :center_id, :event_id, :notes)
                RETURNING session_id
            """)
            params = {
                "household_id": data["household_id"],
                "user_id": data["user_id"],
                "center_id": data["center_id"],
                "event_id": data.get("event_id", 1), 
                "notes": data.get("notes", "")
            }
            result = db.session.execute(sql, params).fetchone()
            db.session.commit()
            return result._asdict() if result else None
        except Exception as e:
            db.session.rollback()
            raise e
    
    @classmethod
    def update_household(cls, session_id, household_id):
        try:
            sql = text("UPDATE distribution_sessions SET household_id = :household_id WHERE session_id = :session_id")
            db.session.execute(sql, {"household_id": household_id, "session_id": session_id})
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise e


class Distribution(db.Model):
    __tablename__ = "distributions"

    distribution_id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("distribution_sessions.session_id"))
    allocation_id = db.Column(db.Integer, db.ForeignKey("allocations.allocation_id"))
    quantity_distributed = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='completed')

    @classmethod
    def get_history_paginated(cls, center_id=None, search=None, page=1, limit=10, sort_by="distribution_date", sort_order="desc"):
        offset = (page - 1) * limit
        
        sort_column_mapping = {
            "distribution_date": "ds.created_at",
            "household_name": "h.household_name",
            "category_name": "ac.category_name",
            "resource_name": "a.resource_name",
            "quantity": "d.quantity_distributed",
            "volunteer_name": "u.email",
            "status": "d.status"
        }
        
        db_sort_column = sort_column_mapping.get(sort_by, "ds.created_at")
        db_sort_order = "DESC" if sort_order.lower() == "desc" else "ASC"
        
        base_query = """
            FROM distributions d
            JOIN distribution_sessions ds ON d.session_id = ds.session_id
            JOIN households h ON ds.household_id = h.household_id
            JOIN users u ON ds.distributed_by_user_id = u.user_id
            JOIN allocations a ON d.allocation_id = a.allocation_id
            JOIN aid_categories ac ON a.category_id = ac.category_id
            WHERE 1=1
        """
        
        params = {"limit": limit, "offset": offset}

        if center_id:
            base_query += " AND ds.center_id = :center_id"
            params["center_id"] = center_id
            
        if search:
            base_query += " AND (h.household_name ILIKE :search OR a.resource_name ILIKE :search OR ac.category_name ILIKE :search)"
            params["search"] = f"%{search}%"

        try:
            count_sql = text(f"SELECT COUNT(*) {base_query}")
            total_count = db.session.execute(count_sql, params).scalar() or 0

            data_sql = text(f"""
                SELECT 
                    d.distribution_id, 
                    ds.created_at as distribution_date,
                    h.household_id,
                    h.household_name,
                    u.email as volunteer_name,
                    a.resource_name,
                    ac.category_name,
                    a.allocation_id,
                    d.quantity_distributed as quantity,
                    d.status,
                    ds.center_id
                {base_query}
                ORDER BY {db_sort_column} {db_sort_order}, d.distribution_id DESC
                LIMIT :limit OFFSET :offset
            """)
            
            results = db.session.execute(data_sql, params).fetchall()
            
            data = []
            for row in results:
                row_dict = dict(row._mapping)
                data.append({
                    "distribution_id": row_dict.get("distribution_id"),
                    "distribution_date": row_dict.get("distribution_date").isoformat() if row_dict.get("distribution_date") else None,
                    "household_id": row_dict.get("household_id"),
                    "household_name": row_dict.get("household_name"),
                    "volunteer_name": row_dict.get("volunteer_name"),
                    "resource_name": row_dict.get("resource_name"),
                    "category_name": row_dict.get("category_name"),
                    "allocation_id": row_dict.get("allocation_id"),
                    "quantity": row_dict.get("quantity"),
                    "status": row_dict.get("status"),
                    "center_id": row_dict.get("center_id")
                })
            
            return {
                "data": data,
                "total": total_count,
            }
        except Exception as e:
            db.session.rollback()
            raise e

    @classmethod
    def add_item(cls, session_id, allocation_id, quantity):
        try:
            sql = text("""
                INSERT INTO distributions (session_id, allocation_id, quantity_distributed, status)
                VALUES (:session_id, :allocation_id, :quantity, 'completed') 
                RETURNING distribution_id
            """)
            params = {"session_id": session_id, "allocation_id": allocation_id, "quantity": quantity}
            result = db.session.execute(sql, params).fetchone()
            db.session.commit()
            return result._asdict() if result else None
        except Exception as e:
            db.session.rollback()
            raise e

    @classmethod
    def get_by_id(cls, distribution_id):
        try:
            sql = text("""
                SELECT d.*, ds.household_id, ds.session_id 
                FROM distributions d
                JOIN distribution_sessions ds ON d.session_id = ds.session_id
                WHERE d.distribution_id = :id
            """)
            result = db.session.execute(sql, {"id": distribution_id}).fetchone()
            return result._asdict() if result else None
        except Exception as e:
            db.session.rollback()
            raise e

    @classmethod
    def update(cls, distribution_id, data):
        try:
            sql = text("UPDATE distributions SET allocation_id = :allocation_id, quantity_distributed = :quantity WHERE distribution_id = :id")
            params = {"id": distribution_id, "allocation_id": data["allocation_id"], "quantity": data["quantity"]}
            db.session.execute(sql, params)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise e

    @classmethod
    def delete(cls, distribution_id):
        try:
            sql = text("DELETE FROM distributions WHERE distribution_id = :id RETURNING distribution_id")
            result = db.session.execute(sql, {"id": distribution_id}).fetchone()
            db.session.commit()
            return result is not None
        except Exception as e:
            db.session.rollback()
            raise e

    @classmethod
    def update_status(cls, distribution_id, new_status):
        try:
            sql = text("UPDATE distributions SET status = :status WHERE distribution_id = :id")
            db.session.execute(sql, {"status": new_status, "id": distribution_id})
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise e
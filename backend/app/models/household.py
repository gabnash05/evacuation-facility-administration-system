from sqlalchemy import text
from app.models import db

class Household(db.Model):
    __tablename__ = "households"

    household_id = db.Column(db.Integer, primary_key=True)
    household_head_id = db.Column(db.Integer, db.ForeignKey('individuals.individual_id'))
    center_id = db.Column(db.Integer, db.ForeignKey('evacuation_centers.center_id'), nullable=False)
    household_name = db.Column(db.String(100), nullable=False)
    address = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())

    @classmethod
    def set_head(cls, household_id: int, head_individual_id: int):
        sql = text("UPDATE households SET household_head_id = :head_id WHERE household_id = :household_id")
        db.session.execute(sql, {"head_id": head_individual_id, "household_id": household_id})

    @classmethod
    def get_by_id(cls, household_id: int):
        sql = text("""
            SELECT 
                h.household_id, h.household_name AS name, h.address, 
                h.center_id, h.household_head_id
            FROM households h WHERE h.household_id = :id
        """)
        result = db.session.execute(sql, {"id": household_id}).fetchone()
        return result._asdict() if result else None

    @classmethod
    def get_by_name(cls, name: str):
        sql = text("SELECT household_id FROM households WHERE household_name ILIKE :name")
        result = db.session.execute(sql, {"name": name}).fetchone()
        return result

    @classmethod
    def create(cls, data: dict):
        sql = text("""
            INSERT INTO households (household_name, address, center_id)
            VALUES (:household_name, :address, :center_id)
            RETURNING *, household_name AS name
        """)
        result = db.session.execute(sql, data).fetchone()
        return result._asdict() if result else None

    @classmethod
    def update(cls, household_id: int, data: dict):
        sql = text("""
            UPDATE households SET household_name = :household_name, address = :address, 
                center_id = :center_id, household_head_id = :household_head_id
            WHERE household_id = :household_id
            RETURNING household_id, household_name AS name, address, center_id, household_head_id
        """)
        params = {"household_name": data.get("household_name"), "address": data.get("address"), "center_id": data.get("center_id"), "household_head_id": data.get("household_head_id"), "household_id": household_id}
        result = db.session.execute(sql, params).fetchone()
        return result._asdict() if result else None
    
    @classmethod
    def delete(cls, household_id: int):
        sql = text("DELETE FROM households WHERE household_id = :id")
        db.session.execute(sql, {"id": household_id})
        db.session.commit()

    @classmethod
    def get_all_paginated(cls, search: str, offset: int, limit: int, sort_by: str, sort_direction: str):
        search_query = f"%{search}%"
        allowed_sort_columns = {"name": "h.household_name", "head": "head", "address": "h.address", "evacCenter": "ec.center_name"}
        sort_column = allowed_sort_columns.get(sort_by, "h.household_name")
        if sort_direction.lower() not in ['asc', 'desc']: sort_direction = 'asc'
        order_by_clause = f"ORDER BY {sort_column} {sort_direction}"
        
        sql_query = f"""
            SELECT
                h.household_id,
                h.household_name AS name,
                h.address,
                CONCAT(i.first_name, ' ', i.last_name) AS head,
                ec.center_name AS "evacCenter"
            FROM
                households h
            LEFT JOIN
                individuals i ON h.household_head_id = i.individual_id
            LEFT JOIN
                evacuation_centers ec ON h.center_id = ec.center_id
            WHERE
                h.household_name ILIKE :search OR
                h.address ILIKE :search OR
                EXISTS (
                    SELECT 1 FROM individuals ind
                    WHERE ind.household_id = h.household_id
                    AND CONCAT(ind.first_name, ' ', ind.last_name) ILIKE :search
                )
            {order_by_clause}
            LIMIT :limit OFFSET :offset
        """

        result = db.session.execute(text(sql_query), {"search": search_query, "limit": limit, "offset": offset}).fetchall()
        return [dict(row._mapping) for row in result]

    @classmethod
    def get_count(cls, search: str):
        search_query = f"%{search}%"
        sql = text("""
            SELECT COUNT(h.household_id)
            FROM households h
            WHERE
                h.household_name ILIKE :search OR
                h.address ILIKE :search OR
                EXISTS (
                    SELECT 1 FROM individuals ind
                    WHERE ind.household_id = h.household_id
                    AND CONCAT(ind.first_name, ' ', ind.last_name) ILIKE :search
                )
        """)
        result = db.session.execute(sql, {"search": search_query}).scalar()
        return result if result is not None else 0
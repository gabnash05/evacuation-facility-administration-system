# FILE NAME: app/models/household.py

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

    # --- NEW: Helper method to find a household by ID ---
    @classmethod
    def get_by_id(cls, household_id: int):
        sql = text("SELECT household_id FROM households WHERE household_id = :id")
        result = db.session.execute(sql, {"id": household_id}).fetchone()
        return result

    # --- NEW: Method to delete a household ---
    @classmethod
    def delete(cls, household_id: int):
        # First, confirm the household exists before attempting to delete
        if not cls.get_by_id(household_id):
            return 0 # Indicates no rows were affected

        sql = text("DELETE FROM households WHERE household_id = :id")
        result = db.session.execute(sql, {"id": household_id})
        db.session.commit()
        return result.rowcount # Returns the number of rows deleted (should be 1)

    # --- Existing method for listing households ---
    @classmethod
    def get_all_paginated(cls, search: str, offset: int, limit: int, sort_by: str, sort_direction: str):
        search_query = f"%{search}%"
        
        allowed_sort_columns = {
            "name": "h.household_name",
            "head": "head",
            "address": "h.address",
            "evacCenter": "evacCenter"
        }
        
        sort_column = allowed_sort_columns.get(sort_by, "h.household_name")
        
        if sort_direction.lower() not in ['asc', 'desc']:
            sort_direction = 'asc'
        
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
                CONCAT(i.first_name, ' ', i.last_name) ILIKE :search OR
                ec.center_name ILIKE :search
            {order_by_clause}
            LIMIT :limit OFFSET :offset
        """

        result = db.session.execute(text(sql_query), {"search": search_query, "limit": limit, "offset": offset}).fetchall()
        return [dict(row._mapping) for row in result]

    # --- Existing method for counting households ---
    @classmethod
    def get_count(cls, search: str):
        search_query = f"%{search}%"
        sql = text("""
            SELECT COUNT(h.household_id)
            FROM households h
            LEFT JOIN individuals i ON h.household_head_id = i.individual_id
            LEFT JOIN evacuation_centers ec ON h.center_id = ec.center_id
            WHERE
                h.household_name ILIKE :search OR
                h.address ILIKE :search OR
                CONCAT(i.first_name, ' ', i.last_name) ILIKE :search OR
                ec.center_name ILIKE :search
        """)
        result = db.session.execute(sql, {"search": search_query}).scalar()
        return result if result is not None else 0
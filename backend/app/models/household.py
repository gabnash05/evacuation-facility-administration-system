from sqlalchemy import text
from app.models import db


class Household(db.Model):
    __tablename__ = "households"

    household_id = db.Column(db.Integer, primary_key=True)
    household_head_id = db.Column(
        db.Integer, db.ForeignKey("individuals.individual_id")
    )
    center_id = db.Column(
        db.Integer, db.ForeignKey("evacuation_centers.center_id"), nullable=False
    )
    household_name = db.Column(db.String(100), nullable=False)
    address = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())

    @classmethod
    def set_head(cls, household_id: int, head_individual_id: int):
        sql = text(
            "UPDATE households SET household_head_id = :head_id WHERE household_id = :household_id"
        )
        db.session.execute(
            sql, {"head_id": head_individual_id, "household_id": household_id}
        )

    @classmethod
    def get_by_id(cls, household_id: int):
        sql = text(
            """
            SELECT 
                h.household_id, h.household_name, h.address, 
                h.center_id, h.household_head_id,
                h.created_at, h.updated_at
            FROM households h WHERE h.household_id = :id
        """
        )
        result = db.session.execute(sql, {"id": household_id}).fetchone()
        return result._asdict() if result else None

    @classmethod
    def get_by_name(cls, name: str):
        sql = text(
            "SELECT household_id FROM households WHERE household_name ILIKE :name"
        )
        result = db.session.execute(sql, {"name": name}).fetchone()
        return result

    @classmethod
    def create(cls, data: dict):
        sql = text(
            """
            INSERT INTO households (household_name, address, center_id)
            VALUES (:household_name, :address, :center_id)
            RETURNING *, household_name AS name
        """
        )
        result = db.session.execute(sql, data).fetchone()
        return result._asdict() if result else None

    @classmethod
    def update(cls, household_id: int, data: dict):
        sql = text(
            """
            UPDATE households SET household_name = :household_name, address = :address, 
                center_id = :center_id, household_head_id = :household_head_id
            WHERE household_id = :household_id
            RETURNING household_id, household_name, address, center_id, household_head_id, created_at, updated_at
        """
        )
        params = {
            "household_name": data.get("household_name"),
            "address": data.get("address"),
            "center_id": data.get("center_id"),
            "household_head_id": data.get("household_head_id"),
            "household_id": household_id,
        }
        result = db.session.execute(sql, params).fetchone()
        return result._asdict() if result else None

    @classmethod
    def delete(cls, household_id: int):
        sql = text("DELETE FROM households WHERE household_id = :id")
        db.session.execute(sql, {"id": household_id})
        db.session.commit()

    @classmethod
    def get_all_paginated(
        cls, search: str, offset: int, limit: int, sort_by: str, sort_direction: str
    ):
        search_query = f"%{search}%"
        allowed_sort_columns = {
            "household_name": "h.household_name",
            "head": "CONCAT(i.first_name, ' ', i.last_name)",
            "address": "h.address",
            "center": "ec.center_name",
        }
        sort_column = allowed_sort_columns.get(sort_by, "h.household_name")
        if sort_direction.lower() not in ["asc", "desc"]:
            sort_direction = "asc"
        order_by_clause = f"ORDER BY {sort_column} {sort_direction}"

        sql_query = f"""
            SELECT
                h.household_id,
                h.household_name,
                h.address,
                h.center_id,
                h.household_head_id,
                h.created_at,
                h.updated_at,
                -- Center object
                ec.center_id AS center_center_id,
                ec.center_name AS center_center_name,
                ec.address AS center_address,
                ec.capacity AS center_capacity,
                ec.current_occupancy AS center_current_occupancy,
                ec.status AS center_status,
                ec.created_at AS center_created_at,
                ec.updated_at AS center_updated_at,
                -- Household head object
                i.individual_id AS head_individual_id,
                i.first_name AS head_first_name,
                i.last_name AS head_last_name,
                i.date_of_birth AS head_date_of_birth,
                i.gender AS head_gender,
                i.relationship_to_head AS head_relationship_to_head,
                i.created_at AS head_created_at,
                i.updated_at AS head_updated_at
            FROM
                households h
            LEFT JOIN
                individuals i ON h.household_head_id = i.individual_id
            LEFT JOIN
                evacuation_centers ec ON h.center_id = ec.center_id
            WHERE
                (:search = '' OR 
                h.household_name ILIKE '%' || :search || '%' OR
                h.address ILIKE '%' || :search || '%' OR
                EXISTS (
                    SELECT 1 FROM individuals ind
                    WHERE ind.household_id = h.household_id
                    AND CONCAT(ind.first_name, ' ', ind.last_name) ILIKE '%' || :search || '%'
                ))
            {order_by_clause}
            LIMIT :limit OFFSET :offset
        """

        result = db.session.execute(
            text(sql_query), {"search": search_query, "limit": limit, "offset": offset}
        ).fetchall()

        # Transform the flat result into nested objects with snake_case field names
        households = []
        for row in result:
            row_dict = dict(row._mapping)

            # Build center object if center data exists
            center = None
            if row_dict.get("center_center_id"):
                center = {
                    "center_id": row_dict["center_center_id"],
                    "center_name": row_dict["center_center_name"],
                    "address": row_dict["center_address"],
                    "capacity": row_dict["center_capacity"],
                    "current_occupancy": row_dict["center_current_occupancy"],
                    "status": row_dict["center_status"],
                    "created_at": row_dict["center_created_at"],
                    "updated_at": row_dict["center_updated_at"],
                }

            # Build household head object if head data exists
            household_head = None
            if row_dict.get("head_individual_id"):
                household_head = {
                    "individual_id": row_dict["head_individual_id"],
                    "first_name": row_dict["head_first_name"],
                    "last_name": row_dict["head_last_name"],
                    "date_of_birth": row_dict["head_date_of_birth"],
                    "gender": row_dict["head_gender"],
                    "relationship_to_head": row_dict["head_relationship_to_head"],
                    "created_at": row_dict["head_created_at"],
                    "updated_at": row_dict["head_updated_at"],
                }

            # Build the final household object with snake_case field names
            household = {
                "household_id": row_dict["household_id"],
                "household_name": row_dict["household_name"],
                "address": row_dict["address"],
                "center_id": row_dict["center_id"],
                "household_head_id": row_dict["household_head_id"],
                "created_at": row_dict["created_at"],
                "updated_at": row_dict["updated_at"],
                "center": center,
                "household_head": household_head,
            }

            households.append(household)

        return households

        # Transform the flat result into nested objects
        households = []
        for row in result:
            row_dict = dict(row._mapping)

            # Build center object if center data exists
            center = None
            if row_dict.get("center_center_id"):
                center = {
                    "center_id": row_dict["center_center_id"],
                    "center_name": row_dict["center_center_name"],
                    "address": row_dict["center_address"],
                    "capacity": row_dict["center_capacity"],
                    "current_occupancy": row_dict["center_current_occupancy"],
                    "status": row_dict["center_status"],
                    "created_at": row_dict["center_created_at"],
                    "updated_at": row_dict["center_updated_at"],
                }

            # Build household head object if head data exists
            household_head = None
            if row_dict.get("head_individual_id"):
                household_head = {
                    "individual_id": row_dict["head_individual_id"],
                    "first_name": row_dict["head_first_name"],
                    "last_name": row_dict["head_last_name"],
                    "date_of_birth": row_dict["head_date_of_birth"],
                    "gender": row_dict["head_gender"],
                    "relationship_to_head": row_dict["head_relationship_to_head"],
                    "created_at": row_dict["head_created_at"],
                    "updated_at": row_dict["head_updated_at"],
                }

            # Build the final household object
            household = {
                "householdId": row_dict["householdId"],
                "householdName": row_dict["householdName"],
                "address": row_dict["address"],
                "centerId": row_dict["centerId"],
                "householdHeadId": row_dict["householdHeadId"],
                "createdAt": row_dict["createdAt"],
                "updatedAt": row_dict["updatedAt"],
                "center": center,
                "householdHead": household_head,
            }

            households.append(household)

        return households

    @classmethod
    def get_count(cls, search: str):
        search_query = f"%{search}%"
        sql = text(
            """
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
        """
        )
        result = db.session.execute(sql, {"search": search_query}).scalar()
        return result if result is not None else 0

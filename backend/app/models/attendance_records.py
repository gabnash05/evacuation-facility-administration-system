"""Attendance Records model for EFAS."""

from typing import Any, Dict, List, Optional
from sqlalchemy import text
from app.models import db


class AttendanceRecord(db.Model):
    """Attendance Record model for tracking attendance and transfers between individuals."""

    __tablename__ = "attendance_records"

    record_id = db.Column(db.Integer, primary_key=True)
    individual_id = db.Column(db.Integer, nullable=False, index=True)
    center_id = db.Column(db.Integer, nullable=False, index=True)
    event_id = db.Column(db.Integer, nullable=False, index=True)
    household_id = db.Column(db.Integer, nullable=False, index=True)
    status = db.Column(db.String(20), nullable=False)
    check_in_time = db.Column(db.DateTime, nullable=True)
    check_out_time = db.Column(db.DateTime, nullable=True)
    transfer_from_center_id = db.Column(db.Integer, nullable=True)
    transfer_to_center_id = db.Column(db.Integer, nullable=True)
    transfer_time = db.Column(db.DateTime, nullable=True)
    recorded_by_user_id = db.Column(db.Integer, nullable=False)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())

    def to_dict(self):
        """Convert attendance record to dictionary for JSON serialization."""
        return {
            "record_id": self.record_id,
            "individual_id": self.individual_id,
            "center_id": self.center_id,
            "event_id": self.event_id,
            "household_id": self.household_id,
            "status": self.status,
            "check_in_time": self.check_in_time.isoformat() if self.check_in_time else None,
            "check_out_time": self.check_out_time.isoformat() if self.check_out_time else None,
            "transfer_from_center_id": self.transfer_from_center_id,
            "transfer_to_center_id": self.transfer_to_center_id,
            "transfer_time": self.transfer_time.isoformat() if self.transfer_time else None,
            "recorded_by_user_id": self.recorded_by_user_id,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f"<AttendanceRecord(record_id={self.record_id}, individual_id={self.individual_id}, status='{self.status}')>"

    @classmethod
    def _row_to_record(cls, row) -> Optional["AttendanceRecord"]:
        """Convert SQLAlchemy Row to AttendanceRecord object."""
        if not row:
            return None

        try:
            row_dict = row._asdict()
        except AttributeError:
            row_dict = dict(row)

        return cls(**row_dict)

    @classmethod
    def get_by_id(cls, record_id: int) -> Optional["AttendanceRecord"]:
        """Get attendance record by ID using raw SQL."""
        result = db.session.execute(
            text("SELECT * FROM attendance_records WHERE record_id = :record_id"),
            {"record_id": record_id},
        ).fetchone()

        return cls._row_to_record(result)

    @classmethod
    def get_all(
        cls,
        center_id: Optional[int] = None,
        individual_id: Optional[int] = None,
        event_id: Optional[int] = None,
        household_id: Optional[int] = None,
        status: Optional[str] = None,
        date: Optional[str] = None,
        page: int = 1,
        limit: int = 10,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = "desc",
    ) -> Dict[str, Any]:
        # Base query
        base_query = "FROM attendance_records WHERE 1=1"
        count_query = "SELECT COUNT(*) as total_count FROM attendance_records WHERE 1=1"
        params = {}

        # Add filters
        if center_id:
            base_query += " AND center_id = :center_id"
            count_query += " AND center_id = :center_id"
            params["center_id"] = center_id

        if individual_id:
            base_query += " AND individual_id = :individual_id"
            count_query += " AND individual_id = :individual_id"
            params["individual_id"] = individual_id

        if event_id:
            base_query += " AND event_id = :event_id"
            count_query += " AND event_id = :event_id"
            params["event_id"] = event_id

        if household_id:
            base_query += " AND household_id = :household_id"
            count_query += " AND household_id = :household_id"
            params["household_id"] = household_id

        if status:
            base_query += " AND status = :status"
            count_query += " AND status = :status"
            params["status"] = status

        if date:
            base_query += " AND DATE(check_in_time) = :date"
            count_query += " AND DATE(check_in_time) = :date"
            params["date"] = date

        # Get total count
        count_result = db.session.execute(text(count_query), params).fetchone()
        total_count = count_result[0] if count_result else 0

        # Build main query
        select_query = f"SELECT * {base_query}"

        # Add sorting
        if sort_by and sort_by in [
            "check_in_time",
            "check_out_time",
            "transfer_time",
            "created_at",
        ]:
            order_direction = "DESC" if sort_order and sort_order.lower() == "desc" else "ASC"
            select_query += f" ORDER BY {sort_by} {order_direction}"
        else:
            select_query += " ORDER BY created_at DESC"

        # Add pagination
        offset = (page - 1) * limit
        select_query += " LIMIT :limit OFFSET :offset"
        params["limit"] = limit
        params["offset"] = offset

        # Execute query
        results = db.session.execute(text(select_query), params).fetchall()

        records = [
            cls._row_to_record(row) for row in results if cls._row_to_record(row)
        ]

        return {
            "records": records,
            "total_count": total_count,
            "page": page,
            "limit": limit,
            "total_pages": (total_count + limit - 1) // limit,
        }

    @classmethod
    def create(cls, data: Dict[str, Any]) -> "AttendanceRecord":
        """Create a new attendance record using raw SQL."""
        required_fields = ["individual_id", "center_id", "event_id", "household_id", "status", "recorded_by_user_id"]
        
        for field in required_fields:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")

        # Build dynamic INSERT query based on provided fields
        fields = []
        values = []
        params = {}

        for field in [
            "individual_id", "center_id", "event_id", "household_id", "status",
            "check_in_time", "check_out_time", "transfer_from_center_id",
            "transfer_to_center_id", "transfer_time", "recorded_by_user_id", "notes"
        ]:
            if field in data and data[field] is not None:
                fields.append(field)
                values.append(f":{field}")
                params[field] = data[field]

        query = text(
            f"""  
            INSERT INTO attendance_records ({', '.join(fields)})
            VALUES ({', '.join(values)})
            RETURNING record_id, created_at, updated_at
            """
        )

        result = db.session.execute(query, params).fetchone()
        db.session.commit()

        result_dict = result._asdict()

        # Create record object with all data
        record_data = {**data, **result_dict}
        return cls(**record_data)

    @classmethod
    def update(
        cls, record_id: int, update_data: Dict[str, Any]
    ) -> Optional["AttendanceRecord"]:
        """Update attendance record using raw SQL."""
        # Build dynamic UPDATE query
        set_clauses = []
        params = {"record_id": record_id}

        for field, value in update_data.items():
            if field != "record_id":  # Prevent ID modification
                set_clauses.append(f"{field} = :{field}")
                params[field] = value

        if not set_clauses:
            return None

        # Add updated_at timestamp
        set_clauses.append("updated_at = NOW()")

        query = text(
            f"""  
            UPDATE attendance_records 
            SET {', '.join(set_clauses)}
            WHERE record_id = :record_id
            RETURNING *
            """
        )

        result = db.session.execute(query, params).fetchone()
        db.session.commit()

        return cls._row_to_record(result)

    @classmethod
    def delete(cls, record_id: int) -> bool:
        """Delete an attendance record using raw SQL."""
        result = db.session.execute(
            text(
                """  
                DELETE FROM attendance_records
                WHERE record_id = :record_id 
                RETURNING record_id
                """
            ),
            {"record_id": record_id},
        ).fetchone()

        db.session.commit()
        return result is not None

    @classmethod
    def check_in_individual(
        cls,
        individual_id: int,
        center_id: int,
        event_id: int,
        household_id: int,
        recorded_by_user_id: int,
        check_in_time: str,
        notes: Optional[str] = None
    ) -> "AttendanceRecord":
        """Check in an individual to a center."""
        data = {
            "individual_id": individual_id,
            "center_id": center_id,
            "event_id": event_id,
            "household_id": household_id,
            "status": "checked_in",
            "check_in_time": check_in_time,
            "recorded_by_user_id": recorded_by_user_id,
            "notes": notes
        }

        return cls.create(data)

    @classmethod
    def check_out_individual(
        cls,
        record_id: int,
        check_out_time: str,
        notes: Optional[str] = None
    ) -> Optional["AttendanceRecord"]:
        """Check out an individual from a center."""
        update_data = {
            "status": "checked_out",
            "check_out_time": check_out_time,
            "notes": notes
        }

        return cls.update(record_id, update_data)

    @classmethod
    def transfer_individual(
        cls,
        record_id: int,
        transfer_to_center_id: int,
        transfer_time: str,
        recorded_by_user_id: int,
        notes: Optional[str] = None
    ) -> Optional["AttendanceRecord"]:
        """Transfer an individual to a different center."""
        # Get current record
        current_record = cls.get_by_id(record_id)
        if not current_record:
            return None

        # Update current record to mark as transferred
        update_data = {
            "status": "transferred",
            "transfer_to_center_id": transfer_to_center_id,
            "transfer_time": transfer_time,
            "recorded_by_user_id": recorded_by_user_id,
            "notes": notes
        }

        return cls.update(record_id, update_data)

    @classmethod
    def get_current_evacuees_by_center(cls, center_id: int) -> List["AttendanceRecord"]:
        """Get all currently checked-in individuals at a center."""
        results = db.session.execute(
            text("""
                SELECT * FROM attendance_records 
                WHERE center_id = :center_id 
                AND status = 'checked_in' 
                AND check_out_time IS NULL
                ORDER BY check_in_time DESC
            """),
            {"center_id": center_id}
        ).fetchall()

        return [cls._row_to_record(row) for row in results if cls._row_to_record(row)]

    @classmethod
    def get_attendance_summary_by_center(cls, center_id: int, event_id: Optional[int] = None) -> Dict[str, Any]:
        """Get attendance summary for a center."""
        base_query = """
            SELECT 
                COUNT(*) as total_entries,
                COUNT(CASE WHEN status = 'checked_in' AND check_out_time IS NULL THEN 1 END) as current_checked_in,
                COUNT(CASE WHEN status = 'checked_out' THEN 1 END) as total_checked_out,
                COUNT(CASE WHEN status = 'transferred' THEN 1 END) as total_transferred
            FROM attendance_records 
            WHERE center_id = :center_id
        """
        params = {"center_id": center_id}

        if event_id:
            base_query += " AND event_id = :event_id"
            params["event_id"] = event_id

        result = db.session.execute(text(base_query), params).fetchone()

        return {
            "total_entries": result[0] if result else 0,
            "current_checked_in": result[1] if result else 0,
            "total_checked_out": result[2] if result else 0,
            "total_transferred": result[3] if result else 0
        }

    @classmethod
    def get_individual_attendance_history(cls, individual_id: int) -> List["AttendanceRecord"]:
        """Get complete attendance history for an individual."""
        results = db.session.execute(
            text("""
                SELECT * FROM attendance_records 
                WHERE individual_id = :individual_id 
                ORDER BY check_in_time DESC
            """),
            {"individual_id": individual_id}
        ).fetchall()

        return [cls._row_to_record(row) for row in results if cls._row_to_record(row)]

    @classmethod
    def recalculate_center_occupancy(cls, center_id: int) -> int:
        """Recalculate occupancy for a specific center."""
        result = db.session.execute(
            text("SELECT recalculate_center_occupancy(:center_id)"),
            {"center_id": center_id}
        ).fetchone()
        
        return result[0] if result else 0

    @classmethod
    def recalculate_all_center_occupancies(cls) -> List[Dict[str, Any]]:
        """Recalculate occupancy for all centers."""
        results = db.session.execute(
            text("SELECT * FROM recalculate_all_center_occupancies()")
        ).fetchall()
        
        return [
            {
                "center_id": row[0],
                "center_name": row[1],
                "old_occupancy": row[2],
                "new_occupancy": row[3]
            }
            for row in results
        ]
    
    @classmethod
    def get_transfer_records(
        cls,
        center_id: Optional[int] = None,
        page: int = 1,
        limit: int = 10,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = "desc",
    ) -> Dict[str, Any]:
        """Get all transfer records with optional center filtering."""
        # Base query for transfers
        base_query = """
            FROM attendance_records 
            WHERE status = 'transferred'
            AND transfer_from_center_id IS NOT NULL
            AND transfer_to_center_id IS NOT NULL
        """
        count_query = """
            SELECT COUNT(*) as total_count 
            FROM attendance_records 
            WHERE status = 'transferred'
            AND transfer_from_center_id IS NOT NULL
            AND transfer_to_center_id IS NOT NULL
        """
        params = {}

        # Add center filter (shows transfers FROM this center)
        if center_id:
            base_query += " AND transfer_from_center_id = :center_id"
            count_query += " AND transfer_from_center_id = :center_id"
            params["center_id"] = center_id

        # Get total count
        count_result = db.session.execute(text(count_query), params).fetchone()
        total_count = count_result[0] if count_result else 0

        # Build main query
        select_query = f"SELECT * {base_query}"

        # Add sorting
        if sort_by and sort_by in [
            "transfer_time",
            "check_in_time",
            "created_at",
        ]:
            order_direction = "DESC" if sort_order and sort_order.lower() == "desc" else "ASC"
            select_query += f" ORDER BY {sort_by} {order_direction}"
        else:
            select_query += " ORDER BY transfer_time DESC"

        # Add pagination
        offset = (page - 1) * limit
        select_query += " LIMIT :limit OFFSET :offset"
        params["limit"] = limit
        params["offset"] = offset

        # Execute query
        results = db.session.execute(text(select_query), params).fetchall()

        records = [
            cls._row_to_record(row) for row in results if cls._row_to_record(row)
        ]

        return {
            "records": records,
            "total_count": total_count,
            "page": page,
            "limit": limit,
            "total_pages": (total_count + limit - 1) // limit,
        }

    @classmethod
    def get_event_attendance(
        cls,
        event_id: int,
        center_id: Optional[int] = None,
        page: int = 1,
        limit: int = 10,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = "desc",
    ) -> Dict[str, Any]:
        """Get comprehensive event attendance reporting across all centers."""
        # Base query
        base_query = "FROM attendance_records WHERE event_id = :event_id"
        count_query = "SELECT COUNT(*) as total_count FROM attendance_records WHERE event_id = :event_id"
        params = {"event_id": event_id}

        # Add center filter
        if center_id:
            base_query += " AND center_id = :center_id"
            count_query += " AND center_id = :center_id"
            params["center_id"] = center_id

        # Get total count
        count_result = db.session.execute(text(count_query), params).fetchone()
        total_count = count_result[0] if count_result else 0

        # Build main query
        select_query = f"SELECT * {base_query}"

        # Add sorting
        if sort_by and sort_by in [
            "check_in_time",
            "check_out_time",
            "transfer_time",
            "created_at",
        ]:
            order_direction = "DESC" if sort_order and sort_order.lower() == "desc" else "ASC"
            select_query += f" ORDER BY {sort_by} {order_direction}"
        else:
            select_query += " ORDER BY check_in_time DESC"

        # Add pagination
        offset = (page - 1) * limit
        select_query += " LIMIT :limit OFFSET :offset"
        params["limit"] = limit
        params["offset"] = offset

        # Execute query
        results = db.session.execute(text(select_query), params).fetchall()

        records = [
            cls._row_to_record(row) for row in results if cls._row_to_record(row)
        ]

        return {
            "records": records,
            "total_count": total_count,
            "page": page,
            "limit": limit,
            "total_pages": (total_count + limit - 1) // limit,
        }

    @classmethod
    def get_all_current_evacuees(
        cls,
        page: int = 1,
        limit: int = 10,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = "desc",
    ) -> Dict[str, Any]:
        """Get all currently checked-in attendees across all centers."""
        # Base query for current evacuees
        base_query = """
            FROM attendance_records 
            WHERE status = 'checked_in' 
            AND check_out_time IS NULL
        """
        count_query = """
            SELECT COUNT(*) as total_count 
            FROM attendance_records 
            WHERE status = 'checked_in' 
            AND check_out_time IS NULL
        """
        params = {}

        # Get total count
        count_result = db.session.execute(text(count_query), params).fetchone()
        total_count = count_result[0] if count_result else 0

        # Build main query
        select_query = f"SELECT * {base_query}"

        # Add sorting
        if sort_by and sort_by in [
            "check_in_time",
            "center_id",
            "created_at",
        ]:
            order_direction = "DESC" if sort_order and sort_order.lower() == "desc" else "ASC"
            select_query += f" ORDER BY {sort_by} {order_direction}"
        else:
            select_query += " ORDER BY check_in_time DESC"

        # Add pagination
        offset = (page - 1) * limit
        select_query += " LIMIT :limit OFFSET :offset"
        params["limit"] = limit
        params["offset"] = offset

        # Execute query
        results = db.session.execute(text(select_query), params).fetchall()

        records = [
            cls._row_to_record(row) for row in results if cls._row_to_record(row)
        ]

        return {
            "records": records,
            "total_count": total_count,
            "page": page,
            "limit": limit,
            "total_pages": (total_count + limit - 1) // limit,
        }
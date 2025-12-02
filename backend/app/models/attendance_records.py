"""Attendance Records model for EFAS."""

from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime
from sqlalchemy import text
from app.models import db
import logging

logger = logging.getLogger(__name__)


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
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 10,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = "desc",
    ) -> Dict[str, Any]:
        # Base query with joins to get related names, including source center for transfers
        base_query = """
            FROM attendance_records ar
            LEFT JOIN individuals i ON ar.individual_id = i.individual_id
            LEFT JOIN evacuation_centers ec ON ar.center_id = ec.center_id
            LEFT JOIN evacuation_centers ec_from ON ar.transfer_from_center_id = ec_from.center_id
            LEFT JOIN events e ON ar.event_id = e.event_id
            LEFT JOIN households h ON ar.household_id = h.household_id
            WHERE 1=1
        """
        
        params = {}

        # Add filters to base_query FIRST
        if center_id:
            base_query += " AND ar.center_id = :center_id"
            params["center_id"] = center_id

        if individual_id:
            base_query += " AND ar.individual_id = :individual_id"
            params["individual_id"] = individual_id

        if event_id:
            base_query += " AND ar.event_id = :event_id"
            params["event_id"] = event_id

        if household_id:
            base_query += " AND ar.household_id = :household_id"
            params["household_id"] = household_id

        if status:
            base_query += " AND ar.status = :status"
            params["status"] = status

        if date:
            base_query += " AND DATE(ar.check_in_time) = :date"
            params["date"] = date

        # Add search functionality to base_query FIRST
        if search:
            base_query += """ AND (
                i.first_name ILIKE :search 
                OR i.last_name ILIKE :search 
                OR CAST(ar.individual_id AS TEXT) = :search_exact
                OR CONCAT(i.first_name, ' ', i.last_name) ILIKE :search
                OR ar.status ILIKE :search
                OR ec.center_name ILIKE :search
                OR h.household_name ILIKE :search
                OR e.event_name ILIKE :search
            )"""
            params["search"] = f"%{search}%"
            params["search_exact"] = search

        # Build count_query AFTER all filters have been added to base_query
        count_query = f"SELECT COUNT(*) as total_count {base_query}"
        
        # Build select_query AFTER all filters have been added to base_query
        select_query = f"""
            SELECT 
                ar.record_id,
                ar.individual_id,
                ar.household_id,
                CONCAT(i.first_name, ' ', i.last_name) as individual_name,
                ec.center_name,
                e.event_name,
                h.household_name,
                ar.status,
                ar.check_in_time,
                ar.check_out_time,
                ar.transfer_time,
                ar.transfer_from_center_id,
                ec_from.center_name AS transfer_from_center_name,
                ar.notes
            {base_query}
        """

        # Get total count
        count_result = db.session.execute(text(count_query), params).fetchone()
        total_count = count_result[0] if count_result else 0

        # Add sorting
        if sort_by:
            # Map frontend sort keys to database columns
            sort_mapping = {
                "individual_name": "individual_name",
                "center_name": "ec.center_name", 
                "event_name": "e.event_name",
                "household_name": "h.household_name",
                "status": "ar.status",
                "check_in_time": "ar.check_in_time",
                "check_out_time": "ar.check_out_time",
                "transfer_time": "ar.transfer_time",
                "checkInTime": "ar.check_in_time",
                "checkOutTime": "ar.check_out_time", 
                "transferTime": "ar.transfer_time"
            }
            
            if sort_by in sort_mapping:
                order_direction = "DESC" if sort_order and sort_order.lower() == "desc" else "ASC"
                select_query += f" ORDER BY {sort_mapping[sort_by]} {order_direction}"
            else:
                select_query += " ORDER BY ar.record_id DESC"
        else:
            select_query += " ORDER BY ar.record_id DESC"
        
        # Add pagination
        offset = (page - 1) * limit
        select_query += " LIMIT :limit OFFSET :offset"
        params["limit"] = limit
        params["offset"] = offset

        # Execute query
        results = db.session.execute(text(select_query), params).fetchall()

        # Convert results to dictionary format for frontend
        records = []
        for row in results:
            record = {
                "record_id": row.record_id,
                "individual_id": row.individual_id,
                "household_id": row.household_id,
                "individual_name": row.individual_name or "Unknown",
                "center_name": row.center_name or "Unknown Center",
                "event_name": row.event_name or "Unknown Event",
                "household_name": row.household_name or "Unknown Household",
                "status": row.status,
                "check_in_time": row.check_in_time.isoformat() if row.check_in_time else "",
                "check_out_time": row.check_out_time.isoformat() if row.check_out_time else "",
                "transfer_time": row.transfer_time.isoformat() if row.transfer_time else "",
                "transfer_from_center_id": row.transfer_from_center_id,
                "transfer_from_center_name": row.transfer_from_center_name or "",
                "notes": row.notes or ""
            }
            records.append(record)

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

        # Check if individual is already checked in (only for check-ins)
        if data.get("status") == "checked_in":
            existing_checkin_query = text("""
                SELECT ar.record_id, ec.center_name, ar.check_in_time
                FROM attendance_records ar
                JOIN evacuation_centers ec ON ar.center_id = ec.center_id
                WHERE ar.individual_id = :individual_id 
                AND ar.status = 'checked_in'
                AND ar.check_out_time IS NULL
                LIMIT 1
            """)
            
            existing_record = db.session.execute(
                existing_checkin_query, 
                {"individual_id": data["individual_id"]}
            ).fetchone()
            
            if existing_record:
                raise ValueError(
                    f"Individual is already checked in at {existing_record.center_name} "
                    f"since {existing_record.check_in_time.strftime('%Y-%m-%d %H:%M')}. "
                    f"They must be checked out before checking in to a new center."
                )

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
            RETURNING *
            """
        )

        try:
            result = db.session.execute(query, params).fetchone()
            db.session.commit()
            
            if data.get("status") == "checked_in" and "event_id" in data:
                cls._update_event_occupancy(data["event_id"])
                
            return cls._row_to_record(result)
        except Exception as e:
            db.session.rollback()
            # Re-raise the exception to preserve the original error message
            if "Individual is already checked in" in str(e):
                raise e
            else:
                raise ValueError(f"Failed to create attendance record: {str(e)}")
    

    @classmethod
    def update(
        cls, record_id: int, update_data: Dict[str, Any]
    ) -> Optional["AttendanceRecord"]:
        """Update attendance record using raw SQL."""

        current_record = cls.get_by_id(record_id)
        if not current_record:
            return None
        
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

        updated_record = cls._row_to_record(result)
    
        # Update event occupancy if status changed to/from checked_in
        if updated_record and "status" in update_data:
            try:
                cls._update_event_occupancy(current_record.event_id)
            except Exception as e:
                logger.warning(f"Failed to update event occupancy for event {current_record.event_id}: {str(e)}")
        
        return updated_record


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
    ) -> Dict[str, Any]:
        """Check in an individual to a center, handling transfers automatically."""
        
        # Import db here to ensure it's available
        from app.models import db
        
        # Check for existing check-in
        existing_checkin_query = text("""
            SELECT ar.record_id, ar.center_id, ec.center_name
            FROM attendance_records ar
            JOIN evacuation_centers ec ON ar.center_id = ec.center_id
            WHERE ar.individual_id = :individual_id 
            AND ar.status = 'checked_in'
            AND ar.check_out_time IS NULL
            LIMIT 1
        """)
        
        existing_record = db.session.execute(
            existing_checkin_query, 
            {"individual_id": individual_id}
        ).fetchone()
        
        transfer_occurred = False
        previous_center_id = None
        previous_center_name = None
        
        # Handle transfer if individual is checked in elsewhere
        if existing_record and existing_record.center_id != center_id:
            transfer_occurred = True
            previous_center_id = existing_record.center_id
            previous_center_name = existing_record.center_name
            
            # Check out from current center
            check_out_query = text("""
                UPDATE attendance_records 
                SET status = 'checked_out', 
                    check_out_time = :check_out_time,
                    recorded_by_user_id = :recorded_by_user_id,
                    notes = COALESCE(:notes, notes) || ' (Auto-checked out due to transfer)',
                    updated_at = CURRENT_TIMESTAMP
                WHERE record_id = :record_id
            """)
            
            db.session.execute(
                check_out_query,
                {
                    "record_id": existing_record.record_id,
                    "check_out_time": check_in_time,
                    "recorded_by_user_id": recorded_by_user_id,
                    "notes": notes
                }
            )
            
            # Create transfer record
            transfer_data = {
                "individual_id": individual_id,
                "center_id": center_id,
                "event_id": event_id,
                "household_id": household_id,
                "status": "transferred",
                "transfer_from_center_id": previous_center_id,
                "transfer_to_center_id": center_id,
                "transfer_time": check_in_time,
                "recorded_by_user_id": recorded_by_user_id,
                "notes": f"Auto-transferred from {previous_center_name}. {notes or ''}"
            }
            
            cls.create(transfer_data)

        # Create the new check-in record
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

        record = cls.create(data)

        try:
            cls._update_event_occupancy(event_id)
        except Exception as e:
            logger.warning(f"Failed to update event occupancy for event {event_id}: {str(e)}")
        
        # Return dict format that service expects
        return {
            "record": record,
            "transfer_occurred": transfer_occurred,
            "previous_center_id": previous_center_id,
            "previous_center_name": previous_center_name
        }


    @classmethod
    def check_out_individual(
        cls,
        record_id: int,
        check_out_time: str,
        notes: Optional[str] = None
    ) -> Optional["AttendanceRecord"]:
        """Check out an individual from a center by creating a new record."""
        current_record = cls.get_by_id(record_id)
        if not current_record:
            return None

        # Create new check-out record (this is the only action needed)
        check_out_data = {
            "individual_id": current_record.individual_id,
            "center_id": current_record.center_id,
            "event_id": current_record.event_id,
            "household_id": current_record.household_id,
            "status": "checked_out",
            "check_in_time": current_record.check_in_time,  # Keep original check-in time
            "check_out_time": check_out_time,
            "recorded_by_user_id": current_record.recorded_by_user_id,
            "notes": f"Checked out. {notes or ''}"
        }

        new_record = cls.create(check_out_data)

        if new_record:
            try:
                cls._update_event_occupancy(current_record.event_id)
            except Exception as e:
                logger.warning(f"Failed to update event occupancy for event {current_record.event_id}: {str(e)}")
        
        return new_record


    @classmethod
    def check_out_multiple_individuals(
        cls,
        check_out_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Check out multiple individuals in a batch operation."""
        from app.models import db
        
        successful_checkouts = []
        failed_checkouts = []
        
        for i, data in enumerate(check_out_data):
            try:
                record_id = data["record_id"]
                check_out_time = data.get("check_out_time")
                notes = data.get("notes")
                
                # Get current record
                current_record = cls.get_by_id(record_id)
                if not current_record:
                    failed_checkouts.append({
                        "index": i,
                        "record_id": record_id,
                        "error": "Attendance record not found"
                    })
                    continue
                
                # Check if individual is currently checked in
                if current_record.status != "checked_in" or current_record.check_out_time is not None:
                    failed_checkouts.append({
                        "index": i,
                        "record_id": record_id,
                        "error": "Individual is not currently checked in"
                    })
                    continue
                
                # Create new check-out record
                new_checkout_data = {
                    "individual_id": current_record.individual_id,
                    "center_id": current_record.center_id,
                    "event_id": current_record.event_id,
                    "household_id": current_record.household_id,
                    "status": "checked_out",
                    "check_in_time": current_record.check_in_time,
                    "check_out_time": check_out_time or datetime.now().isoformat(),
                    "recorded_by_user_id": current_record.recorded_by_user_id,
                    "notes": f"Checked out. {notes or ''}"
                }
                
                new_record = cls.create(new_checkout_data)
                
                if new_record:
                    successful_checkouts.append({
                        "record_id": new_record.record_id,
                        "individual_id": new_record.individual_id,
                        "original_record_id": record_id
                    })
                    
                    # Update event occupancy
                    try:
                        cls._update_event_occupancy(current_record.event_id)
                    except Exception as e:
                        logger.warning(f"Failed to update event occupancy for event {current_record.event_id}: {str(e)}")
                else:
                    failed_checkouts.append({
                        "index": i,
                        "record_id": record_id,
                        "error": "Failed to create check-out record"
                    })
                    
            except Exception as error:
                failed_checkouts.append({
                    "index": i,
                    "record_id": data.get("record_id"),
                    "error": str(error)
                })
                logger.error(f"Failed to check out record at index {i}: {str(error)}")
        
        return {
            "successful_checkouts": successful_checkouts,
            "failed_checkouts": failed_checkouts
        }


    @classmethod
    def transfer_individual(
        cls,
        record_id: int,
        transfer_to_center_id: int,
        transfer_time: str,
        recorded_by_user_id: int,
        notes: Optional[str] = None
    ) -> Optional["AttendanceRecord"]:
        """
        Transfer an individual to a different center by:
        - Checking them out from the current center
        - Creating a transfer record that represents the move

        NOTE: This does NOT automatically check the individual in to the destination center.
        A separate, explicit check-in is required once their arrival is confirmed.
        """
        # Get current record
        current_record = cls.get_by_id(record_id)
        if not current_record:
            return None

        # Check if transferring to same center
        if current_record.center_id == transfer_to_center_id:
            raise ValueError("Cannot transfer to the same center")

        # Check if individual is currently checked in
        if current_record.status != "checked_in" or current_record.check_out_time is not None:
            raise ValueError("Individual is not currently checked in")

        # Check out from current center first
        check_out_data = {
            "status": "checked_out",
            "check_out_time": transfer_time,
            "notes": f"Checked out for transfer to center {transfer_to_center_id}. {notes or ''}"
        }
        
        cls.update(record_id, check_out_data)

        # Create new transfer record
        transfer_data = {
            "individual_id": current_record.individual_id,
            "center_id": transfer_to_center_id,  # Destination center
            "event_id": current_record.event_id,
            "household_id": current_record.household_id,
            "status": "transferred",
            "transfer_from_center_id": current_record.center_id,  # Source center
            "transfer_to_center_id": transfer_to_center_id,  # Destination center
            "transfer_time": transfer_time,
            "recorded_by_user_id": recorded_by_user_id,
            "notes": f"Transferred from center {current_record.center_id}. {notes or ''}"
        }

        # Create the transfer record
        transfer_record = cls.create(transfer_data)

        try:
            # Update events associated with the old center
            cls._update_associated_events_occupancy(current_record.center_id)
            # Update events associated with the new center  
            cls._update_associated_events_occupancy(transfer_to_center_id)
        except Exception as e:
            logger.warning(f"Failed to update event occupancies during transfer: {str(e)}")

        return transfer_record


    @classmethod
    def get_current_evacuees_by_center(
        cls, 
        center_id: int,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 10,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = "desc"
    ) -> Dict[str, Any]:
        """Get all currently checked-in individuals at a center with pagination and search."""
        
        # Base query with joins to get related names
        base_query = """
            FROM attendance_records ar
            LEFT JOIN individuals i ON ar.individual_id = i.individual_id
            LEFT JOIN evacuation_centers ec ON ar.center_id = ec.center_id
            LEFT JOIN events e ON ar.event_id = e.event_id
            LEFT JOIN households h ON ar.household_id = h.household_id
            WHERE ar.center_id = :center_id 
            AND ar.status = 'checked_in' 
            AND ar.check_out_time IS NULL
        """
        
        params = {"center_id": center_id}

        # Add search functionality
        if search:
            base_query += """ AND (
                i.first_name ILIKE :search 
                OR i.last_name ILIKE :search 
                OR CAST(ar.individual_id AS TEXT) = :search_exact
                OR CONCAT(i.first_name, ' ', i.last_name) ILIKE :search
                OR h.household_name ILIKE :search
                OR e.event_name ILIKE :search
            )"""
            params["search"] = f"%{search}%"
            params["search_exact"] = search

        # Build count_query AFTER all filters have been added to base_query
        count_query = f"SELECT COUNT(*) as total_count {base_query}"
        
        # Build select_query AFTER all filters have been added to base_query
        select_query = f"""
            SELECT 
                ar.record_id,
                CONCAT(i.first_name, ' ', i.last_name) as individual_name,
                i.gender,
                ec.center_name,
                e.event_name,
                h.household_name,
                ar.status,
                ar.check_in_time,
                ar.check_out_time,
                ar.transfer_time,
                ar.notes
            {base_query}
        """

        # Get total count
        count_result = db.session.execute(text(count_query), params).fetchone()
        total_count = count_result[0] if count_result else 0

        # Add sorting
        if sort_by:
            # Map frontend sort keys to database columns
            sort_mapping = {
                "individual_name": "individual_name",
                "center_name": "ec.center_name", 
                "event_name": "e.event_name",
                "household_name": "h.household_name",
                "status": "ar.status",
                "check_in_time": "ar.check_in_time",
                "check_out_time": "ar.check_out_time",
                "transfer_time": "ar.transfer_time",
                "checkInTime": "ar.check_in_time",
                "checkOutTime": "ar.check_out_time", 
                "transferTime": "ar.transfer_time"
            }
            
            if sort_by in sort_mapping:
                order_direction = "DESC" if sort_order and sort_order.lower() == "desc" else "ASC"
                select_query += f" ORDER BY {sort_mapping[sort_by]} {order_direction}"
            else:
                select_query += " ORDER BY ar.check_in_time DESC"
        else:
            select_query += " ORDER BY ar.check_in_time DESC"
        
        # Add pagination
        offset = (page - 1) * limit
        select_query += " LIMIT :limit OFFSET :offset"
        params["limit"] = limit
        params["offset"] = offset

        # Execute query
        results = db.session.execute(text(select_query), params).fetchall()

        # Convert results to dictionary format for frontend
        records = []
        for row in results:
            record = {
                "record_id": row.record_id,
                "individual_name": row.individual_name or "Unknown",
                "gender": row.gender or "Unknown",
                "center_name": row.center_name or "Unknown Center",
                "event_name": row.event_name or "Unknown Event", 
                "household_name": row.household_name or "Unknown Household",
                "status": row.status,
                "check_in_time": row.check_in_time.isoformat() if row.check_in_time else "",
                "check_out_time": row.check_out_time.isoformat() if row.check_out_time else "",
                "transfer_time": row.transfer_time.isoformat() if row.transfer_time else "",
                "notes": row.notes or ""
            }
            records.append(record)

        return {
            "records": records,
            "total_count": total_count,
            "page": page,
            "limit": limit,
            "total_pages": (total_count + limit - 1) // limit,
        }


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
    

    @classmethod
    def _update_event_occupancy(cls, event_id: int) -> None:
        """Update event's max_occupancy based on current attendance records."""
        from .event import Event
        
        # Calculate current occupancy for this event
        current_occupancy_query = text("""
            SELECT COUNT(*) as current_occupancy
            FROM attendance_records 
            WHERE event_id = :event_id 
            AND status = 'checked_in' 
            AND check_out_time IS NULL
        """)
        
        current_occupancy_result = db.session.execute(
            current_occupancy_query, 
            {"event_id": event_id}
        ).fetchone()
        
        current_occupancy = current_occupancy_result[0] if current_occupancy_result else 0
        
        # Update event occupancy using the existing Event method
        Event.update_event_occupancy(event_id, current_occupancy)


    @classmethod
    def _update_associated_events_occupancy(cls, center_id: int) -> None:
        """Update occupancy for all events associated with a center."""
        # Get all active events associated with this center
        events_query = text("""
            SELECT DISTINCT e.event_id 
            FROM events e
            JOIN event_centers ec ON e.event_id = ec.event_id
            WHERE ec.center_id = :center_id AND e.status = 'active'
        """)
        
        events_result = db.session.execute(
            events_query,
            {"center_id": center_id}
        ).fetchall()
        
        # Update occupancy for each event
        for row in events_result:
            event_id = row[0]
            cls._update_event_occupancy(event_id)
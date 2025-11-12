"""User model for EFAS authentication and user management."""

from typing import Any, Dict, List, Optional

from sqlalchemy import text
from werkzeug.security import generate_password_hash

from app.models import db
from app.schemas.user import UserResponseSchema


class User(db.Model):
    """User model for authentication and authorization."""

    __tablename__ = "users"

    user_id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(
        db.String(20), nullable=False
    )  # super_admin, city_admin, center_admin, volunteer
    center_id = db.Column(
        db.Integer, db.ForeignKey("evacuation_centers.center_id"), nullable=True
    )  # Fixed table name to match evacuation_centers
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())

    def to_dict(self):
        """Convert user to dictionary for JSON serialization."""
        schema = UserResponseSchema()
        return schema.dump(self)

    def to_schema(self):
        """Convert user to Marshmallow response schema."""
        schema = UserResponseSchema()
        return schema.dump(self)

    def __repr__(self):
        return (
            f"<User(user_id={self.user_id}, email='{self.email}', role='{self.role}')>"
        )

    @classmethod
    def _row_to_user(cls, row) -> Optional["User"]:
        """Convert SQLAlchemy Row to User object."""
        if not row:
            return None

        try:
            row_dict = row._asdict()
        except AttributeError:
            row_dict = dict(row)

        # Remove center_name from the row_dict before creating User object
        # since it's not a database column in the users table
        center_name = row_dict.pop("center_name", None)

        user = cls(**row_dict)

        # Add center_name as an attribute for serialization
        if center_name is not None:
            user.center_name = center_name

        return user

    @classmethod
    def get_by_email(cls, email: str) -> Optional["User"]:
        """Get user by email address using raw SQL."""
        result = db.session.execute(
            text("SELECT * FROM users WHERE email = :email"),
            {"email": email},
        ).fetchone()

        return cls._row_to_user(result)

    @classmethod
    def get_active_by_email(cls, email: str) -> Optional["User"]:
        """Get active user by email address using raw SQL."""
        result = db.session.execute(
            text("SELECT * FROM users WHERE email = :email AND is_active = TRUE"),
            {"email": email},
        ).fetchone()
        return cls._row_to_user(result)

    @classmethod
    def get_by_id(cls, user_id: int) -> Optional["User"]:
        """Get user by ID using raw SQL."""
        result = db.session.execute(
            text("SELECT * FROM users WHERE user_id = :user_id"),
            {"user_id": user_id},
        ).fetchone()

        return cls._row_to_user(result)

    @classmethod
    def get_by_role(cls, role: str) -> List["User"]:
        """Get all users with specified role using raw SQL."""
        results = db.session.execute(
            text("SELECT * FROM users WHERE role = :role AND is_active = TRUE"),
            {"role": role},
        ).fetchall()

        return [cls._row_to_user(row) for row in results if cls._row_to_user(row)]

    @classmethod
    def create_from_schema(cls, register_data: Dict[str, Any]) -> "User":
        """Create a new user from registration data using raw SQL."""
        password_hash = generate_password_hash(register_data["password"])

        result = db.session.execute(
            text(
                """  
            INSERT INTO users (email, password_hash, role, center_id, is_active) 
            VALUES (:email, :password_hash, :role, :center_id, TRUE)
            RETURNING user_id, created_at, updated_at
            """
            ),
            {
                "email": register_data["email"],
                "password_hash": password_hash,
                "role": register_data["role"],
                "center_id": register_data.get("center_id"),
            },
        ).fetchone()

        db.session.commit()

        result_dict = result._asdict()

        user = cls(
            user_id=result_dict["user_id"],
            email=register_data["email"],
            password_hash=password_hash,
            role=register_data["role"],
            center_id=register_data.get("center_id"),
            created_at=result_dict["created_at"],
            updated_at=result_dict["updated_at"],
        )
        return user

    @classmethod
    def create(cls, data: Dict[str, Any]) -> "User":
        """Create a new user using raw SQL (for user management)."""
        password_hash = generate_password_hash(data["password"])

        result = db.session.execute(
            text(
                """  
            INSERT INTO users (email, password_hash, role, center_id, is_active) 
            VALUES (:email, :password_hash, :role, :center_id, TRUE)
            RETURNING user_id, created_at, updated_at
            """
            ),
            {
                "email": data["email"],
                "password_hash": password_hash,
                "role": data["role"],
                "center_id": data.get("center_id"),
            },
        ).fetchone()

        db.session.commit()

        result_dict = result._asdict()

        user = cls(
            user_id=result_dict["user_id"],
            email=data["email"],
            password_hash=password_hash,
            role=data["role"],
            center_id=data.get("center_id"),
            created_at=result_dict["created_at"],
            updated_at=result_dict["updated_at"],
        )
        return user

    @classmethod
    def deactivate_user(cls, user_id: int) -> bool:
        """Deactivate a user account using raw SQL."""
        result = db.session.execute(
            text(
                """  
            UPDATE users 
            SET is_active = FALSE, updated_at = NOW() 
            WHERE user_id = :user_id 
            RETURNING user_id
            """
            ),
            {"user_id": user_id},
        ).fetchone()

        db.session.commit()
        return result is not None

    @classmethod
    def update_user(cls, user_id: int, update_data: Dict[str, Any]) -> Optional["User"]:
        """Update user information using raw SQL."""
        # Build dynamic UPDATE query
        set_clauses = []
        params = {"user_id": user_id}

        for field, value in update_data.items():
            if value is not None and field != "user_id":  # Prevent ID modification
                set_clauses.append(f"{field} = :{field}")
                params[field] = value

        if not set_clauses:
            return None

        # Add updated_at timestamp
        set_clauses.append("updated_at = NOW()")

        query = text(
            f"""  
            UPDATE users 
            SET {', '.join(set_clauses)}
            WHERE user_id = :user_id
            RETURNING *
            """
        )

        result = db.session.execute(query, params).fetchone()
        db.session.commit()

        return cls._row_to_user(result)

    @classmethod
    def get_all(
        cls,
        search: Optional[str] = None,
        role: Optional[str] = None,
        status: Optional[str] = None,
        page: int = 1,
        limit: int = 10,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = "asc",
        center_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Get all users with pagination, search, and sorting."""
        # Base query with join to get center name
        base_query = """
            FROM users u 
            LEFT JOIN evacuation_centers ec ON u.center_id = ec.center_id 
            WHERE 1=1
        """
        count_query = """
            SELECT COUNT(*) as total_count 
            FROM users u 
            LEFT JOIN evacuation_centers ec ON u.center_id = ec.center_id 
            WHERE 1=1
        """
        params = {}

        # Add search filter
        if search:
            base_query += " AND (u.email ILIKE :search)"
            count_query += " AND (u.email ILIKE :search)"
            params["search"] = f"%{search}%"

        # Add role filter
        if role and role != "all":
            base_query += " AND u.role = :role"
            count_query += " AND u.role = :role"
            params["role"] = role

        # Add status filter
        if status and status != "all":
            if status == "active":
                base_query += " AND u.is_active = TRUE"
                count_query += " AND u.is_active = TRUE"
            elif status == "inactive":
                base_query += " AND u.is_active = FALSE"
                count_query += " AND u.is_active = FALSE"

        # Add center_id filter
        if center_id is not None:
            base_query += " AND u.center_id = :center_id"
            count_query += " AND u.center_id = :center_id"
            params["center_id"] = center_id

        # Get total count
        count_result = db.session.execute(text(count_query), params).fetchone()
        total_count = count_result[0] if count_result else 0

        # Build main query - select only user fields but include center_name for later use
        select_query = f"""
            SELECT 
                u.user_id,
                u.email,
                u.password_hash,
                u.role,
                u.center_id,
                u.is_active,
                u.created_at,
                u.updated_at,
                ec.center_name
            {base_query}
        """

        # Add sorting
        if sort_by and sort_by in ["email", "role", "is_active", "created_at"]:
            order_direction = (
                "DESC" if sort_order and sort_order.lower() == "desc" else "ASC"
            )
            select_query += f" ORDER BY u.{sort_by} {order_direction}"
        else:
            select_query += " ORDER BY u.created_at DESC"

        # Add pagination
        offset = (page - 1) * limit
        select_query += " LIMIT :limit OFFSET :offset"
        params["limit"] = limit
        params["offset"] = offset

        # Execute query
        results = db.session.execute(text(select_query), params).fetchall()

        # Process results - create User objects and store center_name separately
        users_with_center = []
        for row in results:
            try:
                row_dict = row._asdict()
            except AttributeError:
                row_dict = dict(row)

            # Extract center_name before creating User object
            center_name = row_dict.pop("center_name", None)

            # Create User object with only the fields that match the model
            user = cls(**row_dict)

            # Store center_name as an attribute for serialization
            user.center_name = center_name

            users_with_center.append(user)

        return {
            "users": users_with_center,
            "total_count": total_count,
            "page": page,
            "limit": limit,
            "total_pages": (total_count + limit - 1) // limit,
        }

    @classmethod
    def get_all_active_users(cls) -> List["User"]:
        """Get all active users using raw SQL."""
        results = db.session.execute(
            text("SELECT * FROM users WHERE is_active = TRUE ORDER BY created_at DESC")
        ).fetchall()

        return [cls(**dict(row)) for row in results]

    @classmethod
    def get_users_by_center(cls, center_id: int) -> List["User"]:
        """Get all users associated with a center using raw SQL."""
        results = db.session.execute(
            text(
                "SELECT * FROM users WHERE center_id = :center_id AND is_active = TRUE"
            ),
            {"center_id": center_id},
        ).fetchall()

        return [cls(**dict(row)) for row in results]

    @classmethod
    def delete(cls, user_id: int) -> bool:
        """Delete a user using raw SQL."""
        result = db.session.execute(
            text(
                """  
                DELETE FROM users 
                WHERE user_id = :user_id 
                RETURNING user_id
                """
            ),
            {"user_id": user_id},
        ).fetchone()

        db.session.commit()
        return result is not None

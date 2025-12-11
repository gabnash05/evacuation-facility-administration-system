import logging
from typing import Any, Dict, List, Optional

from flask_jwt_extended import create_access_token
from werkzeug.security import check_password_hash, generate_password_hash

from app.models.user import User
from app.schemas.user import UserCreateSchema, UserUpdateSchema, UserRegisterSchema

# Configure logger for this module
logger = logging.getLogger(__name__)

# Initialize schemas for validation
create_schema = UserCreateSchema()
update_schema = UserUpdateSchema()
register_schema = UserRegisterSchema()


# ========================
# AUTHENTICATION FUNCTIONS
# ========================


def authenticate_user(email: str, password: str) -> Dict[str, Any]:
    """
    Authenticate a user with email and password.

    Args:
        email: User email
        password: User password

    Returns:
        Dictionary with authentication result
    """
    try:
        # Find user by email using model method
        user = User.get_active_by_email(email)

        if not user:
            logger.warning("Authentication failed: User not found for email")
            return {"success": False, "message": "Invalid email or password"}

        # Verify password
        if not check_password_hash(user.password_hash, password):
            logger.warning("Authentication failed: Invalid password for email")
            return {"success": False, "message": "Invalid email or password"}

        # Create JWT token
        access_token = create_access_token(identity=str(user.user_id))

        logger.info(
            "Authentication successful for user %s with role %s",
            user.user_id,
            user.role,
        )

        return {
            "success": True,
            "access_token": access_token,
            "role": user.role,
            "user_id": user.user_id,
        }

    except Exception as error:
        logger.error("Error during user authentication: %s", str(error))
        return {"success": False, "message": "Authentication failed"}


def register_user(
    email: str, password: str, role: str, center_id: Optional[int], current_user: User
) -> Dict[str, Any]:
    """
    Register a new user in the system.

    Args:
        email: User email
        password: User password
        role: User role
        center_id: Optional center ID for center-specific roles
        current_user: The user performing the registration

    Returns:
        Dictionary with registration result
    """
    try:
        # Check if email already exists using model method
        existing_user = User.get_by_email(email)
        if existing_user:
            return {"success": False, "message": "Email already registered"}

        # Validate role against schema constraints
        valid_roles = ["super_admin", "city_admin", "center_admin", "volunteer"]
        if role not in valid_roles:
            return {
                "success": False,
                "message": f"Invalid role. Must be one of: {', '.join(valid_roles)}",
            }

        # Permission checks based on current user's role
        if current_user.role == "city_admin":
            # City admin can only create center_admin and volunteer roles
            if role == "city_admin":
                return {
                    "success": False,
                    "message": "Insufficient permissions to create city_admin role",
                }
            # For center_admin, center_id is required
            if role == "center_admin" and not center_id:
                return {
                    "success": False,
                    "message": "center_id is required for center_admin role",
                }

        # For center_admin and volunteer roles, center_id should be provided
        if role in ["center_admin", "volunteer"] and not center_id:
            return {
                "success": False,
                "message": f"center_id is required for {role} role",
            }

        # For city_admin role, center_id should be null
        if role == "city_admin" and center_id is not None:
            return {
                "success": False,
                "message": "center_id must be null for city_admin role",
            }

        # Create new user using the model's create method
        register_data = {
            "email": email,
            "password": password,
            "role": role,
            "center_id": center_id,
        }

        new_user = User.create_from_schema(register_data)

        logger.info("User registered successfully: %s with role %s", email, role)

        return {
            "success": True,
            "user": new_user,
            "message": "User created successfully",
        }

    except Exception as error:
        logger.error("Error during user registration: %s", str(error))
        return {"success": False, "message": "Registration failed"}


def get_current_user(user_id: int) -> Optional[User]:
    """
    Get current user by ID.

    Args:
        user_id: User ID from JWT token

    Returns:
        User object or None if not found
    """
    try:
        return User.get_by_id(user_id)
    except Exception as error:
        logger.error("Error fetching current user with ID %s: %s", user_id, str(error))
        return None


def deactivate_user(user_id: int, current_user: User) -> Dict[str, Any]:
    """
    Deactivate a user account.

    Args:
        user_id: ID of user to deactivate
        current_user: The user performing the action

    Returns:
        Dictionary with operation result
    """
    try:
        # Only city_admin can deactivate users
        if current_user.role != "city_admin":
            return {"success": False, "message": "Insufficient permissions"}

        # Get user to check permissions using model method
        user_to_deactivate = User.get_by_id(user_id)

        if not user_to_deactivate:
            return {"success": False, "message": "User not found"}

        # Prevent self-deactivation
        if user_to_deactivate.user_id == current_user.user_id:
            return {"success": False, "message": "Cannot deactivate your own account"}

        # Permission hierarchy check
        if current_user.role == "city_admin":
            # City admin can only deactivate center_admin and volunteer
            if user_to_deactivate.role == "city_admin":
                return {
                    "success": False,
                    "message": "Insufficient permissions to deactivate this user",
                }

        # Deactivate user using model method
        success = User.deactivate_user(user_id)

        if success:
            logger.info("User %s deactivated by user %s", user_id, current_user.user_id)
            return {"success": True, "message": "User deactivated successfully"}
        else:
            return {"success": False, "message": "Failed to deactivate user"}

    except Exception as error:
        logger.error("Error deactivating user %s: %s", user_id, str(error))
        return {"success": False, "message": "Failed to deactivate user"}


def update_user_profile(user_id: int, update_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update user profile information.

    Args:
        user_id: ID of user to update
        update_data: Dictionary of fields to update

    Returns:
        Dictionary with operation result
    """
    try:
        updated_user = User.update_user(user_id, update_data)

        if updated_user:
            return {
                "success": True,
                "message": "User updated successfully",
                "user": updated_user,
            }
        else:
            return {"success": False, "message": "User not found or update failed"}

    except Exception as error:
        logger.error("Error updating user %s: %s", user_id, str(error))
        return {"success": False, "message": "Failed to update user"}


# ========================
# USER MANAGEMENT FUNCTIONS
# ========================


def get_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = "asc",
    center_id: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Get all users with filtering, pagination, and sorting.

    Args:
        search: Search term for email
        role: Filter by role
        status: Filter by status (active/inactive)
        page: Page number for pagination
        limit: Number of items per page
        sort_by: Field to sort by
        sort_order: Sort direction (asc/desc)
        center_id: Filter by center ID

    Returns:
        Dictionary with users and pagination info
    """
    try:
        result = User.get_all(
            search=search,
            role=role,
            status=status,
            page=page,
            limit=limit,
            sort_by=sort_by,
            sort_order=sort_order,
            center_id=center_id,
        )

        users_data = [user.to_schema() for user in result["users"]]

        return {
            "success": True,
            "data": {
                "results": users_data,
                "pagination": {
                    "current_page": result["page"],
                    "total_pages": result["total_pages"],
                    "total_items": result["total_count"],
                    "limit": result["limit"],
                },
            },
        }

    except Exception as error:
        logger.error("Error fetching users: %s", str(error))
        return {"success": False, "message": "Failed to fetch users"}


def get_user_by_id(user_id: int) -> Dict[str, Any]:
    """
    Get a specific user by ID.

    Args:
        user_id: User ID

    Returns:
        Dictionary with user data or error message
    """
    try:
        user = User.get_by_id(user_id)

        if not user:
            return {"success": False, "message": "User not found"}

        return {"success": True, "data": user.to_schema()}

    except Exception as error:
        logger.error("Error fetching user %s: %s", user_id, str(error))
        return {"success": False, "message": "Failed to fetch user"}


def create_user(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a new user.

    Args:
        data: User data

    Returns:
        Dictionary with creation result
    """
    try:
        # Validate input data
        try:
            valid_data = create_schema.load(data)
        except Exception as validation_error:
            return {
                "success": False,
                "message": f"Validation error: {str(validation_error)}",
            }

        # Check if email already exists
        existing_user = User.get_by_email(valid_data["email"])
        if existing_user:
            return {"success": False, "message": "Email already registered"}

        # Create new user
        user = User.create(valid_data)

        logger.info("User created: %s", user.email)

        return {
            "success": True,
            "message": "User created successfully",
            "data": user.to_schema(),
        }

    except Exception as error:
        logger.error("Error creating user: %s", str(error))
        return {"success": False, "message": "Failed to create user"}


def update_user(user_id: int, update_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update a user.

    Args:
        user_id: User ID
        update_data: Fields to update

    Returns:
        Dictionary with update result
    """
    try:
        # Validate input data
        try:
            valid_data = update_schema.load(update_data)
        except Exception as validation_error:
            return {
                "success": False,
                "message": f"Validation error: {str(validation_error)}",
            }

        # Check if user exists
        existing_user = User.get_by_id(user_id)
        if not existing_user:
            return {"success": False, "message": "User not found"}

        # Check for duplicate email if email is being updated
        if "email" in valid_data and valid_data["email"]:
            existing_user_with_email = User.get_by_email(valid_data["email"])
            if existing_user_with_email and existing_user_with_email.user_id != user_id:
                return {"success": False, "message": "Email already registered"}

        # Handle password update safely
        if "password" in valid_data:
            if valid_data["password"]:
                valid_data["password_hash"] = generate_password_hash(valid_data["password"])
            

            del valid_data["password"]

        # Update user
        updated_user = User.update_user(user_id, valid_data)

        if not updated_user:
            return {"success": False, "message": "Failed to update user"}

        logger.info("User updated: %s", user_id)

        return {
            "success": True,
            "message": "User updated successfully",
            "data": updated_user.to_schema(),
        }

    except Exception as error:
        logger.error("Error updating user %s: %s", user_id, str(error))
        return {"success": False, "message": "Failed to update user"}


def delete_user(user_id: int) -> Dict[str, Any]:
    """
    Delete a user.

    Args:
        user_id: User ID

    Returns:
        Dictionary with deletion result
    """
    try:
        # Check if user exists
        existing_user = User.get_by_id(user_id)
        if not existing_user:
            return {"success": False, "message": "User not found"}

        # Delete user
        success = User.delete(user_id)

        if not success:
            return {"success": False, "message": "Failed to delete user"}

        logger.info("User deleted: %s", user_id)

        return {"success": True, "message": "User deleted successfully"}

    except Exception as error:
        logger.error("Error deleting user %s: %s", user_id, str(error))
        return {"success": False, "message": "Failed to delete user"}


def deactivate_user_service(user_id: int) -> Dict[str, Any]:
    """
    Deactivate a user (for user management routes).

    Args:
        user_id: User ID

    Returns:
        Dictionary with deactivation result
    """
    try:
        # Check if user exists
        existing_user = User.get_by_id(user_id)
        if not existing_user:
            return {"success": False, "message": "User not found"}

        # Deactivate user
        updated_user = User.update_user(user_id, {"is_active": False})

        if not updated_user:
            return {"success": False, "message": "Failed to deactivate user"}

        logger.info("User deactivated: %s", user_id)

        return {
            "success": True,
            "message": "User deactivated successfully",
            "data": updated_user.to_schema(),
        }

    except Exception as error:
        logger.error("Error deactivating user %s: %s", user_id, str(error))
        return {"success": False, "message": "Failed to deactivate user"}


def reactivate_user_service(user_id: int) -> Dict[str, Any]:
    """
    Reactivate a user (for user management routes).

    Args:
        user_id: User ID

    Returns:
        Dictionary with reactivation result
    """
    try:
        # Check if user exists
        existing_user = User.get_by_id(user_id)
        if not existing_user:
            return {"success": False, "message": "User not found"}

        # Reactivate user
        updated_user = User.update_user(user_id, {"is_active": True})

        if not updated_user:
            return {"success": False, "message": "Failed to reactivate user"}

        logger.info("User reactivated: %s", user_id)

        return {
            "success": True,
            "message": "User reactivated successfully",
            "data": updated_user.to_schema(),
        }

    except Exception as error:
        logger.error("Error reactivating user %s: %s", user_id, str(error))
        return {"success": False, "message": "Failed to reactivate user"}

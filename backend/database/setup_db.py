"""Database setup script using raw SQL."""

import getpass
import logging
import os
import re
from typing import Optional

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from werkzeug.security import generate_password_hash

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
DEFAULT_DB_NAME = "efas_db"


def get_database_connection(database_name: Optional[str] = None):
    """Get database connection."""
    try:
        # Get connection parameters from environment
        db_host = os.environ.get("DB_HOST", "localhost")
        db_port = os.environ.get("DB_PORT", "5432")
        db_user = os.environ.get("DB_USER", "postgres")
        db_password = os.environ.get("DB_PASSWORD", "password")

        if database_name:
            db_name = database_name
        else:
            db_name = os.environ.get("DB_NAME", DEFAULT_DB_NAME)

        conn = psycopg2.connect(
            host=db_host,
            port=db_port,
            user=db_user,
            password=db_password,
            database=db_name,
        )
        return conn
    except Exception as e:
        logger.error(f"[X] Failed to connect to database: {e}")
        raise


def create_database():
    """Create database if it doesn't exist."""
    db_name = os.environ.get("DB_NAME", DEFAULT_DB_NAME)

    try:
        # Connect to default postgres database to create our database
        conn = get_database_connection("postgres")
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()

        # Check if database exists
        cursor.execute(
            "SELECT 1 FROM pg_catalog.pg_database WHERE datname = %s", (db_name,)
        )
        exists = cursor.fetchone()

        if not exists:
            cursor.execute(f"CREATE DATABASE {db_name}")
            logger.info(f"[✓] Database '{db_name}' created successfully!")
        else:
            logger.info(f"[✓] Database '{db_name}' already exists!")

        cursor.close()
        conn.close()

    except Exception as e:
        logger.error(f"[X] Failed to create database: {e}")
        raise


def setup_tables():
    """Set up all tables using raw SQL script."""
    try:
        # Read SQL script
        sql_file_path = os.path.join(
            os.path.dirname(__file__), "sql", "create_tables.sql"
        )

        # Check if SQL file exists
        if not os.path.exists(sql_file_path):
            logger.error(f"[X] SQL file not found: {sql_file_path}")
            raise FileNotFoundError(f"SQL file not found: {sql_file_path}")

        with open(sql_file_path, "r", encoding="utf-8") as file:
            sql_script = file.read()

        # Check if SQL script is empty
        if not sql_script.strip():
            logger.error("[X] SQL script is empty!")
            raise ValueError("SQL script is empty")

        # Execute SQL script
        conn = get_database_connection()
        cursor = conn.cursor()

        try:
            cursor.execute(sql_script)
            conn.commit()
            logger.info("[✓] SQL script executed successfully!")
        except psycopg2.Error as e:
            # If objects already exist, that's fine - we just need to verify they're there
            if e.pgcode == "42P07":  # duplicate_table
                logger.warning(
                    f"[!] Some database objects already exist (normal for re-runs)"
                )
                conn.rollback()
                # Don't raise the error - proceed to verification
            else:
                logger.error(f"[X] Failed to execute SQL script: {e}")
                conn.rollback()
                raise
        cursor.close()
        conn.close()

        logger.info("[✓] Tables setup completed!")

    except Exception as e:
        logger.error(f"[X] Failed to setup tables: {e}")
        raise


def is_valid_email(email):
    """Basic email validation."""
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return re.match(pattern, email) is not None


def create_super_admin():
    """Create super admin user with prompted email and password."""
    try:
        print("\n=== Super Admin Setup ===")

        # Prompt for email
        while True:
            email = input("Enter email for super admin: ").strip()
            if not email:
                print("Email cannot be empty. Please try again.")
                continue
            if not is_valid_email(email):
                print("Invalid email format. Please enter a valid email address.")
                continue
            break

        # Prompt for password
        while True:
            password = getpass.getpass("Enter password: ")
            confirm_password = getpass.getpass("Confirm password: ")

            if not password:
                print("Password cannot be empty. Please try again.")
                continue

            if password != confirm_password:
                print("Passwords do not match. Please try again.")
                continue

            if len(password) < 6:
                print("Password must be at least 6 characters long. Please try again.")
                continue

            break

        password_hash = generate_password_hash(password)

        # Read SQL script
        sql_file_path = os.path.join(
            os.path.dirname(__file__), "sql", "create_user.sql"
        )

        if not os.path.exists(sql_file_path):
            logger.error(f"[X] SQL file not found: {sql_file_path}")
            return False

        with open(sql_file_path, "r", encoding="utf-8") as file:
            sql_script = file.read()

        # Execute SQL script with email and password parameters
        conn = get_database_connection()
        cursor = conn.cursor()

        try:
            # Replace parameter placeholders with actual values
            # Escape single quotes for SQL
            email_escaped = email.replace("'", "''")
            password_hash_escaped = password_hash.replace("'", "''")

            sql_script = sql_script.replace("&1", email_escaped)
            sql_script = sql_script.replace("&2", password_hash_escaped)

            cursor.execute(sql_script)
            conn.commit()
            logger.info("[✓] Super admin user created/updated successfully!")
            logger.info(f"[✓] Email: {email}")
            logger.info(f"[✓] Role: super_admin")
            return True

        except psycopg2.Error as e:
            logger.error(f"[X] Failed to create super admin: {e}")
            conn.rollback()
            return False
        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        logger.error(f"[X] Failed to create super admin: {e}")
        return False


def verify_tables():
    """Verify that all tables were created correctly."""
    try:
        conn = get_database_connection()
        cursor = conn.cursor()

        # Check if all expected tables exist
        expected_tables = [
            "users",
            "events",
            "evacuation_centers",
            "households",
            "individuals",
            "event_centers",
        ]

        cursor.execute(
            """
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """
        )

        existing_tables = [row[0] for row in cursor.fetchall()]
        missing_tables = set(expected_tables) - set(existing_tables)

        if missing_tables:
            logger.error(f"[X] Missing tables: {missing_tables}")
            return False
        else:
            logger.info("[✓] All expected tables exist!")

            # Count rows in each table (for verification)
            for table in expected_tables:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                logger.info(f"  [✓] {table}: {count} rows")

            return True

    except Exception as e:
        logger.error(f"[X] Verification failed: {e}")
        return False
    finally:
        if "cursor" in locals():
            cursor.close()
        if "conn" in locals():
            conn.close()


def main():
    """Main setup function."""
    logger.info("Starting EFAS Database Setup...")

    try:
        # Step 1: Create database
        logger.info("Step 1: Creating database...")
        create_database()

        # Step 2: Setup tables
        logger.info("Step 2: Setting up tables...")
        setup_tables()

        # Step 3: Create super admin
        logger.info("Step 3: Creating super admin user...")
        admin_created = create_super_admin()

        if not admin_created:
            logger.warning("[!] Super admin creation failed or skipped!")

        # Step 4: Verify setup
        logger.info("Step 4: Verifying setup...")
        success = verify_tables()

        if success:
            logger.info("[✓] Database setup completed successfully!")
        else:
            logger.error("[X] Database setup completed with errors!")
            exit(1)

    except Exception as e:
        logger.error(f"[X] Database setup failed: {e}")
        exit(1)


if __name__ == "__main__":
    main()

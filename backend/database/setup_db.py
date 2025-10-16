"""Database setup script using raw SQL."""

import os
import logging
from typing import Optional
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

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
            database=db_name
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
        cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = %s", (db_name,))
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
        sql_file_path = os.path.join(os.path.dirname(__file__), "sql", "create_tables.sql")
        
        # Check if SQL file exists
        if not os.path.exists(sql_file_path):
            logger.error(f"[X] SQL file not found: {sql_file_path}")
            raise FileNotFoundError(f"SQL file not found: {sql_file_path}")
        
        with open(sql_file_path, 'r', encoding='utf-8') as file:
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
            if "already exists" in str(e).lower():
                logger.warning(f"[!] Some database objects already exist (normal for re-runs)")
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

def verify_tables():
    """Verify that all tables were created correctly."""
    try:
        conn = get_database_connection()
        cursor = conn.cursor()
        
        # Check if all expected tables exist
        expected_tables = [
            'users', 'event', 'evacuation_center', 
            'household', 'individual', 'event_center'
        ]
        
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        
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
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
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
        
        # Step 3: Verify setup
        logger.info("Step 3: Verifying setup...")
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
"""Database sample data population script using raw SQL."""

import logging
import os
import sys
from typing import Optional

import psycopg2

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def get_database_connection(database_name: Optional[str] = None):
    """Get database connection."""
    try:
        # Get connection parameters from environment with defaults
        db_host = os.environ.get("DB_HOST", "localhost")
        db_port = os.environ.get("DB_PORT", "5432")
        db_user = os.environ.get("DB_USER", "postgres")
        db_password = os.environ.get("DB_PASSWORD", "password")
        
        if database_name:
            db_name = database_name
        else:
            db_name = os.environ.get("DB_NAME", "efas_db")

        conn = psycopg2.connect(
            host=db_host,
            port=db_port,
            user=db_user,
            password=db_password,
            database=db_name,
        )
        logger.info(f"[✓] Connected to database '{db_name}' successfully!")
        return conn
    except Exception as e:
        logger.error(f"[X] Failed to connect to database: {e}")
        raise

def execute_sql_file(conn, sql_file_path: str):
    """Execute SQL commands from a file."""
    try:
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
        cursor = conn.cursor()
        
        # Split the script into individual statements
        statements = sql_script.split(';')
        
        successful_statements = 0
        total_statements = len([s for s in statements if s.strip()])
        
        for i, statement in enumerate(statements, 1):
            statement = statement.strip()
            if not statement:
                continue
                
            try:
                cursor.execute(statement)
                logger.info(f"[✓] Executed statement {i}/{total_statements}")
                successful_statements += 1
            except psycopg2.Error as e:
                # Handle specific errors gracefully
                if "duplicate key value violates unique constraint" in str(e):
                    logger.warning(f"[!] Statement {i}: Duplicate entry (normal for re-runs) - {e}")
                elif "already exists" in str(e):
                    logger.warning(f"[!] Statement {i}: Object already exists - {e}")
                else:
                    logger.error(f"[X] Statement {i} failed: {e}")
                    # Don't raise here - continue with other statements
                continue

        conn.commit()
        cursor.close()
        
        logger.info(f"[✓] SQL execution completed: {successful_statements}/{total_statements} statements successful")
        return successful_statements, total_statements

    except Exception as e:
        logger.error(f"[X] Failed to execute SQL file: {e}")
        raise

def verify_data_population(conn):
    """Verify that data was populated correctly by counting rows in each table."""
    try:
        cursor = conn.cursor()
        
        tables_to_check = [
            "evacuation_centers",
            "events", 
            "users",
            "households",
            "individuals",
            "event_centers",
            "attendance_records",
            "allocations",
            "distribution_sessions",
            "distributions",
            "aid_categories"
        ]
        
        logger.info("\n" + "="*50)
        logger.info("DATA POPULATION VERIFICATION")
        logger.info("="*50)
        
        total_rows = 0
        for table in tables_to_check:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                logger.info(f"  [✓] {table:25} : {count:3} rows")
                total_rows += count
            except psycopg2.Error as e:
                logger.warning(f"  [!] {table:25} : Table not accessible - {e}")
        
        logger.info("="*50)
        logger.info(f"  [Σ] Total rows populated: {total_rows}")
        logger.info("="*50)
        
        cursor.close()
        return True
        
    except Exception as e:
        logger.error(f"[X] Verification failed: {e}")
        return False

def check_database_exists():
    """Check if the target database exists."""
    try:
        conn = get_database_connection()
        cursor = conn.cursor()
        
        # Check if our main tables exist
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('users', 'evacuation_centers', 'events')
        """)
        
        existing_tables = [row[0] for row in cursor.fetchall()]
        cursor.close()
        conn.close()
        
        if len(existing_tables) >= 3:
            logger.info("[✓] Database schema exists and appears to be valid")
            return True
        else:
            logger.error("[X] Database schema doesn't exist or is incomplete")
            logger.error(f"   Found tables: {existing_tables}")
            return False
            
    except Exception as e:
        logger.error(f"[X] Could not check database: {e}")
        return False

def main():
    """Main function to populate sample data."""
    logger.info("Starting EFAS Sample Data Population...")
    
    # Check if database exists first
    if not check_database_exists():
        logger.error("[X] Cannot proceed - database schema not found!")
        logger.error("[!] Please run the database setup script first!")
        sys.exit(1)
    
    # Get the SQL file path
    script_dir = os.path.dirname(os.path.abspath(__file__))
    sql_file_path = os.path.join(script_dir, "sql", "seed_db.sql")
    
    # Alternative: if the SQL is in a different location, you can specify it
    if len(sys.argv) > 1:
        sql_file_path = sys.argv[1]
    
    if not os.path.exists(sql_file_path):
        logger.error(f"[X] SQL file not found at: {sql_file_path}")
        logger.info("[!] Please ensure the sample_data.sql file exists")
        sys.exit(1)
    
    conn = None
    try:
        # Step 1: Connect to database
        logger.info("Step 1: Connecting to database...")
        conn = get_database_connection()
        
        # Step 2: Execute sample data SQL
        logger.info("Step 2: Populating sample data...")
        logger.info(f"Using SQL file: {sql_file_path}")
        
        successful, total = execute_sql_file(conn, sql_file_path)
        
        # Step 3: Verify data population
        logger.info("Step 3: Verifying data population...")
        verify_success = verify_data_population(conn)
        
        # Summary
        logger.info("\n" + "="*60)
        logger.info("SAMPLE DATA POPULATION SUMMARY")
        logger.info("="*60)
        logger.info(f"SQL Statements: {successful}/{total} successful")
        logger.info(f"Data Verification: {'PASS' if verify_success else 'FAIL'}")
        
        if successful > 0 and verify_success:
            logger.info("[✓] Sample data population completed successfully!")
            logger.info("[!] You can now use the EFAS system with sample data")
        else:
            logger.warning("[!] Sample data population completed with warnings")
            logger.warning("[!] Some data may not be available")
            
    except Exception as e:
        logger.error(f"[X] Sample data population failed: {e}")
        sys.exit(1)
        
    finally:
        if conn:
            conn.close()
            logger.info("[✓] Database connection closed")

def create_sample_data_file():
    """Utility function to create the seed_db.sql file if it doesn't exist."""
    sample_sql = """-- ========================
-- EFAS Database Sample Data
-- Populates all tables with realistic sample data
-- ========================

-- Your SQL sample data goes here...
-- (This would be the entire SQL content you provided)
"""
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    sql_file_path = os.path.join(script_dir, "sql", "seed_db.sql")
    
    if not os.path.exists(sql_file_path):
        with open(sql_file_path, 'w', encoding='utf-8') as f:
            f.write(sample_sql)
        logger.info(f"[✓] Created sample SQL file at: {sql_file_path}")
        logger.info("[!] Please add your sample data SQL to this file")
    else:
        logger.info(f"[✓] Sample SQL file already exists at: {sql_file_path}")

if __name__ == "__main__":
    # Check if we should create the sample data file
    if len(sys.argv) > 1 and sys.argv[1] == "--create-file":
        create_sample_data_file()
    else:
        main()
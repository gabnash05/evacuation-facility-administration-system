-- ========================
-- EFAS Database Schema
-- Raw SQL Table Creation Script
-- ========================

-- ========================
-- TABLE: EVACUATION_CENTER (must be first due to foreign key dependencies)
-- ========================
CREATE TABLE IF NOT EXISTS evacuation_centers (
    center_id SERIAL PRIMARY KEY,
    center_name VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'closed')),
    current_occupancy INTEGER NOT NULL DEFAULT 0 CHECK (current_occupancy >= 0),
    photo_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- TABLE: EVENT
-- ========================
CREATE TABLE IF NOT EXISTS events (
    event_id SERIAL PRIMARY KEY,
    event_name VARCHAR(150) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    date_declared TIMESTAMP NOT NULL,
    end_date TIMESTAMP NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'monitoring')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (end_date IS NULL OR end_date >= date_declared)

);

-- ========================
-- TABLE: USERS
-- ========================
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'city_admin', 'center_admin', 'volunteer')),
    center_id INTEGER NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    CONSTRAINT fk_user_center 
        FOREIGN KEY (center_id) 
        REFERENCES evacuation_centers(center_id)
        ON DELETE SET NULL,
    
    -- Business logic constraints
    CONSTRAINT chk_center_requirements CHECK (
        (role IN ('super_admin', 'city_admin') AND center_id IS NULL) OR
        (role IN ('center_admin', 'volunteer') AND center_id IS NOT NULL)
    )
);

-- ========================
-- TABLE: HOUSEHOLD
-- ========================
CREATE TABLE IF NOT EXISTS households (
    household_id SERIAL PRIMARY KEY,
    household_head_id INTEGER NULL,  -- Will be self-referencing to individual (added later)
    center_id INTEGER NOT NULL,
    household_name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_household_center 
        FOREIGN KEY (center_id) 
        REFERENCES evacuation_centers(center_id)
        ON DELETE CASCADE
);

-- ========================
-- TABLE: INDIVIDUAL
-- ========================
CREATE TABLE IF NOT EXISTS individuals (
    individual_id SERIAL PRIMARY KEY,
    household_id INTEGER NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE NULL,
    gender VARCHAR(10) NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    relationship_to_head VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_individual_household 
        FOREIGN KEY (household_id) 
        REFERENCES households(household_id)
        ON DELETE CASCADE
);

-- ========================
-- JUNCTION TABLE: EVENT_CENTER
-- ========================
CREATE TABLE IF NOT EXISTS event_centers (
    event_id INTEGER NOT NULL,
    center_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (event_id, center_id),
    
    CONSTRAINT fk_event_center_event 
        FOREIGN KEY (event_id) 
        REFERENCES events(event_id)
        ON DELETE CASCADE,
        
    CONSTRAINT fk_event_center_center 
        FOREIGN KEY (center_id) 
        REFERENCES evacuation_centers(center_id)
        ON DELETE CASCADE
);

-- ========================
-- ADD DEFERRED FOREIGN KEY FOR HOUSEHOLD HEAD
-- ========================
ALTER TABLE households 
ADD CONSTRAINT fk_household_head 
    FOREIGN KEY (household_head_id) 
    REFERENCES individuals(individual_id)
    ON DELETE SET NULL;

-- ========================
-- CREATE UPDATED_AT TRIGGERS
-- ========================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_evacuation_centers_updated_at BEFORE UPDATE ON evacuation_centers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_households_updated_at BEFORE UPDATE ON households FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_individuals_updated_at BEFORE UPDATE ON individuals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
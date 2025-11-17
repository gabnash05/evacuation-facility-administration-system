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
    status VARCHAR(20) NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'closed')),
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
    capacity INTEGER NOT NULL DEFAULT 0 CHECK (capacity >= 0),
    max_occupancy INTEGER NOT NULL DEFAULT 0 CHECK (max_occupancy >= 0),
    usage_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (usage_percentage >= 0),
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
-- TABLE: AID_CATEGORIES
-- ========================
CREATE TABLE IF NOT EXISTS aid_categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- TABLE: ALLOCATIONS
-- ========================
CREATE TABLE IF NOT EXISTS allocations (
    allocation_id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL,
    center_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    resource_name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    total_quantity INTEGER NOT NULL CHECK (total_quantity > 0),
    remaining_quantity INTEGER NOT NULL CHECK (remaining_quantity >= 0),
    distribution_type VARCHAR(20) NOT NULL CHECK (distribution_type IN ('per_household', 'per_individual')),
    suggested_amount INTEGER NULL CHECK (suggested_amount >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'depleted', 'cancelled')),
    allocated_by_user_id INTEGER NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_allocation_category 
        FOREIGN KEY (category_id) 
        REFERENCES aid_categories(category_id)
        ON DELETE RESTRICT,
        
    CONSTRAINT fk_allocation_center 
        FOREIGN KEY (center_id) 
        REFERENCES evacuation_centers(center_id)
        ON DELETE CASCADE,
        
    CONSTRAINT fk_allocation_event 
        FOREIGN KEY (event_id) 
        REFERENCES events(event_id)
        ON DELETE CASCADE,
        
    CONSTRAINT fk_allocation_allocated_by 
        FOREIGN KEY (allocated_by_user_id) 
        REFERENCES users(user_id)
        ON DELETE RESTRICT,
    
    -- Business logic constraints
    CONSTRAINT chk_remaining_quantity CHECK (remaining_quantity <= total_quantity),
    CONSTRAINT chk_suggested_amount_reasonable CHECK (
        suggested_amount IS NULL OR suggested_amount <= total_quantity
    )
);

-- ========================
-- TABLE: DISTRIBUTION_SESSIONS
-- ========================
CREATE TABLE IF NOT EXISTS distribution_sessions (
    session_id SERIAL PRIMARY KEY,
    household_id INTEGER NOT NULL,
    distributed_by_user_id INTEGER NOT NULL,
    center_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    session_notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_distribution_session_household 
        FOREIGN KEY (household_id) 
        REFERENCES households(household_id)
        ON DELETE CASCADE,
        
    CONSTRAINT fk_distribution_session_user 
        FOREIGN KEY (distributed_by_user_id) 
        REFERENCES users(user_id)
        ON DELETE RESTRICT,
        
    CONSTRAINT fk_distribution_session_center 
        FOREIGN KEY (center_id) 
        REFERENCES evacuation_centers(center_id)
        ON DELETE CASCADE,
        
    CONSTRAINT fk_distribution_session_event 
        FOREIGN KEY (event_id) 
        REFERENCES events(event_id)
        ON DELETE CASCADE
);

-- ========================
-- TABLE: DISTRIBUTIONS
-- ========================
CREATE TABLE IF NOT EXISTS distributions (
    distribution_id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL,
    allocation_id INTEGER NOT NULL,
    quantity_distributed INTEGER NOT NULL CHECK (quantity_distributed > 0),
    distribution_notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_distribution_session 
        FOREIGN KEY (session_id) 
        REFERENCES distribution_sessions(session_id)
        ON DELETE CASCADE,
        
    CONSTRAINT fk_distribution_allocation 
        FOREIGN KEY (allocation_id) 
        REFERENCES allocations(allocation_id)
        ON DELETE RESTRICT,
    
    -- Business logic constraints
    CONSTRAINT chk_quantity_positive CHECK (quantity_distributed > 0)
);

-- ========================
-- TABLE: ATTENDANCE_RECORDS
-- ========================
CREATE TABLE IF NOT EXISTS attendance_records (
    record_id SERIAL PRIMARY KEY,
    individual_id INTEGER NOT NULL,
    center_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    household_id INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('checked_in', 'checked_out', 'transferred')),
    check_in_time TIMESTAMP NULL,
    check_out_time TIMESTAMP NULL,
    transfer_from_center_id INTEGER NULL,
    transfer_to_center_id INTEGER NULL,
    transfer_time TIMESTAMP NULL,
    recorded_by_user_id INTEGER NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_attendance_individual 
        FOREIGN KEY (individual_id) 
        REFERENCES individuals(individual_id)
        ON DELETE CASCADE,
        
    CONSTRAINT fk_attendance_center 
        FOREIGN KEY (center_id) 
        REFERENCES evacuation_centers(center_id)
        ON DELETE CASCADE,
        
    CONSTRAINT fk_attendance_event 
        FOREIGN KEY (event_id) 
        REFERENCES events(event_id)
        ON DELETE CASCADE,
        
    CONSTRAINT fk_attendance_household 
        FOREIGN KEY (household_id) 
        REFERENCES households(household_id)
        ON DELETE CASCADE,
        
    CONSTRAINT fk_attendance_transfer_from 
        FOREIGN KEY (transfer_from_center_id) 
        REFERENCES evacuation_centers(center_id)
        ON DELETE SET NULL,
        
    CONSTRAINT fk_attendance_transfer_to 
        FOREIGN KEY (transfer_to_center_id) 
        REFERENCES evacuation_centers(center_id)
        ON DELETE SET NULL,
        
    CONSTRAINT fk_attendance_recorded_by 
        FOREIGN KEY (recorded_by_user_id) 
        REFERENCES users(user_id)
        ON DELETE RESTRICT,
    
    -- Business logic constraints
    CONSTRAINT chk_check_in_out_times CHECK (
        (status = 'checked_in' AND check_in_time IS NOT NULL AND check_out_time IS NULL) OR
        (status = 'checked_out' AND check_in_time IS NOT NULL AND check_out_time IS NOT NULL AND check_out_time >= check_in_time) OR
        (status = 'transferred' AND transfer_time IS NOT NULL AND transfer_from_center_id IS NOT NULL AND transfer_to_center_id IS NOT NULL)
    ),
    
    CONSTRAINT chk_transfer_centers_different CHECK (
        status != 'transferred' OR transfer_from_center_id != transfer_to_center_id
    )
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
    ON DELETE SET NULL
DEFERRABLE INITIALLY DEFERRED;

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

-- ========================
-- AID ALLOCATION TRIGGERS AND FUNCTIONS
-- ========================

-- Function to update allocation remaining quantity and status
CREATE OR REPLACE FUNCTION update_allocation_quantity()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT (new distribution)
    IF TG_OP = 'INSERT' THEN
        -- Check if sufficient quantity remains
        IF (SELECT remaining_quantity FROM allocations WHERE allocation_id = NEW.allocation_id) < NEW.quantity_distributed THEN
            RAISE EXCEPTION 'Insufficient quantity in allocation. Requested: %, Available: %', 
                NEW.quantity_distributed, 
                (SELECT remaining_quantity FROM allocations WHERE allocation_id = NEW.allocation_id);
        END IF;
        
        -- Update remaining quantity
        UPDATE allocations 
        SET remaining_quantity = remaining_quantity - NEW.quantity_distributed,
            updated_at = CURRENT_TIMESTAMP
        WHERE allocation_id = NEW.allocation_id;
        
        -- Update status to depleted if remaining is 0
        UPDATE allocations 
        SET status = 'depleted',
            updated_at = CURRENT_TIMESTAMP
        WHERE allocation_id = NEW.allocation_id 
          AND remaining_quantity = 0;
          
    -- Handle DELETE (reverse distribution)
    ELSIF TG_OP = 'DELETE' THEN
        -- Restore quantity
        UPDATE allocations 
        SET remaining_quantity = remaining_quantity + OLD.quantity_distributed,
            status = 'active',
            updated_at = CURRENT_TIMESTAMP
        WHERE allocation_id = OLD.allocation_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to create a distribution session with multiple allocations
CREATE OR REPLACE FUNCTION create_distribution_session(
    p_household_id INTEGER,
    p_distributed_by_user_id INTEGER,
    p_center_id INTEGER,
    p_event_id INTEGER,
    p_session_notes TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_session_id INTEGER;
BEGIN
    -- Create distribution session
    INSERT INTO distribution_sessions (
        household_id, distributed_by_user_id, center_id, event_id, session_notes
    ) VALUES (
        p_household_id, p_distributed_by_user_id, p_center_id, p_event_id, p_session_notes
    ) RETURNING session_id INTO v_session_id;
    
    RETURN v_session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to add distribution to session
CREATE OR REPLACE FUNCTION add_distribution_to_session(
    p_session_id INTEGER,
    p_allocation_id INTEGER,
    p_quantity_distributed INTEGER,
    p_distribution_notes TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_distribution_id INTEGER;
    v_remaining_quantity INTEGER;
BEGIN
    -- Check if allocation exists and has sufficient quantity
    SELECT remaining_quantity INTO v_remaining_quantity
    FROM allocations 
    WHERE allocation_id = p_allocation_id 
      AND status = 'active';
    
    IF v_remaining_quantity IS NULL THEN
        RAISE EXCEPTION 'Allocation not found or not active';
    END IF;
    
    IF v_remaining_quantity < p_quantity_distributed THEN
        RAISE EXCEPTION 'Insufficient quantity in allocation. Requested: %, Available: %', 
            p_quantity_distributed, v_remaining_quantity;
    END IF;
    
    -- Insert distribution (trigger will handle quantity update)
    INSERT INTO distributions (
        session_id, allocation_id, quantity_distributed, distribution_notes
    ) VALUES (
        p_session_id, p_allocation_id, p_quantity_distributed, p_distribution_notes
    ) RETURNING distribution_id INTO v_distribution_id;
    
    RETURN v_distribution_id;
END;
$$ LANGUAGE plpgsql;

-- ========================
-- OCCUPANCY TRACKING TRIGGERS AND FUNCTIONS
-- ========================

-- Function to update occupancy when attendance records change
CREATE OR REPLACE FUNCTION update_center_occupancy()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT (new check-in)
    IF TG_OP = 'INSERT' AND NEW.status = 'checked_in' THEN
        UPDATE evacuation_centers 
        SET current_occupancy = current_occupancy + 1
        WHERE center_id = NEW.center_id;
        
    -- Handle UPDATE (check-out or status change)
    ELSIF TG_OP = 'UPDATE' THEN
        -- If changing from checked_in to checked_out
        IF OLD.status = 'checked_in' AND NEW.status = 'checked_out' THEN
            UPDATE evacuation_centers 
            SET current_occupancy = GREATEST(0, current_occupancy - 1)
            WHERE center_id = OLD.center_id;
            
        -- If changing center while checked in (transfer)
        ELSIF OLD.status = 'checked_in' AND NEW.status = 'checked_in' AND OLD.center_id != NEW.center_id THEN
            -- Decrement old center
            UPDATE evacuation_centers 
            SET current_occupancy = GREATEST(0, current_occupancy - 1)
            WHERE center_id = OLD.center_id;
            
            -- Increment new center
            UPDATE evacuation_centers 
            SET current_occupancy = current_occupancy + 1
            WHERE center_id = NEW.center_id;
        END IF;
        
    -- Handle DELETE (remove check-in)
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'checked_in' THEN
        UPDATE evacuation_centers 
        SET current_occupancy = GREATEST(0, current_occupancy - 1)
        WHERE center_id = OLD.center_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to recalculate occupancy for a specific center (for data integrity)
CREATE OR REPLACE FUNCTION recalculate_center_occupancy(p_center_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    v_actual_occupancy INTEGER;
BEGIN
    -- Count current checked-in individuals for this center
    SELECT COUNT(*) INTO v_actual_occupancy
    FROM attendance_records 
    WHERE center_id = p_center_id 
      AND status = 'checked_in' 
      AND check_out_time IS NULL;
    
    -- Update the center's occupancy
    UPDATE evacuation_centers 
    SET current_occupancy = v_actual_occupancy
    WHERE center_id = p_center_id;
    
    RETURN v_actual_occupancy;
END;
$$ LANGUAGE plpgsql;

-- Function to recalculate all center occupancies
CREATE OR REPLACE FUNCTION recalculate_all_center_occupancies()
RETURNS TABLE(center_id INTEGER, center_name VARCHAR, old_occupancy INTEGER, new_occupancy INTEGER) AS $$
BEGIN
    RETURN QUERY
    WITH center_counts AS (
        SELECT 
            ec.center_id,
            ec.center_name,
            ec.current_occupancy as old_occupancy,
            COUNT(ar.individual_id) as calculated_occupancy
        FROM evacuation_centers ec
        LEFT JOIN attendance_records ar ON ec.center_id = ar.center_id 
            AND ar.status = 'checked_in'
            AND ar.check_out_time IS NULL
        GROUP BY ec.center_id, ec.center_name, ec.current_occupancy
    )
    UPDATE evacuation_centers ec
    SET current_occupancy = cc.calculated_occupancy
    FROM center_counts cc
    WHERE ec.center_id = cc.center_id
    RETURNING ec.center_id, ec.center_name, cc.old_occupancy, cc.calculated_occupancy;
END;
$$ LANGUAGE plpgsql;

-- ========================
-- CREATE TRIGGERS
-- ========================

-- Triggers for automatic occupancy tracking
CREATE TRIGGER update_occupancy_on_insert
    AFTER INSERT ON attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION update_center_occupancy();

CREATE TRIGGER update_occupancy_on_update
    AFTER UPDATE ON attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION update_center_occupancy();

CREATE TRIGGER update_occupancy_on_delete
    AFTER DELETE ON attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION update_center_occupancy();

-- Triggers for automatic allocation quantity tracking
CREATE TRIGGER update_allocation_on_distribution_insert
    AFTER INSERT ON distributions
    FOR EACH ROW
    EXECUTE FUNCTION update_allocation_quantity();

CREATE TRIGGER update_allocation_on_distribution_delete
    AFTER DELETE ON distributions
    FOR EACH ROW
    EXECUTE FUNCTION update_allocation_quantity();

-- Create triggers for all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_evacuation_centers_updated_at BEFORE UPDATE ON evacuation_centers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_households_updated_at BEFORE UPDATE ON households FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_individuals_updated_at BEFORE UPDATE ON individuals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_records_updated_at BEFORE UPDATE ON attendance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_aid_categories_updated_at BEFORE UPDATE ON aid_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_allocations_updated_at BEFORE UPDATE ON allocations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================
-- CREATE INDEXES FOR PERFORMANCE
-- ========================

-- Indexes for attendance_records
CREATE INDEX IF NOT EXISTS idx_attendance_individual_center ON attendance_records(individual_id, center_id);
CREATE INDEX IF NOT EXISTS idx_attendance_center_status ON attendance_records(center_id, status);
CREATE INDEX IF NOT EXISTS idx_attendance_check_in_time ON attendance_records(check_in_time);
CREATE INDEX IF NOT EXISTS idx_attendance_event_center ON attendance_records(event_id, center_id);
CREATE INDEX IF NOT EXISTS idx_attendance_current_occupancy ON attendance_records(center_id, status) WHERE status = 'checked_in';
CREATE INDEX IF NOT EXISTS idx_attendance_transfer_time ON attendance_records(transfer_time);

-- Indexes for individuals and households
CREATE INDEX IF NOT EXISTS idx_individuals_household_id ON individuals(household_id);
CREATE INDEX IF NOT EXISTS idx_individuals_name ON individuals(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_households_center_id ON households(center_id);

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_users_center_id ON users(center_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Indexes for events and evacuation_centers
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date_declared);
CREATE INDEX IF NOT EXISTS idx_evacuation_centers_status ON evacuation_centers(status);

-- Indexes for aid allocation system
CREATE INDEX IF NOT EXISTS idx_allocations_center_status ON allocations(center_id, status);
CREATE INDEX IF NOT EXISTS idx_allocations_category ON allocations(category_id);
CREATE INDEX IF NOT EXISTS idx_allocations_event ON allocations(event_id);
CREATE INDEX IF NOT EXISTS idx_allocations_remaining_quantity ON allocations(remaining_quantity) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_distributions_session ON distributions(session_id);
CREATE INDEX IF NOT EXISTS idx_distributions_allocation ON distributions(allocation_id);
CREATE INDEX IF NOT EXISTS idx_distribution_sessions_household ON distribution_sessions(household_id);
CREATE INDEX IF NOT EXISTS idx_distribution_sessions_center_date ON distribution_sessions(center_id, created_at);
CREATE INDEX IF NOT EXISTS idx_aid_categories_active ON aid_categories(is_active) WHERE is_active = TRUE;

-- ========================
-- CREATE HELPER VIEWS FOR REPORTING
-- ========================

-- View for current occupancy per center
CREATE OR REPLACE VIEW current_center_occupancy AS
SELECT 
    ec.center_id,
    ec.center_name,
    ec.capacity,
    ec.current_occupancy,
    COUNT(ar.individual_id) AS calculated_occupancy,
    ROUND((COUNT(ar.individual_id) * 100.0 / ec.capacity), 2) AS occupancy_percentage
FROM evacuation_centers ec
LEFT JOIN attendance_records ar ON ec.center_id = ar.center_id 
    AND ar.status = 'checked_in'
    AND ar.check_out_time IS NULL
WHERE ec.status = 'active'
GROUP BY ec.center_id, ec.center_name, ec.capacity, ec.current_occupancy;

-- View for individual attendance history
CREATE OR REPLACE VIEW individual_attendance_history AS
SELECT 
    i.individual_id,
    i.first_name,
    i.last_name,
    h.household_id,
    h.household_name,
    ar.center_id,
    ec.center_name,
    ar.status,
    ar.check_in_time,
    ar.check_out_time,
    ar.transfer_time,
    ar.recorded_by_user_id,
    u.email as recorded_by_email,
    ar.notes
FROM individuals i
JOIN households h ON i.household_id = h.household_id
JOIN attendance_records ar ON i.individual_id = ar.individual_id
JOIN evacuation_centers ec ON ar.center_id = ec.center_id
JOIN users u ON ar.recorded_by_user_id = u.user_id
ORDER BY ar.check_in_time DESC;

-- View for transfer history
CREATE OR REPLACE VIEW transfer_history AS
SELECT 
    ar.record_id,
    i.individual_id,
    i.first_name || ' ' || i.last_name AS individual_name,
    h.household_name,
    ec_from.center_id AS from_center_id,
    ec_from.center_name AS from_center,
    ec_to.center_id AS to_center_id,
    ec_to.center_name AS to_center,
    ar.transfer_time,
    u.email as transferred_by,
    u.user_id as transferred_by_user_id,
    ar.notes
FROM attendance_records ar
JOIN individuals i ON ar.individual_id = i.individual_id
JOIN households h ON i.household_id = h.household_id
JOIN evacuation_centers ec_from ON ar.transfer_from_center_id = ec_from.center_id
JOIN evacuation_centers ec_to ON ar.transfer_to_center_id = ec_to.center_id
JOIN users u ON ar.recorded_by_user_id = u.user_id
WHERE ar.status = 'transferred'
ORDER BY ar.transfer_time DESC;

-- View for current evacuees (checked in but not checked out)
CREATE OR REPLACE VIEW current_evacuees AS
SELECT 
    ar.record_id,
    i.individual_id,
    i.first_name,
    i.last_name,
    i.date_of_birth,
    i.gender,
    h.household_id,
    h.household_name,
    ec.center_id,
    ec.center_name,
    ar.check_in_time,
    ar.recorded_by_user_id,
    u.email as checked_in_by
FROM attendance_records ar
JOIN individuals i ON ar.individual_id = i.individual_id
JOIN households h ON i.household_id = h.household_id
JOIN evacuation_centers ec ON ar.center_id = ec.center_id
JOIN users u ON ar.recorded_by_user_id = u.user_id
WHERE ar.status = 'checked_in' 
  AND ar.check_out_time IS NULL
ORDER BY ar.check_in_time DESC;

-- ========================
-- AID ALLOCATION REPORTING VIEWS
-- ========================

-- View for center allocation dashboard
CREATE OR REPLACE VIEW center_allocation_dashboard AS
SELECT 
    a.allocation_id,
    a.resource_name,
    ac.category_name,
    a.description,
    a.total_quantity,
    a.remaining_quantity,
    a.distribution_type,
    a.suggested_amount,
    a.status,
    ec.center_id,
    ec.center_name,
    e.event_name,
    u.email as allocated_by,
    a.created_at
FROM allocations a
JOIN aid_categories ac ON a.category_id = ac.category_id
JOIN evacuation_centers ec ON a.center_id = ec.center_id
JOIN events e ON a.event_id = e.event_id
JOIN users u ON a.allocated_by_user_id = u.user_id
WHERE a.status = 'active'
ORDER BY ec.center_name, ac.category_name, a.resource_name;

-- View for distribution history
CREATE OR REPLACE VIEW distribution_history AS
SELECT 
    ds.session_id,
    h.household_id,
    h.household_name,
    ds.distributed_by_user_id,
    u_dist.email as distributed_by,
    ec.center_id,
    ec.center_name,
    e.event_name,
    d.distribution_id,
    a.resource_name,
    ac.category_name,
    a.distribution_type,
    d.quantity_distributed,
    d.distribution_notes,
    ds.session_notes,
    ds.created_at as distribution_date
FROM distribution_sessions ds
JOIN households h ON ds.household_id = h.household_id
JOIN users u_dist ON ds.distributed_by_user_id = u_dist.user_id
JOIN evacuation_centers ec ON ds.center_id = ec.center_id
JOIN events e ON ds.event_id = e.event_id
JOIN distributions d ON ds.session_id = d.session_id
JOIN allocations a ON d.allocation_id = a.allocation_id
JOIN aid_categories ac ON a.category_id = ac.category_id
ORDER BY ds.created_at DESC;

-- View for household distribution summary
CREATE OR REPLACE VIEW household_distribution_summary AS
SELECT 
    h.household_id,
    h.household_name,
    ec.center_name,
    COUNT(DISTINCT ds.session_id) as total_distributions,
    COUNT(DISTINCT d.allocation_id) as unique_resources_received,
    SUM(d.quantity_distributed) as total_items_received,
    MAX(ds.created_at) as last_distribution_date
FROM households h
JOIN distribution_sessions ds ON h.household_id = ds.household_id
JOIN distributions d ON ds.session_id = d.session_id
JOIN evacuation_centers ec ON h.center_id = ec.center_id
GROUP BY h.household_id, h.household_name, ec.center_name
ORDER BY last_distribution_date DESC;

-- ========================
-- CREATE FUNCTIONS FOR COMMON OPERATIONS
-- ========================

-- Function to check in an individual
CREATE OR REPLACE FUNCTION check_in_individual(
    p_individual_id INTEGER,
    p_center_id INTEGER,
    p_event_id INTEGER,
    p_recorded_by_user_id INTEGER,
    p_notes TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_household_id INTEGER;
    v_record_id INTEGER;
BEGIN
    -- Get household_id from individual
    SELECT household_id INTO v_household_id 
    FROM individuals 
    WHERE individual_id = p_individual_id;
    
    IF v_household_id IS NULL THEN
        RAISE EXCEPTION 'Individual not found';
    END IF;
    
    -- Insert attendance record (triggers will handle occupancy update)
    INSERT INTO attendance_records (
        individual_id, center_id, event_id, household_id,
        status, check_in_time, recorded_by_user_id, notes
    ) VALUES (
        p_individual_id, p_center_id, p_event_id, v_household_id,
        'checked_in', CURRENT_TIMESTAMP, p_recorded_by_user_id, p_notes
    ) RETURNING record_id INTO v_record_id;
    
    RETURN v_record_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check out an individual
CREATE OR REPLACE FUNCTION check_out_individual(
    p_individual_id INTEGER,
    p_center_id INTEGER,
    p_recorded_by_user_id INTEGER,
    p_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    -- Update attendance record (triggers will handle occupancy update)
    UPDATE attendance_records 
    SET status = 'checked_out', 
        check_out_time = CURRENT_TIMESTAMP,
        recorded_by_user_id = p_recorded_by_user_id,
        notes = COALESCE(p_notes, notes),
        updated_at = CURRENT_TIMESTAMP
    WHERE individual_id = p_individual_id 
      AND center_id = p_center_id 
      AND status = 'checked_in'
      AND check_out_time IS NULL;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RETURN v_updated_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to transfer an individual
CREATE OR REPLACE FUNCTION transfer_individual(
    p_individual_id INTEGER,
    p_from_center_id INTEGER,
    p_to_center_id INTEGER,
    p_event_id INTEGER,
    p_recorded_by_user_id INTEGER,
    p_notes TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_household_id INTEGER;
    v_record_id INTEGER;
BEGIN
    -- Get household_id from individual
    SELECT household_id INTO v_household_id 
    FROM individuals 
    WHERE individual_id = p_individual_id;
    
    IF v_household_id IS NULL THEN
        RAISE EXCEPTION 'Individual not found';
    END IF;
    
    -- Check out from current center
    PERFORM check_out_individual(p_individual_id, p_from_center_id, p_recorded_by_user_id, 'Transferred out');
    
    -- Insert transfer record
    INSERT INTO attendance_records (
        individual_id, center_id, event_id, household_id,
        status, transfer_from_center_id, transfer_to_center_id,
        transfer_time, recorded_by_user_id, notes
    ) VALUES (
        p_individual_id, p_to_center_id, p_event_id, v_household_id,
        'transferred', p_from_center_id, p_to_center_id,
        CURRENT_TIMESTAMP, p_recorded_by_user_id, p_notes
    ) RETURNING record_id INTO v_record_id;
    
    -- Check in to new center
    PERFORM check_in_individual(p_individual_id, p_to_center_id, p_event_id, p_recorded_by_user_id, 'Transferred in');
    
    RETURN v_record_id;
END;
$$ LANGUAGE plpgsql;

-- ========================
-- INITIAL DATA FOR AID CATEGORIES
-- ========================

INSERT INTO aid_categories (category_name, description) VALUES
('Food', 'Food supplies and meals'),
('Water', 'Drinking water and hydration'),
('Medical', 'Medical supplies and first aid'),
('Hygiene', 'Hygiene and sanitation products'),
('Clothing', 'Clothing and personal items'),
('Shelter', 'Shelter and bedding materials'),
('Other', 'Other types of aid')
ON CONFLICT (category_name) DO NOTHING;
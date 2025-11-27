-- ========================
-- EFAS Database Sample Data
-- Populates all tables with realistic sample data
-- ========================

-- ========================
-- 1. EVACUATION_CENTERS (must be first due to foreign keys)
-- ========================
INSERT INTO evacuation_centers (center_name, address, capacity, status, current_occupancy, photo_data) VALUES
('Northside High School', '123 Education Blvd, North District', 500, 'active', 0, 'northside_high.jpg'),
('Community Center Main', '456 Civic Lane, Central City', 300, 'active', 0, 'community_center.jpg'),
('Riverside Elementary', '789 River Road, East End', 250, 'active', 0, 'riverside_elem.jpg'),
('Westgate Sports Complex', '321 Stadium Ave, Westgate', 400, 'inactive', 0, 'westgate_complex.jpg'),
('St. Mary Church Hall', '654 Faith Street, Old Town', 200, 'active', 0, 'st_mary_church.jpg'),
('South Park Pavilion', '987 Park Lane, Southside', 150, 'closed', 0, 'south_park.jpg')
ON CONFLICT DO NOTHING;

-- ========================
-- 2. EVENTS
-- ========================
INSERT INTO events (event_name, event_type, date_declared, end_date, status, capacity, max_occupancy, usage_percentage) VALUES
('Typhoon Ruby 2024', 'typhoon', '2024-08-15 14:30:00', NULL, 'active', 1200, 0, 0),
('River Flood Alert', 'flood', '2024-09-02 08:15:00', '2024-09-10 18:00:00', 'resolved', 800, 0, 0),
('Earthquake Response', 'earthquake', '2024-07-20 10:45:00', NULL, 'monitoring', 1500, 0, 0),
('Wildfire Evacuation', 'wildfire', '2024-10-05 16:20:00', NULL, 'active', 600, 0, 0),
('Monsoon Season Prep', 'monsoon', '2024-06-01 09:00:00', '2024-09-30 17:00:00', 'resolved', 1000, 0, 0),
('Urban Flood Watch', 'urban_flood', '2024-11-12 13:10:00', NULL, 'active', 900, 0, 0)
ON CONFLICT DO NOTHING;

-- ========================
-- 3. USERS
-- ========================
INSERT INTO users (email, password_hash, role, center_id, is_active) VALUES
('super.admin@efas.gov', '$2b$10$examplehashsuperadmin', 'super_admin', NULL, TRUE),
('city.admin@efas.gov', '$2b$10$examplehashcityadmin', 'city_admin', NULL, TRUE),
('northside.admin@efas.gov', '$2b$10$examplehashnorthside', 'center_admin', 1, TRUE),
('community.admin@efas.gov', '$2b$10$examplehashcommunity', 'center_admin', 2, TRUE),
('riverside.admin@efas.gov', '$2b$10$examplehashriverside', 'center_admin', 3, TRUE),
('volunteer.john@efas.gov', '$2b$10$examplehashjohn', 'volunteer', 1, TRUE),
('volunteer.maria@efas.gov', '$2b$10$examplehashmaria', 'volunteer', 2, TRUE),
('volunteer.david@efas.gov', '$2b$10$examplehashdavid', 'volunteer', 3, TRUE),
('volunteer.sarah@efas.gov', '$2b$10$examplehashsarah', 'volunteer', 4, TRUE),
('volunteer.mike@efas.gov', '$2b$10$examplehashmike', 'volunteer', 5, TRUE)
ON CONFLICT DO NOTHING;

-- ========================
-- 4. HOUSEHOLDS (initially without household_head_id due to circular dependency)
-- ========================
INSERT INTO households (center_id, household_name, address) VALUES
(1, 'Smith Family', '123 Oak Street, North District'),
(1, 'Johnson Family', '456 Pine Avenue, North District'),
(2, 'Garcia Family', '789 Maple Road, Central City'),
(2, 'Chen Family', '321 Birch Lane, Central City'),
(3, 'Williams Family', '654 Cedar Street, East End'),
(3, 'Brown Family', '987 Elm Court, East End'),
(4, 'Davis Family', '111 Spruce Way, Westgate'),
(5, 'Rodriguez Family', '222 Willow Drive, Old Town')
ON CONFLICT DO NOTHING;

-- ========================
-- 5. INDIVIDUALS
-- ========================
INSERT INTO individuals (household_id, first_name, last_name, date_of_birth, gender, relationship_to_head) VALUES
-- Smith Family (Household 1)
(1, 'John', 'Smith', '1978-03-15', 'Male', 'Head'),
(1, 'Mary', 'Smith', '1980-07-22', 'Female', 'Spouse'),
(1, 'Tommy', 'Smith', '2010-11-05', 'Male', 'Child'),
(1, 'Emily', 'Smith', '2013-02-14', 'Female', 'Child'),

-- Johnson Family (Household 2)
(2, 'Robert', 'Johnson', '1965-09-30', 'Male', 'Head'),
(2, 'Lisa', 'Johnson', '1968-12-10', 'Female', 'Spouse'),
(2, 'Michael', 'Johnson', '1995-04-18', 'Male', 'Child'),

-- Garcia Family (Household 3)
(3, 'Carlos', 'Garcia', '1982-06-25', 'Male', 'Head'),
(3, 'Elena', 'Garcia', '1985-08-12', 'Female', 'Spouse'),
(3, 'Sophia', 'Garcia', '2015-03-08', 'Female', 'Child'),

-- Chen Family (Household 4)
(4, 'Wei', 'Chen', '1975-01-20', 'Male', 'Head'),
(4, 'Mei', 'Chen', '1977-05-15', 'Female', 'Spouse'),
(4, 'Jin', 'Chen', '2008-09-22', 'Male', 'Child'),

-- Williams Family (Household 5)
(5, 'James', 'Williams', '1988-11-03', 'Male', 'Head'),
(5, 'Sarah', 'Williams', '1990-07-19', 'Female', 'Spouse'),

-- Brown Family (Household 6)
(6, 'Patricia', 'Brown', '1960-04-12', 'Female', 'Head'),
(6, 'Richard', 'Brown', '2018-12-25', 'Male', 'Grandchild'),

-- Davis Family (Household 7)
(7, 'Jennifer', 'Davis', '1972-10-08', 'Female', 'Head'),
(7, 'Daniel', 'Davis', '2005-06-30', 'Male', 'Child'),

-- Rodriguez Family (Household 8)
(8, 'Miguel', 'Rodriguez', '1980-02-28', 'Male', 'Head'),
(8, 'Isabella', 'Rodriguez', '2012-08-14', 'Female', 'Child')
ON CONFLICT DO NOTHING;

-- ========================
-- 6. UPDATE HOUSEHOLDS with household_head_id (resolving circular dependency)
-- ========================
UPDATE households SET household_head_id = 1 WHERE household_id = 1;
UPDATE households SET household_head_id = 5 WHERE household_id = 2;
UPDATE households SET household_head_id = 8 WHERE household_id = 3;
UPDATE households SET household_head_id = 11 WHERE household_id = 4;
UPDATE households SET household_head_id = 14 WHERE household_id = 5;
UPDATE households SET household_head_id = 16 WHERE household_id = 6;
UPDATE households SET household_head_id = 18 WHERE household_id = 7;
UPDATE households SET household_head_id = 20 WHERE household_id = 8;

-- ========================
-- 7. EVENT_CENTERS (junction table)
-- ========================
INSERT INTO event_centers (event_id, center_id) VALUES
(1, 1), (1, 2), (1, 3),  -- Typhoon Ruby affects centers 1,2,3
(2, 2), (2, 3),          -- River Flood affects centers 2,3
(3, 1), (3, 4), (3, 5),  -- Earthquake affects centers 1,4,5
(4, 4), (4, 5),          -- Wildfire affects centers 4,5
(5, 1), (5, 2), (5, 3), (5, 4), (5, 5),  -- Monsoon affects all centers
(6, 2), (6, 3)           -- Urban Flood affects centers 2,3
ON CONFLICT DO NOTHING;

-- ========================
-- 8. ATTENDANCE_RECORDS - FIXED: Correct column count and syntax
-- ========================
INSERT INTO attendance_records (individual_id, center_id, event_id, household_id, status, check_in_time, recorded_by_user_id, check_out_time, transfer_from_center_id, transfer_to_center_id, transfer_time, notes) VALUES
-- Current check-ins for Typhoon Ruby
(1, 1, 1, 1, 'checked_in', '2024-08-15 16:30:00', 3, NULL, NULL, NULL, NULL, NULL),
(2, 1, 1, 1, 'checked_in', '2024-08-15 16:30:00', 3, NULL, NULL, NULL, NULL, NULL),
(3, 1, 1, 1, 'checked_in', '2024-08-15 16:30:00', 3, NULL, NULL, NULL, NULL, NULL),
(5, 1, 1, 2, 'checked_in', '2024-08-15 17:15:00', 3, NULL, NULL, NULL, NULL, NULL),
(6, 1, 1, 2, 'checked_in', '2024-08-15 17:15:00', 3, NULL, NULL, NULL, NULL, NULL),

-- Check-ins at Community Center
(8, 2, 1, 3, 'checked_in', '2024-08-15 15:45:00', 4, NULL, NULL, NULL, NULL, NULL),
(9, 2, 1, 3, 'checked_in', '2024-08-15 15:45:00', 4, NULL, NULL, NULL, NULL, NULL),
(11, 2, 1, 4, 'checked_in', '2024-08-15 16:20:00', 4, NULL, NULL, NULL, NULL, NULL),

-- Check-ins at Riverside Elementary
(14, 3, 1, 5, 'checked_in', '2024-08-15 14:50:00', 5, NULL, NULL, NULL, NULL, NULL),
(15, 3, 1, 5, 'checked_in', '2024-08-15 14:50:00', 5, NULL, NULL, NULL, NULL, NULL),

-- Completed check-outs from previous events
(16, 2, 2, 6, 'checked_out', '2024-09-02 10:30:00', 4, '2024-09-08 14:00:00', NULL, NULL, NULL, NULL),
(17, 2, 2, 6, 'checked_out', '2024-09-02 10:30:00', 4, '2024-09-08 14:00:00', NULL, NULL, NULL, NULL),

-- Transfers
(18, 4, 3, 7, 'transferred', NULL, 9, NULL, 4, 5, '2024-07-21 11:20:00', NULL),
(20, 5, 3, 8, 'transferred', NULL, 10, NULL, 5, 3, '2024-07-22 09:45:00', NULL)
ON CONFLICT DO NOTHING;

-- ========================
-- UPDATE EVENTS max_occupancy BASED ON ATTENDANCE
-- ========================
UPDATE events e
SET max_occupancy = (
    SELECT COUNT(*)
    FROM attendance_records ar
    WHERE ar.event_id = e.event_id
      AND ar.status = 'checked_in'
      AND ar.check_out_time IS NULL
);

-- ========================
-- 9. ALLOCATIONS - FIXED: Updated quantities to avoid depletion errors
-- ========================
INSERT INTO allocations (category_id, center_id, event_id, resource_name, description, total_quantity, remaining_quantity, distribution_type, suggested_amount, status, allocated_by_user_id, notes) VALUES
-- Food allocations
(1, 1, 1, 'Emergency Food Packs', '7-day supply for family of 4', 200, 185, 'per_household', 1, 'active', 2, 'High priority'),
(1, 2, 1, 'Ready-to-Eat Meals', 'Individual meal packs', 1000, 920, 'per_individual', 3, 'active', 2, NULL),
(1, 3, 1, 'Infant Formula', 'Specialized nutrition for infants', 100, 95, 'per_individual', 2, 'active', 2, 'Limited supply'),

-- Water allocations
(2, 1, 1, 'Bottled Water', '500ml bottles', 2000, 1800, 'per_individual', 4, 'active', 2, 'Daily distribution'),
(2, 2, 1, 'Water Containers', '5-gallon water containers', 200, 175, 'per_household', 1, 'active', 2, NULL),

-- Medical allocations
(3, 1, 1, 'First Aid Kits', 'Basic medical supplies', 100, 90, 'per_household', 1, 'active', 2, 'Restock needed'),
(3, 3, 1, 'Prescription Meds', 'Common chronic condition medications', 400, 380, 'per_individual', 1, 'active', 2, 'Medical supervision required'),

-- Hygiene allocations
(4, 1, 1, 'Hygiene Kits', 'Soap, toothpaste, sanitary items', 300, 280, 'per_household', 1, 'active', 2, NULL),
(4, 2, 1, 'Sanitary Pads', 'Feminine hygiene products', 600, 550, 'per_individual', 5, 'active', 2, 'Essential item'),

-- Clothing allocations
(5, 1, 1, 'Blankets', 'Emergency thermal blankets', 400, 350, 'per_household', 2, 'active', 2, 'Cold weather'),
(5, 3, 1, 'Clothing Sets', 'Basic clothing items', 200, 180, 'per_individual', 2, 'active', 2, 'Various sizes'),

-- Shelter allocations
(6, 1, 1, 'Tents', 'Family-sized tents', 60, 55, 'per_household', 1, 'active', 2, 'For outdoor use'),
(6, 2, 1, 'Sleeping Mats', 'Foam sleeping mats', 300, 280, 'per_individual', 1, 'active', 2, NULL),

-- Depleted allocations (for previous events)
(1, 1, 2, 'Snack Packs', 'Energy bars and snacks', 200, 10, 'per_individual', 2, 'depleted', 2, 'Fully distributed'),
(2, 2, 2, 'Emergency Water', '250ml emergency pouches', 500, 10, 'per_individual', 2, 'depleted', 2, 'Event completed')
ON CONFLICT DO NOTHING;

-- ========================
-- 10. DISTRIBUTION_SESSIONS
-- ========================
INSERT INTO distribution_sessions (household_id, distributed_by_user_id, center_id, event_id, session_notes) VALUES
(1, 6, 1, 1, 'Initial allocation for family of 4'),
(2, 6, 1, 1, 'Elderly couple with specific needs'),
(3, 7, 2, 1, 'Family with young child'),
(4, 7, 2, 1, 'Non-English speaking family'),
(5, 8, 3, 1, 'Working professional couple'),
(6, 7, 2, 2, 'Completed distribution from previous event'),
(7, 9, 4, 3, 'Transfer case distribution'),
(8, 10, 5, 3, 'Single parent household')
ON CONFLICT DO NOTHING;

-- ========================
-- 11. DISTRIBUTIONS - FIXED: Updated quantities to match available allocations
-- ========================
INSERT INTO distributions (session_id, allocation_id, quantity_distributed, distribution_notes) VALUES
-- Session 1 distributions
(1, 1, 1, '7-day food pack'),
(1, 4, 16, '4 water bottles per person x 4 people'),
(1, 7, 1, 'Family first aid kit'),
(1, 8, 1, 'Household hygiene kit'),
(1, 11, 2, 'Two blankets for family'),

-- Session 2 distributions
(2, 1, 1, '7-day food pack for couple'),
(2, 4, 8, '4 water bottles per person x 2 people'),
(2, 7, 1, 'First aid kit'),
(2, 8, 1, 'Hygiene kit'),
(2, 11, 2, 'Extra blanket requested'),

-- Session 3 distributions
(3, 2, 9, '3 meals x 3 people'),
(3, 5, 1, 'Water container'),
(3, 9, 10, 'Sanitary pads for mother'),
(3, 12, 1, 'Sleeping mat'),

-- Session 4 distributions
(4, 2, 9, '3 meals x 3 people'),
(4, 5, 1, 'Water container'),
(4, 8, 1, 'Hygiene kit with translation'),
(4, 12, 3, 'Sleeping mats for family'),

-- Session 5 distributions
(5, 3, 4, 'Formula for 2 children'),
(5, 6, 4, 'Water for 2 people'),
(5, 10, 4, 'Clothing for couple'),
(5, 13, 1, 'Tent for outdoor use'),

-- Previous event distributions (these should work since allocations are depleted)
(6, 14, 4, 'Snack packs for grandmother and grandchild'),
(6, 15, 4, 'Emergency water pouches'),

-- Transfer case distributions
(7, 1, 1, 'Food pack for transferred family'),
(7, 4, 6, 'Water for mother and child'),
(8, 1, 1, 'Food pack for single parent'),
(8, 4, 8, 'Water for parent and child')
ON CONFLICT DO NOTHING;

-- ========================
-- 12. UPDATE OCCUPANCY COUNTS - FIXED: Simple manual update instead of DO block
-- ========================
UPDATE evacuation_centers 
SET current_occupancy = (
    SELECT COUNT(*) 
    FROM attendance_records 
    WHERE attendance_records.center_id = evacuation_centers.center_id 
    AND status = 'checked_in' 
    AND check_out_time IS NULL
);

-- ========================
-- 13. VERIFICATION QUERIES
-- ========================
SELECT 'Data population completed successfully.' as status;

-- Display counts per table
SELECT 'evacuation_centers' as table_name, COUNT(*) as record_count FROM evacuation_centers
UNION ALL SELECT 'events', COUNT(*) FROM events
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'households', COUNT(*) FROM households
UNION ALL SELECT 'individuals', COUNT(*) FROM individuals
UNION ALL SELECT 'event_centers', COUNT(*) FROM event_centers
UNION ALL SELECT 'attendance_records', COUNT(*) FROM attendance_records
UNION ALL SELECT 'allocations', COUNT(*) FROM allocations
UNION ALL SELECT 'distribution_sessions', COUNT(*) FROM distribution_sessions
UNION ALL SELECT 'distributions', COUNT(*) FROM distributions
UNION ALL SELECT 'aid_categories', COUNT(*) FROM aid_categories
ORDER BY table_name;
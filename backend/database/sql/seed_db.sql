-- ========================
-- EFAS Database Sample Data
-- Populates all tables with realistic sample data
-- ========================

-- ========================
-- 1. EVACUATION_CENTERS (must be first due to foreign keys)
-- ========================
INSERT INTO evacuation_centers (center_name, address, coordinates, capacity, status, current_occupancy, photo_data) VALUES
('Northside High School', 'Tomas Cabili Avenue, Iligan City', '(124.245,8.242)', 500, 'active', 0, 'northside_high.jpg'),
('Community Center Main', 'Tibanga Highway, Iligan City', '(124.252,8.235)', 300, 'active', 0, 'community_center.jpg'),
('Riverside Elementary', 'Near Maria Cristina Falls, Iligan City', '(124.255,8.225)', 250, 'active', 0, 'riverside_elem.jpg'),
('Westgate Sports Complex', 'Pala-o, Iligan City', '(124.240,8.228)', 400, 'active', 0, 'westgate_complex.jpg'),
('St. Mary Church Hall', 'Tominobo Proper, Iligan City', '(124.247,8.232)', 200, 'active', 0, 'st_mary_church.jpg'),
('South Park Pavilion', 'San Miguel, Iligan City', '(124.245,8.215)', 150, 'active', 0, 'south_park.jpg'),
('University Arena', 'MSU-Iligan Institute of Technology', '(124.250,8.238)', 600, 'active', 0, 'university_arena.jpg'),
('Downtown Convention Center', 'Poblacion, Iligan City', '(124.249,8.230)', 800, 'active', 0, 'convention_center.jpg'),
('Greenwood Mall', 'Maharlika Village, Iligan City', '(124.238,8.220)', 350, 'inactive', 0, 'greenwood_mall.jpg'),
('Sunrise Hospital Annex', 'Tibanga, Iligan City', '(124.254,8.240)', 450, 'active', 0, 'hospital_annex.jpg')
ON CONFLICT DO NOTHING;

-- ========================
-- 2. EVENTS
-- ========================
INSERT INTO events (event_name, event_type, date_declared, end_date, status, capacity, max_occupancy, usage_percentage) VALUES
('Typhoon Ruby 2024', 'typhoon', '2024-08-15 14:30:00', NULL, 'active', 1200, 0, 0.00),
('River Flood Alert', 'flood', '2024-09-02 08:15:00', '2024-09-10 18:00:00', 'resolved', 800, 0, 0.00),
('Earthquake Response', 'earthquake', '2024-07-20 10:45:00', NULL, 'monitoring', 1500, 0, 0.00),
('Wildfire Evacuation', 'wildfire', '2024-10-05 16:20:00', NULL, 'active', 600, 0, 0.00),
('Monsoon Season Prep', 'monsoon', '2024-06-01 09:00:00', '2024-09-30 17:00:00', 'resolved', 1000, 0, 0.00),
('Urban Flood Watch', 'urban_flood', '2024-11-12 13:10:00', NULL, 'active', 900, 0, 0.00),
('Winter Storm Alert', 'winter_storm', '2024-12-01 07:00:00', NULL, 'active', 700, 0, 0.00),
('Volcano Activity Warning', 'volcano', '2024-05-15 11:30:00', '2024-07-15 12:00:00', 'resolved', 550, 0, 0.00),
('Chemical Spill Emergency', 'chemical', '2024-11-05 09:45:00', NULL, 'active', 400, 0, 0.00),
('Power Grid Failure', 'infrastructure', '2024-10-20 18:30:00', '2024-10-25 10:00:00', 'resolved', 850, 0, 0.00)
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
('westgate.admin@efas.gov', '$2b$10$examplehashwestgate', 'center_admin', 4, TRUE),
('stmary.admin@efas.gov', '$2b$10$examplehashstmary', 'center_admin', 5, TRUE),
('university.admin@efas.gov', '$2b$10$examplehashuniversity', 'center_admin', 7, TRUE),
('convention.admin@efas.gov', '$2b$10$examplehashconvention', 'center_admin', 8, TRUE),
('hospital.admin@efas.gov', '$2b$10$examplehashhospital', 'center_admin', 10, TRUE),
('volunteer.john@efas.gov', '$2b$10$examplehashjohn', 'volunteer', 1, TRUE),
('volunteer.maria@efas.gov', '$2b$10$examplehashmaria', 'volunteer', 2, TRUE),
('volunteer.david@efas.gov', '$2b$10$examplehashdavid', 'volunteer', 3, TRUE),
('volunteer.sarah@efas.gov', '$2b$10$examplehashsarah', 'volunteer', 4, TRUE),
('volunteer.mike@efas.gov', '$2b$10$examplehashmike', 'volunteer', 5, TRUE),
('volunteer.anna@efas.gov', '$2b$10$examplehashanna', 'volunteer', 6, TRUE),
('volunteer.tom@efas.gov', '$2b$10$examplehashtom', 'volunteer', 7, TRUE),
('volunteer.lisa@efas.gov', '$2b$10$examplehashlisa', 'volunteer', 8, TRUE),
('volunteer.james@efas.gov', '$2b$10$examplehashjames', 'volunteer', 9, TRUE),
('volunteer.emily@efas.gov', '$2b$10$examplehashemily', 'volunteer', 10, TRUE)
ON CONFLICT DO NOTHING;

-- ========================
-- 4. HOUSEHOLDS (initially without household_head_id due to circular dependency)
-- ========================
INSERT INTO households (center_id, household_name, address) VALUES
-- Center 1: 4 households
(1, 'Smith Family', '123 Oak Street, North District'),
(1, 'Johnson Family', '456 Pine Avenue, North District'),
(1, 'Wilson Family', '789 Cedar Lane, North District'),
(1, 'Anderson Family', '101 Birch Road, North District'),

-- Center 2: 5 households
(2, 'Garcia Family', '321 Maple Road, Central City'),
(2, 'Chen Family', '654 Birch Lane, Central City'),
(2, 'Kim Family', '987 Elm Court, Central City'),
(2, 'Rodriguez Family', '1111 Walnut Drive, Central City'),
(2, 'Patel Family', '1313 Chestnut Way, Central City'),

-- Center 3: 4 households
(3, 'Williams Family', '111 Spruce Way, East End'),
(3, 'Brown Family', '222 Willow Drive, East End'),
(3, 'Davis Family', '333 Ash Street, East End'),
(3, 'Miller Family', '444 Fir Avenue, East End'),

-- Center 4: 3 households
(4, 'Taylor Family', '555 Poplar Road, Westgate'),
(4, 'Moore Family', '666 Hemlock Lane, Westgate'),
(4, 'Jackson Family', '777 Redwood Street, Westgate'),

-- Center 5: 4 households
(5, 'White Family', '888 Sycamore Court, Old Town'),
(5, 'Harris Family', '999 Magnolia Way, Old Town'),
(5, 'Martin Family', '1010 Dogwood Avenue, Old Town'),
(5, 'Thompson Family', '1111 Cypress Road, Old Town'),

-- Center 6: 5 households
(6, 'Lee Family', '1212 Oakwood Lane, Southside'),
(6, 'Walker Family', '1313 Pinecrest Street, Southside'),
(6, 'Hall Family', '1414 Maplewood Avenue, Southside'),
(6, 'Allen Family', '1515 Cedar Crest, Southside'),
(6, 'Young Family', '1616 Birchwood, Southside'),

-- Center 7: 4 households
(7, 'King Family', '1717 Sprucewood, Campus District'),
(7, 'Wright Family', '1818 Willow Creek, Campus District'),
(7, 'Scott Family', '1919 Ashford, Campus District'),
(7, 'Green Family', '2020 Firwood, Campus District'),

-- Center 8: 3 households
(8, 'Adams Family', '2121 Poplar Grove, Downtown'),
(8, 'Baker Family', '2222 Hemlock Hill, Downtown'),
(8, 'Nelson Family', '2323 Redwood Ridge, Downtown'),

-- Center 9: 4 households
(9, 'Carter Family', '2424 Sycamore Springs, Greenwood'),
(9, 'Mitchell Family', '2525 Magnolia Park, Greenwood'),
(9, 'Perez Family', '2626 Dogwood Valley, Greenwood'),
(9, 'Roberts Family', '2727 Cypress Point, Greenwood'),

-- Center 10: 5 households
(10, 'Turner Family', '2828 Oakridge, Medical Park'),
(10, 'Phillips Family', '2929 Pinehurst, Medical Park'),
(10, 'Campbell Family', '3030 Maplewood, Medical Park'),
(10, 'Parker Family', '3131 Cedarview, Medical Park'),
(10, 'Evans Family', '3232 Birchbrook, Medical Park')
ON CONFLICT DO NOTHING;

-- ========================
-- 5. INDIVIDUALS
-- ========================
INSERT INTO individuals (household_id, first_name, last_name, date_of_birth, gender, relationship_to_head, current_status) VALUES
-- Center 1 Households (4 households, 4 individuals each)
-- Smith Family (Household 1)
(1, 'John', 'Smith', '1978-03-15', 'Male', 'Head', NULL),
(1, 'Mary', 'Smith', '1980-07-22', 'Female', 'Spouse', NULL),
(1, 'Tommy', 'Smith', '2010-11-05', 'Male', 'Child', NULL),
(1, 'Emily', 'Smith', '2013-02-14', 'Female', 'Child', NULL),

-- Johnson Family (Household 2)
(2, 'Robert', 'Johnson', '1965-09-30', 'Male', 'Head', NULL),
(2, 'Lisa', 'Johnson', '1968-12-10', 'Female', 'Spouse', NULL),
(2, 'Michael', 'Johnson', '1995-04-18', 'Male', 'Child', NULL),
(2, 'Sarah', 'Johnson', '1998-07-25', 'Female', 'Child', NULL),

-- Wilson Family (Household 3)
(3, 'David', 'Wilson', '1985-05-12', 'Male', 'Head', NULL),
(3, 'Jennifer', 'Wilson', '1987-08-25', 'Female', 'Spouse', NULL),
(3, 'Sophia', 'Wilson', '2017-03-08', 'Female', 'Child', NULL),
(3, 'Lucas', 'Wilson', '2019-06-15', 'Male', 'Child', NULL),

-- Anderson Family (Household 4)
(4, 'James', 'Anderson', '1972-11-20', 'Male', 'Head', NULL),
(4, 'Patricia', 'Anderson', '1975-04-08', 'Female', 'Spouse', NULL),
(4, 'Matthew', 'Anderson', '2005-09-14', 'Male', 'Child', NULL),
(4, 'Jessica', 'Anderson', '2008-12-03', 'Female', 'Child', NULL),

-- Center 2 Households (5 households, 3-5 individuals each)
-- Garcia Family (Household 5)
(5, 'Carlos', 'Garcia', '1982-06-25', 'Male', 'Head', NULL),
(5, 'Elena', 'Garcia', '1985-08-12', 'Female', 'Spouse', NULL),
(5, 'Mateo', 'Garcia', '2015-07-30', 'Male', 'Child', NULL),
(5, 'Isabella', 'Garcia', '2018-03-22', 'Female', 'Child', NULL),

-- Chen Family (Household 6)
(6, 'Wei', 'Chen', '1975-01-20', 'Male', 'Head', NULL),
(6, 'Mei', 'Chen', '1977-05-15', 'Female', 'Spouse', NULL),
(6, 'Jin', 'Chen', '2008-09-22', 'Male', 'Child', NULL),
(6, 'Ling', 'Chen', '2012-04-17', 'Female', 'Child', NULL),

-- Kim Family (Household 7)
(7, 'Joon', 'Kim', '1988-03-14', 'Male', 'Head', NULL),
(7, 'Min', 'Kim', '1990-11-05', 'Female', 'Spouse', NULL),
(7, 'Ji', 'Kim', '2020-01-15', 'Female', 'Child', NULL),
(7, 'Soo', 'Kim', '2018-07-22', 'Male', 'Child', NULL),

-- Rodriguez Family (Household 8)
(8, 'Miguel', 'Rodriguez', '1979-09-10', 'Male', 'Head', NULL),
(8, 'Carmen', 'Rodriguez', '1981-12-18', 'Female', 'Spouse', NULL),
(8, 'Diego', 'Rodriguez', '2016-05-30', 'Male', 'Child', NULL),

-- Patel Family (Household 9)
(9, 'Raj', 'Patel', '1984-07-04', 'Male', 'Head', NULL),
(9, 'Priya', 'Patel', '1987-02-19', 'Female', 'Spouse', NULL),
(9, 'Aarav', 'Patel', '2019-11-08', 'Male', 'Child', NULL),

-- Center 3 Households (4 households, 4-5 individuals each)
-- Williams Family (Household 10)
(10, 'James', 'Williams', '1988-11-03', 'Male', 'Head', NULL),
(10, 'Sarah', 'Williams', '1990-07-19', 'Female', 'Spouse', NULL),
(10, 'Olivia', 'Williams', '2019-04-12', 'Female', 'Child', NULL),
(10, 'William', 'Williams', '2021-08-25', 'Male', 'Child', NULL),

-- Brown Family (Household 11)
(11, 'Charles', 'Brown', '1960-04-12', 'Male', 'Head', NULL),
(11, 'Barbara', 'Brown', '1963-10-30', 'Female', 'Spouse', NULL),
(11, 'Daniel', 'Brown', '1995-03-17', 'Male', 'Child', NULL),
(11, 'Susan', 'Brown', '1998-06-22', 'Female', 'Child', NULL),

-- Davis Family (Household 12)
(12, 'Thomas', 'Davis', '1972-10-08', 'Male', 'Head', NULL),
(12, 'Jennifer', 'Davis', '1975-12-15', 'Female', 'Spouse', NULL),
(12, 'Michael', 'Davis', '2005-06-30', 'Male', 'Child', NULL),
(12, 'Elizabeth', 'Davis', '2008-09-14', 'Female', 'Child', NULL),
(12, 'David', 'Davis', '2011-11-08', 'Male', 'Child', NULL),

-- Miller Family (Household 13)
(13, 'Richard', 'Miller', '1970-09-18', 'Male', 'Head', NULL),
(13, 'Linda', 'Miller', '1973-12-03', 'Female', 'Spouse', NULL),
(13, 'Joseph', 'Miller', '2003-05-20', 'Male', 'Child', NULL),
(13, 'Karen', 'Miller', '2006-08-12', 'Female', 'Child', NULL),

-- Center 4 Households (3 households, 3-4 individuals each)
-- Taylor Family (Household 14)
(14, 'Mark', 'Taylor', '1983-02-28', 'Male', 'Head', NULL),
(14, 'Amanda', 'Taylor', '1986-07-15', 'Female', 'Spouse', NULL),
(14, 'Christopher', 'Taylor', '2017-10-08', 'Male', 'Child', NULL),

-- Moore Family (Household 15)
(15, 'Donald', 'Moore', '1958-11-22', 'Male', 'Head', NULL),
(15, 'Susan', 'Moore', '1961-04-30', 'Female', 'Spouse', NULL),
(15, 'Brian', 'Moore', '1992-08-08', 'Male', 'Child', NULL),
(15, 'Lisa', 'Moore', '1995-01-14', 'Female', 'Child', NULL),

-- Jackson Family (Household 16)
(16, 'Michelle', 'Jackson', '1980-01-25', 'Female', 'Head', NULL),
(16, 'Kevin', 'Jackson', '2015-06-12', 'Male', 'Child', NULL),
(16, 'Emma', 'Jackson', '2018-09-30', 'Female', 'Child', NULL),

-- Center 5 Households (4 households, 3-5 individuals each)
-- White Family (Household 17)
(17, 'Steven', 'White', '1975-06-18', 'Male', 'Head', NULL),
(17, 'Karen', 'White', '1978-03-22', 'Female', 'Spouse', NULL),
(17, 'Joshua', 'White', '2009-11-05', 'Male', 'Child', NULL),
(17, 'Ashley', 'White', '2012-02-14', 'Female', 'Child', NULL),

-- Harris Family (Household 18)
(18, 'Paul', 'Harris', '1968-09-14', 'Male', 'Head', NULL),
(18, 'Nancy', 'Harris', '1971-12-20', 'Female', 'Spouse', NULL),
(18, 'Timothy', 'Harris', '2001-07-08', 'Male', 'Child', NULL),

-- Martin Family (Household 19)
(19, 'Jessica', 'Martin', '1990-12-05', 'Female', 'Head', NULL),
(19, 'Anthony', 'Martin', '2022-03-18', 'Male', 'Child', NULL),
(19, 'Megan', 'Martin', '2024-06-25', 'Female', 'Child', NULL),

-- Thompson Family (Household 20)
(20, 'George', 'Thompson', '1945-07-20', 'Male', 'Head', NULL),
(20, 'Margaret', 'Thompson', '1948-10-12', 'Female', 'Spouse', NULL),
(20, 'Edward', 'Thompson', '1972-03-05', 'Male', 'Child', NULL),
(20, 'Rebecca', 'Thompson', '1975-05-18', 'Female', 'Child', NULL),

-- Center 6 Households (5 households, 3-4 individuals each)
-- Lee Family (Household 21)
(21, 'Andrew', 'Lee', '1989-05-30', 'Male', 'Head', NULL),
(21, 'Grace', 'Lee', '1992-10-12', 'Female', 'Spouse', NULL),
(21, 'Ethan', 'Lee', '2020-04-15', 'Male', 'Child', NULL),

-- Walker Family (Household 22)
(22, 'Kenneth', 'Walker', '1978-08-22', 'Male', 'Head', NULL),
(22, 'Sandra', 'Walker', '1980-11-08', 'Female', 'Spouse', NULL),
(22, 'Jason', 'Walker', '2014-09-20', 'Male', 'Child', NULL),
(22, 'Amy', 'Walker', '2017-12-03', 'Female', 'Child', NULL),

-- Hall Family (Household 23)
(23, 'Gary', 'Hall', '1965-03-30', 'Male', 'Head', NULL),
(23, 'Donna', 'Hall', '1968-06-15', 'Female', 'Spouse', NULL),
(23, 'Eric', 'Hall', '1998-01-10', 'Male', 'Child', NULL),

-- Allen Family (Household 24)
(24, 'Kevin', 'Allen', '1982-12-18', 'Male', 'Head', NULL),
(24, 'Melissa', 'Allen', '1985-04-25', 'Female', 'Spouse', NULL),
(24, 'Ryan', 'Allen', '2016-07-08', 'Male', 'Child', NULL),
(24, 'Lauren', 'Allen', '2019-10-22', 'Female', 'Child', NULL),

-- Young Family (Household 25)
(25, 'Brian', 'Young', '1975-02-14', 'Male', 'Head', NULL),
(25, 'Kimberly', 'Young', '1977-09-08', 'Female', 'Spouse', NULL),
(25, 'Jacob', 'Young', '2011-05-30', 'Male', 'Child', NULL),

-- Center 7 Households (4 households, 3-5 individuals each)
-- King Family (Household 26)
(26, 'Joshua', 'King', '1980-07-22', 'Male', 'Head', NULL),
(26, 'Amanda', 'King', '1983-10-15', 'Female', 'Spouse', NULL),
(26, 'Nicholas', 'King', '2018-03-08', 'Male', 'Child', NULL),
(26, 'Hannah', 'King', '2020-06-12', 'Female', 'Child', NULL),

-- Wright Family (Household 27)
(27, 'Jonathan', 'Wright', '1972-05-18', 'Male', 'Head', NULL),
(27, 'Stephanie', 'Wright', '1975-08-03', 'Female', 'Spouse', NULL),
(27, 'Tyler', 'Wright', '2007-12-20', 'Male', 'Child', NULL),
(27, 'Brittany', 'Wright', '2010-04-14', 'Female', 'Child', NULL),
(27, 'Zachary', 'Wright', '2013-09-08', 'Male', 'Child', NULL),

-- Scott Family (Household 28)
(28, 'Brandon', 'Scott', '1985-11-30', 'Male', 'Head', NULL),
(28, 'Heather', 'Scott', '1988-02-25', 'Female', 'Spouse', NULL),
(28, 'Nathan', 'Scott', '2022-07-18', 'Male', 'Child', NULL),

-- Green Family (Household 29)
(29, 'Samuel', 'Green', '1970-04-12', 'Male', 'Head', NULL),
(29, 'Victoria', 'Green', '1973-07-08', 'Female', 'Spouse', NULL),
(29, 'Justin', 'Green', '2004-10-22', 'Male', 'Child', NULL),
(29, 'Molly', 'Green', '2006-01-15', 'Female', 'Child', NULL),

-- Center 8 Households (3 households, 4-5 individuals each)
-- Adams Family (Household 30)
(30, 'Benjamin', 'Adams', '1968-09-22', 'Male', 'Head', NULL),
(30, 'Megan', 'Adams', '1971-12-15', 'Female', 'Spouse', NULL),
(30, 'Alexander', 'Adams', '1999-05-08', 'Male', 'Child', NULL),
(30, 'Madison', 'Adams', '2002-08-12', 'Female', 'Child', NULL),

-- Baker Family (Household 31)
(31, 'Christian', 'Baker', '1975-03-18', 'Male', 'Head', NULL),
(31, 'Rachel', 'Baker', '1977-06-25', 'Female', 'Spouse', NULL),
(31, 'Austin', 'Baker', '2013-11-08', 'Male', 'Child', NULL),
(31, 'Abigail', 'Baker', '2016-02-22', 'Female', 'Child', NULL),
(31, 'Caleb', 'Baker', '2019-07-15', 'Male', 'Child', NULL),

-- Nelson Family (Household 32)
(32, 'Dylan', 'Nelson', '1982-10-30', 'Male', 'Head', NULL),
(32, 'Olivia', 'Nelson', '1985-01-25', 'Female', 'Spouse', NULL),
(32, 'Evan', 'Nelson', '2021-04-18', 'Male', 'Child', NULL),
(32, 'Chloe', 'Nelson', '2023-08-12', 'Female', 'Child', NULL),

-- Center 9 Households (4 households, 3-4 individuals each)
-- Carter Family (Household 33)
(33, 'Noah', 'Carter', '1978-07-14', 'Male', 'Head', NULL),
(33, 'Isabella', 'Carter', '1980-10-08', 'Female', 'Spouse', NULL),
(33, 'Landon', 'Carter', '2015-03-22', 'Male', 'Child', NULL),

-- Mitchell Family (Household 34)
(34, 'Liam', 'Mitchell', '1984-12-20', 'Male', 'Head', NULL),
(34, 'Ava', 'Mitchell', '1987-03-15', 'Female', 'Spouse', NULL),
(34, 'Mason', 'Mitchell', '2019-08-08', 'Male', 'Child', NULL),
(34, 'Harper', 'Mitchell', '2022-11-02', 'Female', 'Child', NULL),

-- Perez Family (Household 35)
(35, 'Ethan', 'Perez', '1979-05-08', 'Male', 'Head', NULL),
(35, 'Mia', 'Perez', '1982-08-03', 'Female', 'Spouse', NULL),
(35, 'Sebastian', 'Perez', '2017-01-25', 'Male', 'Child', NULL),

-- Roberts Family (Household 36)
(36, 'Logan', 'Roberts', '1965-11-12', 'Male', 'Head', NULL),
(36, 'Charlotte', 'Roberts', '1968-02-08', 'Female', 'Spouse', NULL),
(36, 'Jack', 'Roberts', '1998-07-22', 'Male', 'Child', NULL),
(36, 'Lily', 'Roberts', '2001-10-15', 'Female', 'Child', NULL),

-- Center 10 Households (5 households, 3-5 individuals each)
-- Turner Family (Household 37)
(37, 'Aiden', 'Turner', '1981-04-18', 'Male', 'Head', NULL),
(37, 'Ella', 'Turner', '1983-07-12', 'Female', 'Spouse', NULL),
(37, 'Jackson', 'Turner', '2020-12-05', 'Male', 'Child', NULL),
(37, 'Aria', 'Turner', '2023-03-30', 'Female', 'Child', NULL),

-- Phillips Family (Household 38)
(38, 'Cameron', 'Phillips', '1976-09-25', 'Male', 'Head', NULL),
(38, 'Scarlett', 'Phillips', '1979-12-20', 'Female', 'Spouse', NULL),
(38, 'Luke', 'Phillips', '2012-05-14', 'Male', 'Child', NULL),
(38, 'Penelope', 'Phillips', '2014-08-08', 'Female', 'Child', NULL),

-- Campbell Family (Household 39)
(39, 'Henry', 'Campbell', '1970-02-28', 'Male', 'Head', NULL),
(39, 'Zoe', 'Campbell', '1973-05-22', 'Female', 'Spouse', NULL),
(39, 'Grayson', 'Campbell', '2009-10-15', 'Male', 'Child', NULL),

-- Parker Family (Household 40)
(40, 'Wyatt', 'Parker', '1986-07-03', 'Male', 'Head', NULL),
(40, 'Riley', 'Parker', '1989-09-28', 'Female', 'Spouse', NULL),
(40, 'Leo', 'Parker', '2021-02-20', 'Male', 'Child', NULL),
(40, 'Nora', 'Parker', '2024-05-15', 'Female', 'Child', NULL),

-- Evans Family (Household 41)
(41, 'Gabriel', 'Evans', '1974-12-08', 'Male', 'Head', NULL),
(41, 'Hazel', 'Evans', '1977-03-03', 'Female', 'Spouse', NULL),
(41, 'Owen', 'Evans', '2011-08-25', 'Male', 'Child', NULL),
(41, 'Ellie', 'Evans', '2013-11-18', 'Female', 'Child', NULL),
(41, 'Levi', 'Evans', '2016-02-12', 'Male', 'Child', NULL)
ON CONFLICT DO NOTHING;

-- ========================
-- 6. UPDATE HOUSEHOLDS with household_head_id (resolving circular dependency)
-- ========================
UPDATE households SET household_head_id = 1 WHERE household_id = 1;
UPDATE households SET household_head_id = 5 WHERE household_id = 2;
UPDATE households SET household_head_id = 8 WHERE household_id = 3;
UPDATE households SET household_head_id = 11 WHERE household_id = 4;
UPDATE households SET household_head_id = 14 WHERE household_id = 5;
UPDATE households SET household_head_id = 17 WHERE household_id = 6;
UPDATE households SET household_head_id = 20 WHERE household_id = 7;
UPDATE households SET household_head_id = 22 WHERE household_id = 8;
UPDATE households SET household_head_id = 24 WHERE household_id = 9;
UPDATE households SET household_head_id = 26 WHERE household_id = 10;
UPDATE households SET household_head_id = 28 WHERE household_id = 11;
UPDATE households SET household_head_id = 30 WHERE household_id = 12;
UPDATE households SET household_head_id = 32 WHERE household_id = 13;
UPDATE households SET household_head_id = 33 WHERE household_id = 14;
UPDATE households SET household_head_id = 35 WHERE household_id = 15;
UPDATE households SET household_head_id = 37 WHERE household_id = 16;
UPDATE households SET household_head_id = 38 WHERE household_id = 17;
UPDATE households SET household_head_id = 39 WHERE household_id = 18;
UPDATE households SET household_head_id = 40 WHERE household_id = 19;
UPDATE households SET household_head_id = 41 WHERE household_id = 20;
UPDATE households SET household_head_id = 43 WHERE household_id = 4 AND household_head_id = 11;
UPDATE households SET household_head_id = 50 WHERE household_id = 8 AND household_head_id = 22;
UPDATE households SET household_head_id = 53 WHERE household_id = 10 AND household_head_id = 26;
UPDATE households SET household_head_id = 56 WHERE household_id = 12 AND household_head_id = 30;
UPDATE households SET household_head_id = 59 WHERE household_id = 15 AND household_head_id = 35;

-- ========================
-- 7. EVENT_CENTERS (junction table)
-- ========================
INSERT INTO event_centers (event_id, center_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4),  -- Typhoon Ruby affects multiple centers
(2, 2), (2, 3), (2, 6),          -- River Flood affects riverside and southside
(3, 1), (3, 4), (3, 5), (3, 7),  -- Earthquake affects various centers
(4, 4), (4, 5), (4, 9),          -- Wildfire affects westgate, old town, greenwood
(5, 1), (5, 2), (5, 3), (5, 4), (5, 5), (5, 6),  -- Monsoon affects all major centers
(6, 2), (6, 3), (6, 8),          -- Urban Flood affects city centers
(7, 1), (7, 3), (7, 5), (7, 7),  -- Winter Storm affects northern and campus areas
(8, 4), (8, 5),                  -- Volcano warning affects specific zones
(9, 10),                         -- Chemical spill near hospital
(10, 1), (10, 2), (10, 8)        -- Power failure affects key infrastructure
ON CONFLICT DO NOTHING;

-- ========================
-- 8. ATTENDANCE_RECORDS
-- ========================
INSERT INTO attendance_records (individual_id, center_id, event_id, household_id, status, check_in_time, recorded_by_user_id, check_out_time, transfer_from_center_id, transfer_to_center_id, transfer_time, notes) VALUES
-- Current check-ins for Typhoon Ruby at Northside High School
(1, 1, 1, 1, 'checked_in', '2024-08-15 16:30:00', 3, NULL, NULL, NULL, NULL, 'Family of 4 arrived together'),
(2, 1, 1, 1, 'checked_in', '2024-08-15 16:30:00', 3, NULL, NULL, NULL, NULL, NULL),
(3, 1, 1, 1, 'checked_in', '2024-08-15 16:30:00', 3, NULL, NULL, NULL, NULL, NULL),
(4, 1, 1, 1, 'checked_in', '2024-08-15 16:30:00', 3, NULL, NULL, NULL, NULL, NULL),
(5, 1, 1, 2, 'checked_in', '2024-08-15 17:15:00', 3, NULL, NULL, NULL, NULL, 'Elderly couple'),
(6, 1, 1, 2, 'checked_in', '2024-08-15 17:15:00', 3, NULL, NULL, NULL, NULL, NULL),
(43, 1, 1, 1, 'checked_in', '2024-08-16 09:15:00', 3, NULL, NULL, NULL, NULL, 'Grandparents arrived separately'),
(44, 1, 1, 1, 'checked_in', '2024-08-16 09:15:00', 3, NULL, NULL, NULL, NULL, NULL),
(45, 1, 1, 2, 'checked_in', '2024-08-15 19:30:00', 3, NULL, NULL, NULL, NULL, 'College student returned home'),
(46, 2, 1, 4, 'checked_in', '2024-08-15 18:45:00', 4, NULL, NULL, NULL, NULL, 'Toddler with parents'),
(47, 2, 1, 5, 'checked_in', '2024-08-16 10:00:00', 4, NULL, NULL, NULL, NULL, 'School-aged child'),
(48, 3, 1, 6, 'checked_in', '2024-08-15 21:15:00', 5, NULL, NULL, NULL, NULL, 'Infant with family'),
(49, 3, 1, 7, 'checked_in', '2024-08-16 08:30:00', 5, NULL, NULL, NULL, NULL, 'Newborn baby'),

-- Check-ins at Community Center
(11, 2, 1, 4, 'checked_in', '2024-08-15 15:45:00', 4, NULL, NULL, NULL, NULL, 'Young family with infant'),
(12, 2, 1, 4, 'checked_in', '2024-08-15 15:45:00', 4, NULL, NULL, NULL, NULL, NULL),
(13, 2, 1, 4, 'checked_in', '2024-08-15 15:45:00', 4, NULL, NULL, NULL, NULL, NULL),
(14, 2, 1, 5, 'checked_in', '2024-08-15 16:20:00', 4, NULL, NULL, NULL, NULL, 'Non-English speaking'),
(15, 2, 1, 5, 'checked_in', '2024-08-15 16:20:00', 4, NULL, NULL, NULL, NULL, NULL),
(16, 2, 1, 5, 'checked_in', '2024-08-15 16:20:00', 4, NULL, NULL, NULL, NULL, NULL),
(50, 2, 1, 4, 'checked_in', '2024-08-16 11:20:00', 4, NULL, NULL, NULL, NULL, 'New arrival - Rodriguez family'),
(51, 2, 1, 4, 'checked_in', '2024-08-16 11:20:00', 4, NULL, NULL, NULL, NULL, NULL),
(52, 2, 1, 4, 'checked_in', '2024-08-16 11:20:00', 4, NULL, NULL, NULL, NULL, NULL),

-- Check-ins for Winter Storm
(53, 1, 7, 10, 'checked_in', '2024-12-03 14:00:00', 3, NULL, NULL, NULL, NULL, 'Young family - Nguyen'),
(54, 1, 7, 10, 'checked_in', '2024-12-03 14:00:00', 3, NULL, NULL, NULL, NULL, NULL),
(55, 1, 7, 10, 'checked_in', '2024-12-03 14:00:00', 3, NULL, NULL, NULL, NULL, NULL),


-- Check-ins for Urban Flood
(56, 2, 6, 12, 'checked_in', '2024-11-13 16:45:00', 4, NULL, NULL, NULL, NULL, 'Clark family - basement flooded'),
(57, 2, 6, 12, 'checked_in', '2024-11-13 16:45:00', 4, NULL, NULL, NULL, NULL, NULL),
(58, 2, 6, 12, 'checked_in', '2024-11-13 16:45:00', 4, NULL, NULL, NULL, NULL, NULL),

-- Check-ins at University Arena for Earthquake
(59, 7, 3, 15, 'checked_in', '2024-07-21 09:30:00', 8, NULL, NULL, NULL, NULL, 'Lewis family - structural damage'),
(60, 7, 3, 15, 'checked_in', '2024-07-21 09:30:00', 8, NULL, NULL, NULL, NULL, NULL),

-- Check-ins at Riverside Elementary
(20, 3, 1, 7, 'checked_in', '2024-08-15 14:50:00', 5, NULL, NULL, NULL, NULL, 'Working couple'),
(21, 3, 1, 7, 'checked_in', '2024-08-15 14:50:00', 5, NULL, NULL, NULL, NULL, NULL),

-- Winter Storm check-ins
(35, 1, 7, 15, 'checked_in', '2024-12-02 09:30:00', 3, NULL, NULL, NULL, NULL, 'Lost power at home'),
(36, 1, 7, 15, 'checked_in', '2024-12-02 09:30:00', 3, NULL, NULL, NULL, NULL, NULL),

-- Chemical spill emergency (hospital annex)
(39, 10, 9, 18, 'checked_in', '2024-11-05 11:00:00', 10, NULL, NULL, NULL, NULL, 'Elderly with respiratory issues'),
(41, 10, 9, 20, 'checked_in', '2024-11-05 11:30:00', 10, NULL, NULL, NULL, NULL, 'Pregnant woman'),
(42, 10, 9, 20, 'checked_in', '2024-11-05 11:30:00', 10, NULL, NULL, NULL, NULL, NULL),

-- Completed check-outs from previous events
(22, 2, 2, 8, 'checked_out', '2024-09-02 10:30:00', 4, '2024-09-08 14:00:00', NULL, NULL, NULL, 'Returned home after flood warning lifted'),
(23, 2, 2, 8, 'checked_out', '2024-09-02 10:30:00', 4, '2024-09-08 14:00:00', NULL, NULL, NULL, NULL),
(28, 4, 4, 10, 'checked_out', '2024-10-06 08:15:00', 6, '2024-10-12 16:30:00', NULL, NULL, NULL, 'Wildfire evacuation ended'),
(29, 4, 4, 10, 'checked_out', '2024-10-06 08:15:00', 6, '2024-10-12 16:30:00', NULL, NULL, NULL, NULL),

-- Transfers between centers
(24, 4, 3, 9, 'transferred', NULL, 6, NULL, 4, 5, '2024-07-21 11:20:00', 'Transferred due to overcrowding'),
(31, 5, 8, 12, 'transferred', NULL, 7, NULL, 5, 1, '2024-05-16 14:45:00', 'Volcano evacuation zone expanded'),
(37, 8, 10, 16, 'transferred', NULL, 9, NULL, 8, 2, '2024-10-21 19:30:00', 'Power failure at convention center'),
(38, 9, 4, 17, 'transferred', NULL, 10, NULL, 9, 10, '2024-10-07 10:15:00', 'Smoke inhalation concerns'),
(26, 5, 3, 10, 'transferred', NULL, 7, NULL, 5, 1, '2024-07-22 13:15:00', 'Medical needs - transferred to hospital center'),
(29, 1, 4, 11, 'transferred', NULL, 3, NULL, 1, 4, '2024-10-08 11:30:00', 'Reunited with extended family'),

-- Check-outs
(23, 2, 2, 8, 'checked_out', '2024-09-03 08:00:00', 4, '2024-09-09 10:00:00', NULL, NULL, NULL, 'Additional family members arrived later'),
(24, 3, 3, 9, 'checked_out', '2024-07-25 14:00:00', 5, '2024-07-30 16:00:00', NULL, NULL, NULL, 'Building inspection cleared')
ON CONFLICT DO NOTHING;

-- ========================
-- UPDATE EVENTS max_occupancy and usage_percentage BASED ON ATTENDANCE
-- ========================
WITH occupancy_data AS (
    SELECT 
        event_id,
        COUNT(*) as current_occupancy
    FROM attendance_records 
    WHERE status = 'checked_in' 
      AND check_out_time IS NULL
    GROUP BY event_id
)
UPDATE events e
SET 
    max_occupancy = COALESCE(od.current_occupancy, 0),
    usage_percentage = CASE 
        WHEN e.capacity > 0 THEN 
            ROUND((COALESCE(od.current_occupancy, 0) * 100.0 / e.capacity), 2)
        ELSE 0.00
    END
FROM occupancy_data od
WHERE e.event_id = od.event_id;

-- For events with no current occupancy
UPDATE events 
SET 
    max_occupancy = 0,
    usage_percentage = 0.00
WHERE event_id NOT IN (
    SELECT DISTINCT event_id 
    FROM attendance_records 
    WHERE status = 'checked_in' 
      AND check_out_time IS NULL
);

-- ========================
-- 9. ALLOCATIONS
-- ========================
INSERT INTO allocations (category_id, center_id, event_id, resource_name, description, total_quantity, remaining_quantity, distribution_type, suggested_amount, status, allocated_by_user_id, notes) VALUES
-- Food allocations (category 1)
(1, 1, 1, 'Emergency Food Packs', '7-day supply for family of 4', 200, 185, 'per_household', 1, 'active', 2, 'High priority for families'),
(1, 1, 7, 'Winter Meal Kits', 'Hot meals and thermoses', 150, 145, 'per_individual', 2, 'active', 2, 'Cold weather provisions'),
(1, 2, 1, 'Ready-to-Eat Meals', 'Individual meal packs', 1000, 920, 'per_individual', 3, 'active', 2, 'Daily distribution'),
(1, 2, 6, 'Urban Flood Rations', 'Non-perishable food items', 800, 780, 'per_household', 1, 'active', 2, 'Extended stay provisions'),
(1, 3, 1, 'Infant Formula', 'Specialized nutrition for infants', 100, 95, 'per_individual', 2, 'active', 2, 'Limited supply'),
(1, 4, 4, 'Wildfire Emergency Food', 'Smoke-safe packaged meals', 300, 290, 'per_individual', 3, 'active', 2, 'Special packaging required'),
(1, 10, 9, 'Medical Diet Packs', 'Special diets for hospital patients', 120, 115, 'per_individual', 1, 'active', 2, 'Coordinated with medical staff'),

-- Water allocations (category 2)
(2, 1, 1, 'Bottled Water', '500ml bottles', 2000, 1800, 'per_individual', 4, 'active', 2, 'Daily hydration needs'),
(2, 1, 7, 'Hot Water Containers', 'Insulated containers for winter', 100, 95, 'per_household', 1, 'active', 2, 'Cold weather essential'),
(2, 2, 1, 'Water Containers', '5-gallon water containers', 200, 175, 'per_household', 1, 'active', 2, 'For cooking and cleaning'),
(2, 3, 1, 'Emergency Water Pouches', '250ml emergency pouches', 1500, 1450, 'per_individual', 2, 'active', 2, 'Quick distribution'),
(2, 10, 9, 'Sterile Water', 'Medical-grade sterile water', 500, 480, 'per_individual', 1, 'active', 2, 'For medical use only'),

-- Medical allocations (category 3)
(3, 1, 1, 'First Aid Kits', 'Basic medical supplies', 100, 90, 'per_household', 1, 'active', 2, 'Restock needed weekly'),
(3, 3, 1, 'Prescription Meds', 'Common chronic condition medications', 400, 380, 'per_individual', 1, 'active', 2, 'Medical supervision required'),
(3, 10, 9, 'Chemical Exposure Kits', 'Specialized for chemical incidents', 50, 48, 'per_individual', 1, 'active', 2, 'Trained staff only'),
(3, 10, 9, 'Respiratory Masks', 'N95 and specialized masks', 300, 285, 'per_individual', 2, 'active', 2, 'Critical for chemical spill'),
(3, 7, 3, 'Earthquake Trauma Kits', 'Emergency trauma supplies', 80, 75, 'per_household', 5, 'active', 2, 'Station supplies'),

-- Hygiene allocations (category 4)
(4, 1, 1, 'Hygiene Kits', 'Soap, toothpaste, sanitary items', 300, 280, 'per_household', 1, 'active', 2, 'Basic hygiene needs'),
(4, 2, 1, 'Sanitary Pads', 'Feminine hygiene products', 600, 550, 'per_individual', 5, 'active', 2, 'Essential item'),
(4, 10, 9, 'Decontamination Kits', 'Chemical decontamination supplies', 100, 95, 'per_individual', 1, 'active', 2, 'Emergency use only'),
(4, 4, 4, 'Ash Cleanup Kits', 'For wildfire ash cleanup', 200, 190, 'per_household', 1, 'active', 2, 'Post-evacuation use'),

-- Clothing allocations (category 5)
(5, 1, 1, 'Blankets', 'Emergency thermal blankets', 400, 350, 'per_household', 2, 'active', 2, 'Various sizes available'),
(5, 1, 7, 'Winter Clothing Sets', 'Coats, gloves, hats', 200, 190, 'per_individual', 1, 'active', 2, 'Cold weather essential'),
(5, 3, 1, 'Clothing Sets', 'Basic clothing items', 200, 180, 'per_individual', 2, 'active', 2, 'Various sizes'),
(5, 10, 9, 'Protective Clothing', 'Chemical-resistant clothing', 80, 75, 'per_individual', 1, 'active', 2, 'Staff use only'),

-- Shelter allocations (category 6)
(6, 1, 1, 'Tents', 'Family-sized tents', 60, 55, 'per_household', 1, 'active', 2, 'For outdoor use when crowded'),
(6, 2, 1, 'Sleeping Mats', 'Foam sleeping mats', 300, 280, 'per_individual', 1, 'active', 2, 'Basic comfort'),
(6, 4, 4, 'Air Purifiers', 'HEPA filters for smoke', 40, 38, 'per_household', 2, 'active', 2, 'Wildfire smoke protection'),
(6, 7, 3, 'Emergency Shelter Kits', 'Post-earthquake shelter', 100, 95, 'per_household', 1, 'active', 2, 'Temporary structures'),

-- Other allocations (category 7)
(7, 1, 1, 'Phone Chargers', 'USB chargers and power banks', 150, 140, 'per_household', 1, 'active', 2, 'Communication essential'),
(7, 1, 7, 'Emergency Radios', 'Battery-powered weather radios', 50, 48, 'per_household', 10, 'active', 2, 'Information dissemination'),
(7, 10, 9, 'Communication Devices', 'Emergency communication', 30, 28, 'per_individual', 1, 'active', 2, 'Staff coordination'),

-- Depleted allocations (for previous events)
(1, 1, 2, 'Snack Packs', 'Energy bars and snacks', 200, 10, 'per_individual', 2, 'depleted', 2, 'Fully distributed during flood'),
(2, 2, 2, 'Emergency Water', '250ml emergency pouches', 500, 10, 'per_individual', 2, 'depleted', 2, 'Event completed'),
(3, 5, 8, 'Volcano Respiratory Kits', 'Ash protection masks', 150, 10, 'per_individual', 1, 'depleted', 2, 'Volcano event resolved'),
(6, 4, 5, 'Monsoon Tarps', 'Waterproof tarpaulins', 100, 10, 'per_household', 1, 'depleted', 2, 'Monsoon season ended')
ON CONFLICT DO NOTHING;

-- ========================
-- 10. DISTRIBUTION_SESSIONS
-- ========================
INSERT INTO distribution_sessions (household_id, distributed_by_user_id, center_id, event_id, session_notes) VALUES
(1, 11, 1, 1, 'Initial allocation for family of 4 - typhoon response'),
(2, 11, 1, 1, 'Elderly couple with specific dietary needs'),
(4, 12, 2, 1, 'Family with infant - formula provided'),
(5, 12, 2, 1, 'Non-English speaking family - translator assisted'),
(7, 13, 3, 1, 'Working professional couple - quick distribution'),
(8, 12, 2, 2, 'Completed distribution from previous flood event'),
(9, 14, 4, 3, 'Transfer case from overcrowded center'),
(10, 14, 4, 4, 'Wildfire evacuation supplies'),
(12, 15, 5, 8, 'Volcano evacuation - elderly couple'),
(15, 16, 1, 7, 'Winter storm emergency - lost power'),
(18, 20, 10, 9, 'Chemical spill - elderly with respiratory issues'),
(20, 20, 10, 9, 'Chemical spill - pregnant woman prioritized'),
(16, 18, 8, 10, 'Power failure transfer case'),
(17, 19, 9, 4, 'Wildfire smoke inhalation case'),
(3, 11, 1, 1, 'New family arrival - late check-in'),
(6, 12, 2, 6, 'Urban flood preparation'),
(11, 14, 4, 4, 'Wildfire zone family'),
(13, 15, 5, 1, 'Single individual - basic needs'),
(14, 16, 6, 2, 'Previous flood victim - follow-up'),
(19, 20, 10, 9, 'Chemical spill zone resident'),
(1, 11, 1, 1, 'Additional supplies for grandparents'),
(1, 11, 1, 1, 'Follow-up distribution for extended stay'),
(2, 11, 1, 1, 'College student additional needs'),
(2, 11, 1, 7, 'Winter supplies for elderly couple'),
(3, 11, 1, 1, 'Wilson family supplementary distribution'),
(4, 12, 2, 1, 'Rodriguez family initial allocation'),
(4, 12, 2, 1, 'Infant care package'),
(4, 12, 2, 1, 'Daily meal refresh'),
(5, 12, 2, 1, 'Chen family school supplies'),
(5, 12, 2, 1, 'Additional translation assistance'),
(6, 13, 3, 1, 'Kim family infant formula'),
(6, 13, 3, 1, 'Family clothing needs'),
(7, 13, 3, 1, 'Williams family newborn supplies'),
(7, 13, 3, 1, 'Parental support package'),
(8, 12, 2, 2, 'Wilson family flood recovery'),
(8, 12, 2, 6, 'Urban flood preparation kit'),
(9, 14, 4, 3, 'Davis family earthquake supplies'),
(9, 14, 4, 3, 'Structural damage support'),
(10, 14, 4, 4, 'Nguyen family wildfire evacuation'),
(10, 14, 1, 7, 'Winter storm relocation package'),
(11, 14, 4, 4, 'Taylor family wildfire zone'),
(11, 14, 4, 4, 'Air quality management'),
(12, 15, 5, 8, 'Clark family volcano preparation'),
(12, 15, 2, 6, 'Urban flood response'),
(13, 15, 5, 1, 'Thomas single individual support'),
(13, 15, 5, 1, 'Daily meal service'),
(14, 16, 6, 2, 'Jackson family flood follow-up'),
(14, 16, 6, 2, 'Child care supplies'),
(15, 16, 1, 7, 'Lewis family winter emergency'),
(15, 16, 7, 3, 'Earthquake displacement kit'),
(16, 18, 8, 10, 'Harris family power failure'),
(16, 18, 2, 6, 'Urban flood contingency'),
(17, 19, 9, 4, 'Martin family wildfire smoke'),
(17, 19, 10, 9, 'Chemical spill relocation'),
(18, 20, 10, 9, 'Thompson medical resupply'),
(18, 20, 10, 9, 'Daily medication distribution'),
(19, 20, 10, 9, 'Moore family chemical zone'),
(19, 20, 10, 9, 'Protective equipment refresh'),
(20, 20, 10, 9, 'Lee family prenatal care'),
(20, 20, 10, 9, 'Daily nutritional support'),
(4, 12, 2, 1, 'Weekly supply refresh'),
(5, 12, 2, 1, 'Cultural specific items'),
(6, 13, 3, 1, 'Pediatric care package'),
(7, 13, 3, 1, 'New parent support'),
(10, 14, 1, 7, 'Cold weather infant care'),
(12, 15, 2, 6, 'Teenager specific needs'),
(15, 16, 7, 3, 'Professional couple support'),
(18, 20, 10, 9, 'Elderly care package'),
(19, 20, 10, 9, 'Senior citizen support'),
(20, 20, 10, 9, 'Maternity support package')
ON CONFLICT DO NOTHING;

-- ========================
-- 11. DISTRIBUTIONS
-- ========================
INSERT INTO distributions (session_id, allocation_id, quantity_distributed, distribution_notes, status) VALUES
-- Session 1 distributions (Smith Family)
(1, 1, 1, '7-day food pack for family of 4', 'completed'),
(1, 8, 16, '4 water bottles per person x 4 people', 'completed'),
(1, 15, 1, 'Family first aid kit', 'completed'),
(1, 18, 1, 'Household hygiene kit', 'completed'),
(1, 23, 2, 'Two blankets for family', 'completed'),
(1, 28, 1, 'Phone charger for communication', 'completed'),

-- Session 2 distributions (Johnson Family)
(2, 1, 1, '7-day food pack for elderly couple', 'completed'),
(2, 8, 8, '4 water bottles per person x 2 people', 'completed'),
(2, 15, 1, 'First aid kit with extra meds', 'completed'),
(2, 18, 1, 'Hygiene kit with senior products', 'completed'),
(2, 23, 3, 'Extra blanket requested for warmth', 'completed'),

-- Session 3 distributions (Garcia Family)
(3, 3, 9, '3 meals x 3 people', 'completed'),
(3, 10, 1, '5-gallon water container', 'completed'),
(3, 19, 10, 'Sanitary pads for mother', 'completed'),
(3, 24, 1, 'Sleeping mat', 'completed'),
(3, 5, 2, 'Infant formula supply', 'completed'),

-- Session 4 distributions (Chen Family)
(4, 3, 9, '3 meals x 3 people', 'completed'),
(4, 10, 1, 'Water container', 'completed'),
(4, 19, 15, 'Sanitary pads for non-English speaking mother', 'completed'),
(4, 18, 1, 'Hygiene kit with translation cards', 'completed'),
(4, 24, 3, 'Sleeping mats for family', 'completed'),

-- Session 5 distributions (Williams Family)
(5, 5, 4, 'Formula for children','completed'),
(5, 11, 4, 'Water pouches for 2 people', 'completed'),
(5, 25, 4, 'Clothing for couple', 'completed'),
(5, 26, 1, 'Tent for privacy', 'completed'),

-- Session 15 distributions (Winter Storm - White Family)
(15, 2, 4, 'Winter meal kits for 2 people', 'completed'),
(15, 9, 1, 'Hot water container', 'completed'),
(15, 24, 2, 'Winter clothing sets', 'completed'),
(15, 29, 1, 'Emergency radio', 'completed'),

-- Session 11 distributions (Chemical Spill - Thompson)
(11, 7, 1, 'Medical diet pack','completed'),
(11, 12, 1, 'Sterile water', 'completed'),
(11, 13, 1, 'Chemical exposure kit', 'completed'),
(11, 14, 2, 'Respiratory masks', 'completed'),
(11, 27, 1, 'Protective clothing', 'completed'),

-- Session 12 distributions (Chemical Spill - Lee Family)
(12, 7, 2, 'Medical diet packs for pregnant woman', 'completed'),
(12, 12, 2, 'Sterile water', 'completed'),
(12, 13, 1, 'Chemical exposure kit', 'completed'),
(12, 14, 2, 'Respiratory masks', 'completed'),
(12, 18, 1, 'Decontamination kit', 'completed'),

-- Previous event distributions
(6, 31, 4, 'Snack packs for grandmother and grandchild','completed'),
(6, 32, 4, 'Emergency water pouches', 'completed'),

-- Wildfire distributions
(10, 6, 6, 'Wildfire emergency meals', 'completed'),
(10, 21, 1, 'Ash cleanup kit', 'completed'),
(10, 27, 1, 'Air purifier', 'completed'),

-- Volcano distributions
(9, 33, 1, 'Volcano respiratory kit (last ones)', 'completed'),
(9, 8, 6, 'Water for transferred family', 'completed'),

-- Various other distributions
(13, 28, 1, 'Phone charger for transfer case', 'completed'),
(14, 21, 1, 'Decontamination for smoke case', 'completed'),
(16, 4, 1, 'Urban flood rations', 'completed'),
(17, 6, 3, 'Wildfire meals', 'completed'),
(18, 1, 1, 'Basic food pack', 'completed'),
(19, 31, 2, 'Snack packs for flood victim', 'completed'),
(20, 7, 1, 'Medical diet for chemical zone', 'completed')
ON CONFLICT DO NOTHING;

-- ========================
-- 12. UPDATE OCCUPANCY COUNTS
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
-- 13. UPDATE EVENTS WITH CURRENT OCCUPANCY
-- ========================
UPDATE events e
SET max_occupancy = (
    SELECT COUNT(DISTINCT ar.individual_id)
    FROM attendance_records ar
    WHERE ar.event_id = e.event_id
    AND ar.status IN ('checked_in', 'transferred')
    AND (ar.check_out_time IS NULL OR ar.status = 'transferred')
),
usage_percentage = CASE 
    WHEN e.capacity > 0 THEN 
        ROUND((
            SELECT COUNT(DISTINCT ar.individual_id) * 100.0 / e.capacity
            FROM attendance_records ar
            WHERE ar.event_id = e.event_id
            AND ar.status IN ('checked_in', 'transferred')
            AND (ar.check_out_time IS NULL OR ar.status = 'transferred')
        ), 2)
    ELSE 0.00
END
WHERE e.status IN ('active', 'monitoring');

-- ========================
-- 14. VERIFICATION QUERIES
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

-- Display current occupancy
SELECT 
    ec.center_name,
    ec.capacity,
    ec.current_occupancy,
    ROUND((ec.current_occupancy * 100.0 / ec.capacity), 2) as occupancy_percent,
    ec.status
FROM evacuation_centers ec
ORDER BY ec.current_occupancy DESC;

-- Display active events
SELECT 
    event_name,
    event_type,
    status,
    max_occupancy,
    capacity,
    usage_percentage
FROM events
WHERE status IN ('active', 'monitoring')
ORDER BY date_declared DESC;
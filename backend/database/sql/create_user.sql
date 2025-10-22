-- ========================
-- Create Super Admin User
-- ========================
DO $$
DECLARE
    user_email TEXT := '&1';    -- Email will be provided as parameter
    user_password TEXT := '&2'; -- Password will be provided as parameter
    user_exists BOOLEAN;
BEGIN
    -- Check if admin user already exists
    SELECT EXISTS(SELECT 1 FROM users WHERE email = user_email) INTO user_exists;
    
    IF user_exists THEN
        RAISE NOTICE 'User % already exists. Updating password...', user_email;
        
        -- Update existing admin user password
        UPDATE users 
        SET password_hash = crypt(user_password, gen_salt('bf')),
            updated_at = CURRENT_TIMESTAMP
        WHERE email = user_email;
        
    ELSE
        -- Create new admin user
        INSERT INTO users (
            email, 
            password_hash, 
            role, 
            center_id, 
            is_active
        ) VALUES (
            user_email,
            crypt(user_password, gen_salt('bf')),
            'super_admin',
            NULL,
            TRUE
        );
    END IF;
    
    RAISE NOTICE 'Super admin user % setup completed successfully!', user_email;
END $$;
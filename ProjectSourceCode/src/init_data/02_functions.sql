CREATE OR REPLACE FUNCTION get_or_create_location(uid INT, loc_name TEXT)
RETURNS INT AS $$
DECLARE lid INT;
BEGIN
    INSERT INTO locations(user_id, name)
    VALUES (uid, loc_name)
    ON CONFLICT (user_id, name)
    DO UPDATE SET name = EXCLUDED.name
    RETURNING location_id INTO lid;

    RETURN lid;
END;
$$ LANGUAGE plpgsql;
-- =====================================================
-- FIX: Survey Response Count Trigger
-- Run this in Supabase SQL Editor
-- =====================================================

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS after_response_insert ON survey_responses;

-- Recreate the function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION increment_survey_responses()
RETURNS TRIGGER 
SECURITY DEFINER
AS $$
BEGIN
    UPDATE surveys 
    SET responses_count = COALESCE(responses_count, 0) + 1 
    WHERE id = NEW.survey_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER after_response_insert
    AFTER INSERT ON survey_responses
    FOR EACH ROW
    EXECUTE FUNCTION increment_survey_responses();

-- Also add a decrement trigger for when responses are deleted
CREATE OR REPLACE FUNCTION decrement_survey_responses()
RETURNS TRIGGER 
SECURITY DEFINER
AS $$
BEGIN
    UPDATE surveys 
    SET responses_count = GREATEST(COALESCE(responses_count, 0) - 1, 0)
    WHERE id = OLD.survey_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_response_delete ON survey_responses;

CREATE TRIGGER after_response_delete
    AFTER DELETE ON survey_responses
    FOR EACH ROW
    EXECUTE FUNCTION decrement_survey_responses();

-- Fix any existing counts that may be wrong
UPDATE surveys s
SET responses_count = (
    SELECT COUNT(*) 
    FROM survey_responses sr 
    WHERE sr.survey_id = s.id
);

-- Verify the fix
SELECT id, title, responses_count,
    (SELECT COUNT(*) FROM survey_responses sr WHERE sr.survey_id = s.id) as actual_count
FROM surveys s;

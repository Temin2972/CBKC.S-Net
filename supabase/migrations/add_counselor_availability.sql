-- =====================================================
-- COUNSELOR AVAILABILITY SYSTEM
-- Manages counselor schedules and availability
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create counselor_availability table
CREATE TABLE IF NOT EXISTS counselor_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    counselor_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- Availability status
    status TEXT DEFAULT 'offline', -- 'online', 'busy', 'offline', 'away'
    status_message TEXT, -- Optional custom message
    
    -- Weekly schedule (stored as JSONB)
    -- Format: { "monday": [{"start": "09:00", "end": "17:00"}], ... }
    weekly_schedule JSONB DEFAULT '{}',
    
    -- Override dates (holidays, special days)
    -- Format: [{"date": "2024-01-01", "available": false, "reason": "Nghỉ lễ"}]
    schedule_overrides JSONB DEFAULT '[]',
    
    -- Max concurrent chats
    max_concurrent_chats INT DEFAULT 5,
    current_chat_count INT DEFAULT 0,
    
    -- Timestamps
    last_online_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(counselor_id)
);

-- Enable RLS
ALTER TABLE counselor_availability ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Everyone can view availability (for showing online status)
CREATE POLICY "availability_select_all" ON counselor_availability
    FOR SELECT USING (true);

-- Counselors can update their own availability
CREATE POLICY "availability_update_own" ON counselor_availability
    FOR UPDATE USING (auth.uid() = counselor_id);

-- Counselors can insert their own availability
CREATE POLICY "availability_insert_own" ON counselor_availability
    FOR INSERT WITH CHECK (auth.uid() = counselor_id);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_availability_counselor ON counselor_availability(counselor_id);
CREATE INDEX IF NOT EXISTS idx_availability_status ON counselor_availability(status);

-- =====================================================
-- FUNCTION: Check if counselor is available now
-- =====================================================

CREATE OR REPLACE FUNCTION is_counselor_available(p_counselor_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    avail counselor_availability%ROWTYPE;
    current_day TEXT;
    curr_time TIME;
    day_schedule JSONB;
    slot JSONB;
    override_entry JSONB;
    today_str TEXT;
BEGIN
    -- Get availability record
    SELECT * INTO avail FROM counselor_availability WHERE counselor_id = p_counselor_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if offline
    IF avail.status = 'offline' THEN
        RETURN FALSE;
    END IF;
    
    -- Check if at max capacity
    IF avail.current_chat_count >= avail.max_concurrent_chats THEN
        RETURN FALSE;
    END IF;
    
    -- Check for date overrides first
    today_str := to_char(CURRENT_DATE, 'YYYY-MM-DD');
    FOR override_entry IN SELECT * FROM jsonb_array_elements(avail.schedule_overrides)
    LOOP
        IF override_entry->>'date' = today_str THEN
            RETURN (override_entry->>'available')::boolean;
        END IF;
    END LOOP;
    
    -- Check weekly schedule
    current_day := lower(to_char(CURRENT_DATE, 'Day'));
    current_day := trim(current_day); -- Remove trailing spaces
    curr_time := LOCALTIME;
    
    day_schedule := avail.weekly_schedule->current_day;
    
    IF day_schedule IS NULL OR jsonb_array_length(day_schedule) = 0 THEN
        -- No schedule for today, assume online status determines availability
        RETURN avail.status = 'online';
    END IF;
    
    -- Check if current time is within any slot
    FOR slot IN SELECT * FROM jsonb_array_elements(day_schedule)
    LOOP
        IF curr_time >= (slot->>'start')::TIME AND curr_time <= (slot->>'end')::TIME THEN
            RETURN TRUE;
        END IF;
    END LOOP;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- FUNCTION: Get all online counselors
-- =====================================================

CREATE OR REPLACE FUNCTION get_available_counselors()
RETURNS TABLE(
    counselor_id UUID,
    full_name TEXT,
    status TEXT,
    status_message TEXT,
    current_chat_count INT,
    max_concurrent_chats INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ca.counselor_id,
        u.full_name,
        ca.status,
        ca.status_message,
        ca.current_chat_count,
        ca.max_concurrent_chats
    FROM counselor_availability ca
    JOIN users u ON u.id = ca.counselor_id
    WHERE ca.status IN ('online', 'busy')
    AND is_counselor_available(ca.counselor_id) = TRUE
    ORDER BY 
        CASE ca.status WHEN 'online' THEN 0 ELSE 1 END,
        ca.current_chat_count ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- TRIGGER: Update timestamp on change
-- =====================================================

CREATE OR REPLACE FUNCTION update_availability_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    IF NEW.status = 'online' AND (OLD.status IS NULL OR OLD.status != 'online') THEN
        NEW.last_online_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_availability_updated_at
    BEFORE UPDATE ON counselor_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_availability_timestamp();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION is_counselor_available(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_counselors() TO authenticated;

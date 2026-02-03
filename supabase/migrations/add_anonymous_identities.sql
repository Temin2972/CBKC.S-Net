-- =====================================================
-- ANONYMOUS IDENTITY SYSTEM
-- Generates consistent anonymous names for users
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create table to store anonymous identities
CREATE TABLE IF NOT EXISTS anonymous_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
    anonymous_name TEXT NOT NULL,
    anonymous_avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE anonymous_identities ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own anonymous identity" ON anonymous_identities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create anonymous identities" ON anonymous_identities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_anonymous_user ON anonymous_identities(user_id);

-- =====================================================
-- FUNCTION: Generate random anonymous name
-- =====================================================

CREATE OR REPLACE FUNCTION generate_anonymous_name()
RETURNS TEXT AS $$
DECLARE
    adjectives TEXT[] := ARRAY[
        'Dịu dàng', 'Mạnh mẽ', 'Tươi sáng', 'Bình yên', 'Ấm áp',
        'Dũng cảm', 'Kiên cường', 'Lạc quan', 'Nhẹ nhàng', 'Tự tin',
        'Sáng tạo', 'Thân thiện', 'Đáng yêu', 'Tinh tế', 'Chân thành',
        'Vui vẻ', 'Hòa nhã', 'Can đảm', 'Tinh nghịch', 'Dễ thương'
    ];
    animals TEXT[] := ARRAY[
        'Cáo', 'Thỏ', 'Chim', 'Bướm', 'Cá heo',
        'Mèo', 'Chó', 'Gấu', 'Sóc', 'Hươu',
        'Chim sẻ', 'Cú mèo', 'Công', 'Vẹt', 'Hạc',
        'Kỳ lân', 'Phượng hoàng', 'Rồng', 'Tuấn mã', 'Đại bàng'
    ];
    adj TEXT;
    animal TEXT;
    num INT;
BEGIN
    adj := adjectives[1 + floor(random() * array_length(adjectives, 1))::int];
    animal := animals[1 + floor(random() * array_length(animals, 1))::int];
    num := floor(random() * 100)::int;
    RETURN adj || ' ' || animal || ' ' || num;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Get or create anonymous identity
-- =====================================================

CREATE OR REPLACE FUNCTION get_anonymous_identity(p_user_id UUID)
RETURNS TABLE(anonymous_name TEXT, anonymous_avatar TEXT) AS $$
DECLARE
    existing_name TEXT;
    existing_avatar TEXT;
    new_name TEXT;
    avatar_colors TEXT[] := ARRAY[
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    avatar_color TEXT;
BEGIN
    -- Check if identity already exists
    SELECT ai.anonymous_name, ai.anonymous_avatar 
    INTO existing_name, existing_avatar
    FROM anonymous_identities ai
    WHERE ai.user_id = p_user_id;
    
    IF FOUND THEN
        RETURN QUERY SELECT existing_name, existing_avatar;
        RETURN;
    END IF;
    
    -- Generate new identity
    new_name := generate_anonymous_name();
    avatar_color := avatar_colors[1 + floor(random() * array_length(avatar_colors, 1))::int];
    
    -- Save it
    INSERT INTO anonymous_identities (user_id, anonymous_name, anonymous_avatar)
    VALUES (p_user_id, new_name, avatar_color);
    
    RETURN QUERY SELECT new_name, avatar_color;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION generate_anonymous_name() TO authenticated;
GRANT EXECUTE ON FUNCTION get_anonymous_identity(UUID) TO authenticated;

-- Add foreign key constraint for counselor_id in chat_rooms
-- This ensures proper relationship between chat_rooms and users for counselor

-- First, ensure the column exists
ALTER TABLE public.chat_rooms 
ADD COLUMN IF NOT EXISTS counselor_id UUID;

-- Add the foreign key constraint with explicit naming
ALTER TABLE public.chat_rooms
DROP CONSTRAINT IF EXISTS chat_rooms_counselor_id_fkey;

ALTER TABLE public.chat_rooms
ADD CONSTRAINT chat_rooms_counselor_id_fkey 
FOREIGN KEY (counselor_id) 
REFERENCES public.users(id) 
ON DELETE SET NULL;

-- Add index if not exists
CREATE INDEX IF NOT EXISTS idx_chat_rooms_counselor ON public.chat_rooms(counselor_id);

-- Add comment
COMMENT ON COLUMN public.chat_rooms.counselor_id IS 'Assigned counselor for private chats, NULL for general queue';

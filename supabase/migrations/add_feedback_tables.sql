-- Migration: Add feedback and suggestions tables
-- For session feedback and website suggestions

-- ============================================
-- FEEDBACKS TABLE
-- Stores student feedback for counseling sessions
-- ============================================
CREATE TABLE IF NOT EXISTS public.feedbacks (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  counselor_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  effectiveness INTEGER NOT NULL CHECK (effectiveness >= 1 AND effectiveness <= 5),
  problem_resolved BOOLEAN NOT NULL,
  comment TEXT,
  is_private BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT feedbacks_pkey PRIMARY KEY (id),
  CONSTRAINT feedbacks_student_id_fkey FOREIGN KEY (student_id) 
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT feedbacks_counselor_id_fkey FOREIGN KEY (counselor_id) 
    REFERENCES users(id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Indexes for feedbacks
CREATE INDEX IF NOT EXISTS idx_feedbacks_student_id ON public.feedbacks(student_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_counselor_id ON public.feedbacks(counselor_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON public.feedbacks(created_at DESC);

-- Comments
COMMENT ON TABLE public.feedbacks IS 'Student feedback for counseling sessions';
COMMENT ON COLUMN public.feedbacks.rating IS 'Overall rating 1-5 stars';
COMMENT ON COLUMN public.feedbacks.effectiveness IS 'How effective was the session 1-5';
COMMENT ON COLUMN public.feedbacks.problem_resolved IS 'Whether the student feels their problem was resolved';
COMMENT ON COLUMN public.feedbacks.is_private IS 'If true, only visible to admins and the counselor';

-- ============================================
-- SUGGESTIONS TABLE
-- Stores website improvement suggestions
-- ============================================
CREATE TABLE IF NOT EXISTS public.suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type VARCHAR(30) NOT NULL DEFAULT 'feature_request',
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  admin_response TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  responded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT suggestions_pkey PRIMARY KEY (id),
  CONSTRAINT suggestions_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT suggestions_responded_by_fkey FOREIGN KEY (responded_by) 
    REFERENCES users(id),
  CONSTRAINT suggestions_type_check CHECK (
    type IN ('feature_request', 'bug_report', 'compliment', 'other')
  ),
  CONSTRAINT suggestions_status_check CHECK (
    status IN ('pending', 'reviewed', 'in_progress', 'completed', 'rejected')
  )
) TABLESPACE pg_default;

-- Indexes for suggestions
CREATE INDEX IF NOT EXISTS idx_suggestions_user_id ON public.suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON public.suggestions(status);
CREATE INDEX IF NOT EXISTS idx_suggestions_type ON public.suggestions(type);
CREATE INDEX IF NOT EXISTS idx_suggestions_created_at ON public.suggestions(created_at DESC);

-- Comments
COMMENT ON TABLE public.suggestions IS 'Website improvement suggestions from users';
COMMENT ON COLUMN public.suggestions.type IS 'Type: feature_request, bug_report, compliment, other';
COMMENT ON COLUMN public.suggestions.status IS 'Status: pending, reviewed, in_progress, completed, rejected';

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

-- FEEDBACKS POLICIES

-- Students can insert their own feedback
DROP POLICY IF EXISTS "Students can insert their own feedback" ON public.feedbacks;
CREATE POLICY "Students can insert their own feedback" ON public.feedbacks
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Students can view their own feedback
DROP POLICY IF EXISTS "Students can view their own feedback" ON public.feedbacks;
CREATE POLICY "Students can view their own feedback" ON public.feedbacks
  FOR SELECT
  USING (auth.uid() = student_id);

-- Counselors can view feedback about themselves
DROP POLICY IF EXISTS "Counselors can view their feedback" ON public.feedbacks;
CREATE POLICY "Counselors can view their feedback" ON public.feedbacks
  FOR SELECT
  USING (auth.uid() = counselor_id);

-- Admins can view all feedback
DROP POLICY IF EXISTS "Admins can view all feedback" ON public.feedbacks;
CREATE POLICY "Admins can view all feedback" ON public.feedbacks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- SUGGESTIONS POLICIES

-- Users can insert suggestions
DROP POLICY IF EXISTS "Users can insert suggestions" ON public.suggestions;
CREATE POLICY "Users can insert suggestions" ON public.suggestions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own suggestions
DROP POLICY IF EXISTS "Users can view their own suggestions" ON public.suggestions;
CREATE POLICY "Users can view their own suggestions" ON public.suggestions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Staff can view all suggestions
DROP POLICY IF EXISTS "Staff can view all suggestions" ON public.suggestions;
CREATE POLICY "Staff can view all suggestions" ON public.suggestions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('counselor', 'admin')
    )
  );

-- Admins can update suggestions (respond)
DROP POLICY IF EXISTS "Admins can update suggestions" ON public.suggestions;
CREATE POLICY "Admins can update suggestions" ON public.suggestions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create blood_reports table without vector (we'll use text-based search for now)
CREATE TABLE IF NOT EXISTS public.blood_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  content TEXT,
  analysis TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for blood_reports
ALTER TABLE public.blood_reports ENABLE ROW LEVEL SECURITY;

-- Policies for blood_reports
CREATE POLICY "Users can view own reports" ON public.blood_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upload reports" ON public.blood_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reports" ON public.blood_reports FOR DELETE USING (auth.uid() = user_id);
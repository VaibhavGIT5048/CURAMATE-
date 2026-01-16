-- Create storage bucket for blood reports
INSERT INTO storage.buckets (id, name, public)
VALUES ('blood-reports', 'blood-reports', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own reports
CREATE POLICY "Users can upload their own reports"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'blood-reports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own reports
CREATE POLICY "Users can view their own reports"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'blood-reports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own reports
CREATE POLICY "Users can delete their own reports"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'blood-reports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add file_url column to blood_reports table for storing the storage path
ALTER TABLE public.blood_reports ADD COLUMN IF NOT EXISTS file_url text;
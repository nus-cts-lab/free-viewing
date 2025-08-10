-- Supabase Storage Setup for Experiment Files
-- Run this in your Supabase SQL Editor

-- 1. Create storage bucket for experiment files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('experiment-files', 'experiment-files', false);

-- 2. Create storage policies for authenticated access
-- Allow admins to upload files
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'experiment-files');

-- Allow admins to download files
CREATE POLICY "Allow authenticated downloads" ON storage.objects
FOR SELECT USING (bucket_id = 'experiment-files');

-- Allow admins to delete files (for cleanup)
CREATE POLICY "Allow authenticated deletions" ON storage.objects
FOR DELETE USING (bucket_id = 'experiment-files');

-- 3. Database table (if not already created)
-- CREATE TABLE IF NOT EXISTS experiments (
--     id BIGSERIAL PRIMARY KEY,
--     participant_id TEXT NOT NULL,
--     participant_email TEXT,
--     completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     trial_data JSONB NOT NULL,
--     mouse_data JSONB NOT NULL,
--     total_trials INTEGER NOT NULL,
--     total_mouse_points INTEGER NOT NULL,
--     data_size INTEGER NOT NULL,
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     -- File storage tracking
--     files_stored BOOLEAN DEFAULT FALSE,
--     csv_trial_path TEXT,
--     csv_mouse_path TEXT,
--     heatmap_zip_path TEXT
-- );

-- Add file tracking columns to existing table
ALTER TABLE experiments 
ADD COLUMN IF NOT EXISTS files_stored BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS csv_trial_path TEXT,
ADD COLUMN IF NOT EXISTS csv_mouse_path TEXT,
ADD COLUMN IF NOT EXISTS heatmap_zip_path TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_experiments_files_stored ON experiments(files_stored);
CREATE INDEX IF NOT EXISTS idx_experiments_participant_completed ON experiments(participant_id, completed_at);
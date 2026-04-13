-- Add audio_url column for TTS-generated MP3 URLs
ALTER TABLE moments ADD COLUMN IF NOT EXISTS audio_url TEXT;

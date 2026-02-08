-- Add soul prompt fields to nft_profiles
-- These fields store the AI personality system for each character

-- Race detected from traits (Human, Bot, Alien, Skull, Skull Blue, Skull Gold)
ALTER TABLE nft_profiles ADD COLUMN IF NOT EXISTS race TEXT;

-- Alignment score from -100 (anti-Somnus) to +100 (pro-Somnus)
ALTER TABLE nft_profiles ADD COLUMN IF NOT EXISTS alignment_score INTEGER;

-- Generated speech style description
ALTER TABLE nft_profiles ADD COLUMN IF NOT EXISTS speech_style TEXT;

-- The full soul prompt used for AI generation
ALTER TABLE nft_profiles ADD COLUMN IF NOT EXISTS soul_prompt TEXT;

-- Add constraint for alignment score range
ALTER TABLE nft_profiles ADD CONSTRAINT alignment_score_range
  CHECK (alignment_score IS NULL OR (alignment_score >= -100 AND alignment_score <= 100));

-- Create index on race for filtering
CREATE INDEX IF NOT EXISTS idx_nft_profiles_race ON nft_profiles(race);

-- Create index on alignment_score for filtering/sorting
CREATE INDEX IF NOT EXISTS idx_nft_profiles_alignment ON nft_profiles(alignment_score);

COMMENT ON COLUMN nft_profiles.race IS 'Detected race: Human, Bot, Alien, Skull, Skull Blue, or Skull Gold';
COMMENT ON COLUMN nft_profiles.alignment_score IS 'Somnus alignment: -100 (rebel) to +100 (Somnite)';
COMMENT ON COLUMN nft_profiles.speech_style IS 'AI-generated description of how this character speaks';
COMMENT ON COLUMN nft_profiles.soul_prompt IS 'Full system prompt defining the character personality and rules';

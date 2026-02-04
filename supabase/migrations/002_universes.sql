-- Create universes table to store custom universe configurations
CREATE TABLE IF NOT EXISTS universes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  contract_address TEXT UNIQUE NOT NULL,
  description TEXT,

  -- Lore & world building (AI generated)
  world TEXT,
  themes TEXT[] DEFAULT '{}',
  character_description TEXT,
  factions TEXT[] DEFAULT '{}',
  vocabulary TEXT[] DEFAULT '{}',

  -- Design guidelines
  primary_color TEXT DEFAULT '#a855f7',
  secondary_color TEXT DEFAULT '#18181b',
  accent_color TEXT DEFAULT '#d946ef',
  font_style TEXT DEFAULT 'mono', -- 'mono', 'sans', 'serif'

  -- Wording customization
  wording JSONB DEFAULT '{"post": "post", "posts": "posts", "status_active": "Online", "status_inactive": "Offline"}',

  -- Sample NFT images for universe card
  sample_images TEXT[] DEFAULT '{}',

  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_universes_contract ON universes(contract_address);
CREATE INDEX IF NOT EXISTS idx_universes_slug ON universes(slug);

-- Add RLS policies
ALTER TABLE universes ENABLE ROW LEVEL SECURITY;

-- Anyone can read universes
CREATE POLICY "Universes are viewable by everyone" ON universes
  FOR SELECT USING (true);

-- Only authenticated users can create universes
CREATE POLICY "Users can create universes" ON universes
  FOR INSERT WITH CHECK (true);

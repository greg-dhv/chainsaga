-- Add design fields to universes table for better theming
ALTER TABLE universes
ADD COLUMN IF NOT EXISTS font_family TEXT,
ADD COLUMN IF NOT EXISTS google_font_url TEXT,
ADD COLUMN IF NOT EXISTS background_image_url TEXT;

-- Add comment explaining the fields
COMMENT ON COLUMN universes.font_family IS 'Primary font family name (e.g., "Inter", "Playfair Display")';
COMMENT ON COLUMN universes.google_font_url IS 'Google Fonts CSS URL if using a Google Font';
COMMENT ON COLUMN universes.background_image_url IS 'Subtle background image URL for universe skin';

-- Add reply support to posts table

-- Reference to parent post (null for original posts, post_id for replies)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS reply_to_post_id UUID REFERENCES posts(id) ON DELETE SET NULL;

-- Create index for efficient reply lookups
CREATE INDEX IF NOT EXISTS idx_posts_reply_to ON posts(reply_to_post_id);

-- Add comment
COMMENT ON COLUMN posts.reply_to_post_id IS 'Parent post ID if this is a reply, null for original posts';

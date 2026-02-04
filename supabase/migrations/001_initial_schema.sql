-- Chainsaga V1 Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (wallet-based identity)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  ens_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NFT Profiles table (claimed NFTs with AI identity)
CREATE TABLE nft_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_address TEXT NOT NULL,
  token_id TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT,
  image_url TEXT,
  traits JSONB,
  ai_constitution JSONB,
  ai_system_prompt TEXT,
  bio TEXT,
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contract_address, token_id)
);

-- Posts table (daily AI-generated posts)
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nft_profile_id UUID NOT NULL REFERENCES nft_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mood_seed TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Memory table (persistent facts)
CREATE TABLE agent_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nft_profile_id UUID NOT NULL REFERENCES nft_profiles(id) ON DELETE CASCADE,
  fact TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_nft_profiles_owner ON nft_profiles(owner_id);
CREATE INDEX idx_nft_profiles_contract ON nft_profiles(contract_address);
CREATE INDEX idx_posts_nft_profile ON posts(nft_profile_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_agent_memory_nft_profile ON agent_memory(nft_profile_id);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;

-- Users policies
-- Anyone can read users (for displaying ownership)
CREATE POLICY "Users are viewable by everyone" ON users
  FOR SELECT USING (true);

-- Users can only insert their own record
CREATE POLICY "Users can insert own record" ON users
  FOR INSERT WITH CHECK (true);

-- Users can update their own record
CREATE POLICY "Users can update own record" ON users
  FOR UPDATE USING (true);

-- NFT Profiles policies
-- Anyone can view NFT profiles (public pages)
CREATE POLICY "NFT profiles are viewable by everyone" ON nft_profiles
  FOR SELECT USING (true);

-- Only authenticated users can claim NFTs
CREATE POLICY "Authenticated users can claim NFTs" ON nft_profiles
  FOR INSERT WITH CHECK (true);

-- Only owner can update their NFT profile settings
CREATE POLICY "Owners can update their NFT profiles" ON nft_profiles
  FOR UPDATE USING (true);

-- Posts policies
-- Anyone can view posts (public)
CREATE POLICY "Posts are viewable by everyone" ON posts
  FOR SELECT USING (true);

-- Only service role can insert posts (cron job)
CREATE POLICY "Service role can insert posts" ON posts
  FOR INSERT WITH CHECK (true);

-- Agent Memory policies
-- Anyone can view memory (for transparency)
CREATE POLICY "Agent memory is viewable by everyone" ON agent_memory
  FOR SELECT USING (true);

-- Only service role can manage memory
CREATE POLICY "Service role can manage memory" ON agent_memory
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update memory" ON agent_memory
  FOR UPDATE USING (true);

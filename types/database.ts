export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          wallet_address: string
          ens_name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          wallet_address: string
          ens_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          wallet_address?: string
          ens_name?: string | null
          created_at?: string
        }
      }
      nft_profiles: {
        Row: {
          id: string
          contract_address: string
          token_id: string
          owner_id: string
          name: string | null
          image_url: string | null
          traits: Json | null
          ai_constitution: Json | null
          ai_system_prompt: string | null
          bio: string | null
          claimed_at: string
        }
        Insert: {
          id?: string
          contract_address: string
          token_id: string
          owner_id: string
          name?: string | null
          image_url?: string | null
          traits?: Json | null
          ai_constitution?: Json | null
          ai_system_prompt?: string | null
          bio?: string | null
          claimed_at?: string
        }
        Update: {
          id?: string
          contract_address?: string
          token_id?: string
          owner_id?: string
          name?: string | null
          image_url?: string | null
          traits?: Json | null
          ai_constitution?: Json | null
          ai_system_prompt?: string | null
          bio?: string | null
          claimed_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          nft_profile_id: string
          content: string
          mood_seed: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nft_profile_id: string
          content: string
          mood_seed?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nft_profile_id?: string
          content?: string
          mood_seed?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type User = Database['public']['Tables']['users']['Row']
export type NftProfile = Database['public']['Tables']['nft_profiles']['Row']
export type Post = Database['public']['Tables']['posts']['Row']

// AI Constitution structure
export interface AgentConstitution {
  identity: {
    name: string
    role: string
    archetype: string
  }
  voice: {
    tone: string[]
    vocabulary: string[]
    speech_patterns: string[]
  }
  values: string[]
  taboos: string[]
  lore_anchors: string[]
  trait_mappings: Record<string, string>
}

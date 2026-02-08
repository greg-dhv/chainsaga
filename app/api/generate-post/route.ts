import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generatePost, type OtherRunnerPost } from '@/lib/ai/generatePost'
import type { NftProfile, Post } from '@/types/database'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { profileId } = body

    if (!profileId) {
      return NextResponse.json({ error: 'Missing profileId' }, { status: 400 })
    }

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('nft_profiles')
      .select('*')
      .eq('id', profileId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Fetch this character's recent posts
    const { data: recentPosts } = await supabase
      .from('posts')
      .select('*')
      .eq('nft_profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(5)

    // Fetch other runners' recent posts from the same universe
    const { data: otherPostsData } = await supabase
      .from('posts')
      .select(`
        content,
        created_at,
        nft_profiles!inner (
          id,
          name,
          race,
          contract_address
        )
      `)
      .eq('nft_profiles.contract_address', profile.contract_address)
      .neq('nft_profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(20)

    // Transform to OtherRunnerPost format
    // Note: Supabase returns nft_profiles as a single object when using !inner
    const otherRunnersPosts: OtherRunnerPost[] = (otherPostsData || []).map((p) => {
      const nftProfile = p.nft_profiles as unknown as { name: string; race: string | null }
      return {
        runner_name: nftProfile.name,
        race: nftProfile.race,
        content: p.content,
        created_at: p.created_at,
      }
    })

    // Generate new post
    const content = await generatePost(
      profile as unknown as NftProfile,
      (recentPosts || []) as unknown as Post[],
      otherRunnersPosts
    )

    // Save post to database
    const { data: newPost, error: postError } = await supabase
      .from('posts')
      .insert({
        nft_profile_id: profileId,
        content: content,
        mood_seed: 'manual-generation',
      })
      .select()
      .single()

    if (postError) {
      console.error('Error saving post:', postError)
      return NextResponse.json({ error: 'Failed to save post' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      post: newPost,
    })
  } catch (error) {
    console.error('Generate post error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate post' },
      { status: 500 }
    )
  }
}

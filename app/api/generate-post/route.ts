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
    const { profileId, secret } = body

    // Auth check - require secret in production
    if (process.env.NODE_ENV === 'production' && secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    // Fetch other runners' posts for reply context (includes replies for threaded conversations)
    const { data: otherPostsData } = await supabase
      .from('posts')
      .select(`
        id,
        content,
        created_at,
        reply_to_post_id,
        nft_profiles!inner (
          id,
          name,
          race,
          token_id,
          contract_address
        )
      `)
      .eq('nft_profiles.contract_address', profile.contract_address)
      .neq('nft_profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(20)

    // Transform to OtherRunnerPost format
    const otherRunnersPosts: OtherRunnerPost[] = (otherPostsData || []).map((p) => {
      const nftProfile = p.nft_profiles as unknown as { id: string; name: string; race: string | null; token_id: string }
      return {
        id: p.id,
        runner_name: nftProfile.name,
        runner_id: nftProfile.token_id,
        race: nftProfile.race,
        content: p.content,
        created_at: p.created_at,
      }
    })

    // Generate new post (now returns { type, reply_to_post_id, content })
    const result = await generatePost(
      profile as unknown as NftProfile,
      (recentPosts || []) as unknown as Post[],
      otherRunnersPosts
    )

    // Save post to database with reply reference if applicable
    const moodSeed = result.type === 'reply' ? 'reply' : (result.post_type || 'original')
    const { data: newPost, error: postError } = await supabase
      .from('posts')
      .insert({
        nft_profile_id: profileId,
        content: result.content,
        mood_seed: moodSeed,
        reply_to_post_id: result.reply_to_post_id,
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
      postType: result.type,
      replyTo: result.reply_to_post_id,
    })
  } catch (error) {
    console.error('Generate post error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate post' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generatePost, type OtherRunnerPost, type ThreadContext } from '@/lib/ai/generatePost'
import type { NftProfile, Post } from '@/types/database'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Fetch thread context for a post (up to 8 messages)
async function fetchThreadContext(
  postId: string,
  contractAddress: string,
  limit = 8
): Promise<OtherRunnerPost[]> {
  const thread: OtherRunnerPost[] = []
  const postIds: string[] = [postId]

  // Walk up the chain collecting post IDs first
  let currentId = postId
  for (let i = 0; i < limit; i++) {
    const { data } = await supabase
      .from('posts')
      .select('reply_to_post_id')
      .eq('id', currentId)
      .single()

    if (!data?.reply_to_post_id) break
    postIds.unshift(data.reply_to_post_id)
    currentId = data.reply_to_post_id
  }

  // Fetch all posts in the thread
  const { data: threadPosts } = await supabase
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
    .in('id', postIds)
    .eq('nft_profiles.contract_address', contractAddress)
    .order('created_at', { ascending: true })

  if (!threadPosts) return thread

  for (const p of threadPosts) {
    const nftProfile = p.nft_profiles as unknown as {
      id: string
      name: string
      race: string | null
      token_id: string
    }

    thread.push({
      id: p.id,
      runner_name: nftProfile.name,
      runner_id: nftProfile.token_id,
      race: nftProfile.race,
      content: p.content,
      created_at: p.created_at,
      reply_to_post_id: p.reply_to_post_id,
    })
  }

  return thread
}

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
        reply_to_post_id: p.reply_to_post_id,
      }
    })

    // Check if we should reply to someone who replied to us
    const myRecentPostIds = (recentPosts || []).map(p => p.id)

    // Get IDs of posts we've already replied to (to avoid double-replying)
    const postsWeRepliedTo = (recentPosts || [])
      .filter(p => p.reply_to_post_id)
      .map(p => p.reply_to_post_id)

    // Find replies to our posts that we haven't responded to yet
    const repliesToMe = otherRunnersPosts.filter(p =>
      p.reply_to_post_id &&
      myRecentPostIds.includes(p.reply_to_post_id) &&
      !postsWeRepliedTo.includes(p.id) // Exclude posts we've already replied to
    )

    // Build thread context if replying
    let threadContext: ThreadContext | undefined
    if (repliesToMe.length > 0) {
      // Prioritize: someone replied to us, reply back (only if we haven't already)
      const targetPost = repliesToMe[Math.floor(Math.random() * repliesToMe.length)]
      const thread = await fetchThreadContext(targetPost.id, profile.contract_address)
      threadContext = { posts: thread, targetPost }
    }

    // Generate new post (now returns { type, reply_to_post_id, content })
    const result = await generatePost(
      profile as unknown as NftProfile,
      (recentPosts || []) as unknown as Post[],
      otherRunnersPosts,
      threadContext
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

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generatePost, type OtherRunnerPost } from '@/lib/ai/generatePost'
import type { NftProfile, Post } from '@/types/database'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Daily quotas per character
const DAILY_ORIGINALS = 3
const DAILY_REPLIES = 6

// Cron runs every 3 hours = 8 times per day
// Probability of posting each run to spread posts throughout day
const POST_PROBABILITY = 0.4 // ~3 posts per day at 8 runs

export async function GET(request: NextRequest) {
  // Test mode: ?force=true skips randomness, ?simulate=day runs full day simulation
  const { searchParams } = new URL(request.url)
  const forceMode = searchParams.get('force') === 'true'
  const simulateDay = searchParams.get('simulate') === 'day'
  const runs = simulateDay ? 8 : 1 // Simulate 8 cron runs for a full day
  // Verify cron secret (Vercel sends this header)
  const authHeader = request.headers.get('authorization')
  const secretParam = searchParams.get('secret')

  const isAuthorized =
    authHeader === `Bearer ${process.env.CRON_SECRET}` ||
    secretParam === process.env.CRON_SECRET ||
    process.env.NODE_ENV !== 'production'

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log(`=== CRON: Starting automated post generation (force=${forceMode}, simulate=${simulateDay}, runs=${runs}) ===`)

    // Get all active profiles (Chain Runners with soul_prompt)
    const { data: profiles, error: profilesError } = await supabase
      .from('nft_profiles')
      .select('*')
      .eq('contract_address', '0x97597002980134bea46250aa0510c9b90d87a587')
      .not('soul_prompt', 'is', null)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
    }

    if (!profiles || profiles.length === 0) {
      console.log('No active profiles found')
      return NextResponse.json({ message: 'No active profiles', generated: 0, profileCount: 0 })
    }

    console.log(`Found ${profiles.length} active profiles`)

    // Get today's start timestamp (UTC)
    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)

    const results: Array<{ profileId: string; name: string; action: string; run?: number }> = []

    // Run multiple times if simulating a full day
    for (let run = 1; run <= runs; run++) {
      if (runs > 1) {
        console.log(`\n--- Run ${run}/${runs} ---`)
      }

      for (const profile of profiles) {
        // Random chance to skip this profile this round (spreads posts throughout day)
        // Skip randomness in force mode
        if (!forceMode && Math.random() > POST_PROBABILITY) {
          continue
        }

      // Get today's posts for this profile
      const { data: todayPosts } = await supabase
        .from('posts')
        .select('id, reply_to_post_id')
        .eq('nft_profile_id', profile.id)
        .gte('created_at', todayStart.toISOString())

      const todayOriginals = (todayPosts || []).filter(p => !p.reply_to_post_id).length
      const todayReplies = (todayPosts || []).filter(p => p.reply_to_post_id).length

      console.log(`${profile.name}: ${todayOriginals}/${DAILY_ORIGINALS} originals, ${todayReplies}/${DAILY_REPLIES} replies`)

      // Check if at quota
      const canPostOriginal = todayOriginals < DAILY_ORIGINALS
      const canReply = todayReplies < DAILY_REPLIES

      if (!canPostOriginal && !canReply) {
        results.push({ profileId: profile.id, name: profile.name, action: 'at_quota' })
        continue
      }

      // Get profile's recent posts for context
      const { data: recentPosts } = await supabase
        .from('posts')
        .select('*')
        .eq('nft_profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5)

      // Get other runners' posts for reply context (includes replies for threaded conversations)
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
        .neq('nft_profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20)

      const otherRunnersPosts: OtherRunnerPost[] = (otherPostsData || []).map((p) => {
        const nftProfile = p.nft_profiles as unknown as { id: string; name: string; race: string | null; token_id: string }
        return {
          id: p.id,
          runner_name: nftProfile.name,
          runner_id: nftProfile.token_id, // Token ID for display (Runner #123)
          race: nftProfile.race,
          content: p.content,
          created_at: p.created_at,
        }
      })

      try {
        // Generate post
        const result = await generatePost(
          profile as unknown as NftProfile,
          (recentPosts || []) as unknown as Post[],
          otherRunnersPosts
        )

        // If we got a reply but are at reply quota, try to convert or skip
        if (result.type === 'reply' && !canReply) {
          if (canPostOriginal) {
            // Force as original (remove reply reference)
            result.type = 'original'
            result.reply_to_post_id = null
          } else {
            results.push({ profileId: profile.id, name: profile.name, action: 'skipped_quota' })
            continue
          }
        }

        // If we got original but are at original quota, check if it can be a reply
        if (result.type === 'original' && !canPostOriginal && canReply) {
          // Skip this round - let them reply next time
          results.push({ profileId: profile.id, name: profile.name, action: 'skipped_need_reply' })
          continue
        }

        // Save post (use post_type for organic posts, 'reply' for replies)
        const moodSeed = result.type === 'reply' ? 'reply' : (result.post_type || 'original')
        const { error: postError } = await supabase
          .from('posts')
          .insert({
            nft_profile_id: profile.id,
            content: result.content,
            mood_seed: moodSeed,
            reply_to_post_id: result.reply_to_post_id,
          })

        if (postError) {
          console.error(`Error saving post for ${profile.name}:`, postError)
          results.push({ profileId: profile.id, name: profile.name, action: 'error' })
        } else {
          console.log(`Generated ${result.type} for ${profile.name}`)
          results.push({ profileId: profile.id, name: profile.name, action: result.type })
        }
      } catch (genError) {
        console.error(`Error generating post for ${profile.name}:`, genError)
        results.push({ profileId: profile.id, name: profile.name, action: 'error' })
      }

      // Small delay between profiles to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    const generated = results.filter(r => r.action === 'original' || r.action === 'reply').length
    console.log(`=== CRON: Generated ${generated} posts ===`)

    return NextResponse.json({
      success: true,
      generated,
      results,
    })
  } catch (error) {
    console.error('Cron error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cron failed' },
      { status: 500 }
    )
  }
}

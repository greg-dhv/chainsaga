import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateSoulPrompt } from '@/lib/soul'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CHAIN_RUNNERS_CONTRACT = '0x97597002980134bea46250aa0510c9b90d87a587'

export async function POST(request: NextRequest) {
  try {
    // Simple auth check - require a secret key
    const { secret, limit = 10, profileId } = await request.json()

    if (secret !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // If profileId is specified, only backfill that one profile
    if (profileId) {
      const { data: profile, error } = await supabase
        .from('nft_profiles')
        .select('id, token_id, traits, name')
        .eq('id', profileId)
        .single()

      if (error || !profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }

      const result = await backfillProfile(profile)
      return NextResponse.json({ success: true, result })
    }

    // Find Chain Runners profiles without soul_prompt
    const { data: profiles, error } = await supabase
      .from('nft_profiles')
      .select('id, token_id, traits, name')
      .eq('contract_address', CHAIN_RUNNERS_CONTRACT)
      .is('soul_prompt', null)
      .limit(limit)

    if (error) {
      console.error('Error fetching profiles:', error)
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ message: 'No profiles need backfilling', count: 0 })
    }

    const results = []
    const errors = []

    for (const profile of profiles) {
      try {
        const result = await backfillProfile(profile)
        results.push(result)
      } catch (err) {
        console.error(`Error backfilling profile ${profile.id}:`, err)
        errors.push({ profileId: profile.id, error: String(err) })
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      errors: errors.length,
      results,
      errorDetails: errors,
    })
  } catch (error) {
    console.error('Backfill error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function backfillProfile(profile: {
  id: string
  token_id: string
  traits: unknown
  name: string | null
}) {
  const traits = (profile.traits as Array<{ trait_type: string; value: string }>) || []

  // Generate soul prompt
  const soulData = await generateSoulPrompt({
    tokenId: profile.token_id,
    traits,
  })

  // Update the profile
  const { error: updateError } = await supabase
    .from('nft_profiles')
    .update({
      race: soulData.race,
      alignment_score: soulData.alignmentScore,
      speech_style: soulData.speechStyle,
      soul_prompt: soulData.soulPrompt,
      feed_behavior: soulData.feedBehavior,
      bio: soulData.bio,
    })
    .eq('id', profile.id)

  if (updateError) {
    throw new Error(`Failed to update profile: ${updateError.message}`)
  }

  return {
    profileId: profile.id,
    name: profile.name,
    race: soulData.race,
    alignmentScore: soulData.alignmentScore,
  }
}

// GET endpoint to check status
export async function GET() {
  const { count: total } = await supabase
    .from('nft_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('contract_address', CHAIN_RUNNERS_CONTRACT)

  const { count: withSoulPrompt } = await supabase
    .from('nft_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('contract_address', CHAIN_RUNNERS_CONTRACT)
    .not('soul_prompt', 'is', null)

  const { count: needsBackfill } = await supabase
    .from('nft_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('contract_address', CHAIN_RUNNERS_CONTRACT)
    .is('soul_prompt', null)

  return NextResponse.json({
    total: total || 0,
    withSoulPrompt: withSoulPrompt || 0,
    needsBackfill: needsBackfill || 0,
  })
}

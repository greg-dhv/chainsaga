import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getNftMetadata } from '@/lib/alchemy/nfts'
import { ClaimButton } from '@/components/ClaimButton'
import { UniverseTheme } from '@/components/UniverseTheme'

interface ProfilePageProps {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{
    contract?: string
  }>
}

interface Universe {
  slug: string
  name: string
  primary_color: string | null
  secondary_color: string | null
  accent_color: string | null
  font_style: string | null
  font_family: string | null
  google_font_url: string | null
  background_image_url: string | null
  wording: {
    post: string
    posts: string
    status_active: string
    status_inactive: string
    character?: string
    characters?: string
    activate_button?: string
    inactive_title?: string
    inactive_description?: string
  } | null
}

interface Profile {
  id: string
  contract_address: string
  token_id: string
  name: string
  image_url: string | null
  bio: string | null
  race: string | null
  traits: Array<{ trait_type: string; value: string }>
  users: { wallet_address: string; ens_name: string | null } | null
}

export default async function ProfilePage({ params, searchParams }: ProfilePageProps) {
  const { id } = await params
  const { contract: contractFromQuery } = await searchParams
  const supabase = await createClient()

  let profile: Profile | null = null
  let universe: Universe | null = null
  let signals: Array<{
    id: string
    content: string
    created_at: string
    reply_to_post_id: string | null
    parent_author_name?: string
    parent_author_id?: string
  }> = []

  // Check if ID is a UUID (profile ID) or a token ID
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

  if (isUuid) {
    // Look up by profile UUID
    const { data } = await supabase
      .from('nft_profiles')
      .select(`
        *,
        users (wallet_address, ens_name)
      `)
      .eq('id', id)
      .single()

    if (data) {
      profile = data as unknown as Profile
    }
  } else {
    // It's a token ID - we need to find which universe/contract it belongs to
    // First check if there's a claimed profile with this token ID
    const { data } = await supabase
      .from('nft_profiles')
      .select(`
        *,
        users (wallet_address, ens_name)
      `)
      .eq('token_id', id)
      .single()

    if (data) {
      profile = data as unknown as Profile
    }
  }

  // If we found a profile, get its universe
  if (profile) {
    const { data: universeData } = await supabase
      .from('universes')
      .select('slug, name, primary_color, secondary_color, accent_color, font_style, font_family, google_font_url, background_image_url, wording')
      .eq('contract_address', profile.contract_address)
      .single()

    universe = universeData as unknown as Universe

    // Fetch signals with reply info
    const { data: signalsData } = await supabase
      .from('posts')
      .select('id, content, created_at, reply_to_post_id')
      .eq('nft_profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50)

    interface RawSignal {
      id: string
      content: string
      created_at: string
      reply_to_post_id: string | null
    }

    const rawSignals = (signalsData || []) as unknown as RawSignal[]

    // Get parent post info for replies
    const signalsWithParents = await Promise.all(
      rawSignals.map(async (signal) => {
        if (signal.reply_to_post_id) {
          const { data: parentPost } = await supabase
            .from('posts')
            .select(`
              id,
              nft_profiles (
                id,
                name
              )
            `)
            .eq('id', signal.reply_to_post_id)
            .single()

          if (parentPost) {
            const parentProfile = (parentPost as unknown as { nft_profiles: { id: string; name: string } }).nft_profiles
            return {
              ...signal,
              parent_author_name: parentProfile?.name,
              parent_author_id: parentProfile?.id,
            }
          }
        }
        return signal
      })
    )

    signals = signalsWithParents
  }

  // If no profile found and it's a token ID, try to fetch from Alchemy
  // Use contract from query param, or fall back to Chain Runners
  let alchemyData: { name: string; imageUrl: string; traits: Array<{ trait_type: string; value: string }>; contractAddress: string } | null = null

  if (!profile && !isUuid) {
    const CHAIN_RUNNERS_CONTRACT = '0x97597002980134bea46250aa0510c9b90d87a587'
    const targetContract = contractFromQuery || CHAIN_RUNNERS_CONTRACT

    try {
      const nft = await getNftMetadata(targetContract, id)
      if (nft) {
        alchemyData = {
          name: nft.name || `#${id}`,
          imageUrl: nft.image?.cachedUrl || nft.image?.originalUrl || '',
          traits: (nft.raw?.metadata?.attributes as Array<{ trait_type: string; value: string }>) || [],
          contractAddress: targetContract,
        }
        // Get universe for this contract
        const { data: contractUniverse } = await supabase
          .from('universes')
          .select('slug, name, primary_color, secondary_color, accent_color, font_style, font_family, google_font_url, background_image_url, wording')
          .eq('contract_address', targetContract)
          .single()
        universe = contractUniverse as unknown as Universe
      }
    } catch {
      // NFT doesn't exist
    }
  }

  // If neither DB nor Alchemy has data, 404
  if (!profile && !alchemyData) {
    notFound()
  }

  const isClaimed = !!profile
  const name = profile?.name || alchemyData?.name || `#${id}`
  const imageUrl = profile?.image_url || alchemyData?.imageUrl
  const traits = (profile?.traits as Array<{ trait_type: string; value: string }>) || alchemyData?.traits || []
  const owner = profile?.users
  const tokenId = profile?.token_id || id
  const contractAddress = profile?.contract_address || alchemyData?.contractAddress
  const race = profile?.race || null

  // Get universe-specific styling
  const primaryColor = universe?.primary_color || '#d946ef'
  const secondaryColor = universe?.secondary_color || '#0a0a0a'
  const accentColor = universe?.accent_color || '#d946ef'
  const fontStyle = (universe?.font_style || 'mono') as 'mono' | 'sans' | 'serif'
  const universeSlug = universe?.slug || 'chain-runners'
  const isChainRunners = universeSlug === 'chain-runners'
  const wording = {
    post: universe?.wording?.post || 'post',
    posts: universe?.wording?.posts || 'posts',
    status_active: universe?.wording?.status_active || 'Online',
    status_inactive: isChainRunners ? 'No Signal' : (universe?.wording?.status_inactive || 'Offline'),
    character: universe?.wording?.character || 'character',
    characters: universe?.wording?.characters || 'characters',
    activate_button: universe?.wording?.activate_button || 'Activate',
    inactive_title: universe?.wording?.inactive_title || 'This character is inactive',
    inactive_description: universe?.wording?.inactive_description || 'Connect your wallet to activate',
  }

  const fontClass = fontStyle === 'mono' ? 'font-mono' : fontStyle === 'serif' ? 'font-serif' : 'font-sans'

  return (
    <UniverseTheme
      primaryColor={primaryColor}
      secondaryColor={secondaryColor}
      accentColor={accentColor}
      fontFamily={universe?.font_family}
      googleFontUrl={universe?.google_font_url}
      backgroundImageUrl={universe?.background_image_url}
      fontStyle={fontStyle}
    >
      <div className="min-h-screen text-white">
        <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Back link */}
        <Link
          href={`/universe/${universeSlug}`}
          className={`${fontClass} text-sm hover:opacity-80`}
          style={{ color: `${primaryColor}88` }}
        >
          {isChainRunners ? '< RETURN_TO_FEED' : `← Back to ${universe?.name || 'Feed'}`}
        </Link>

        <div className="mt-6 flex flex-col gap-8 md:flex-row">
          {/* Runner Image & Info */}
          <div className="w-full md:w-1/3">
            <div className="relative aspect-square overflow-hidden border bg-zinc-900" style={{ borderColor: `${primaryColor}33` }}>
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className={`flex h-full items-center justify-center ${fontClass} text-zinc-600`}>
                  NO_VISUAL
                </div>
              )}
              {/* Silent overlay */}
              {!isClaimed && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <span className={`border bg-black/80 px-3 py-1 ${fontClass} text-xs text-zinc-400`} style={{ borderColor: `${primaryColor}44` }}>
                    {wording.status_inactive.toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="mt-4 border bg-zinc-900/50 p-4" style={{ borderColor: `${primaryColor}33` }}>
              <p className={`${fontClass} text-xs text-zinc-600`}>STATUS</p>
              {isClaimed ? (
                <p className={`mt-1 ${fontClass} text-sm`} style={{ color: primaryColor }}>● {wording.status_active.toUpperCase()}</p>
              ) : (
                <p className={`mt-1 ${fontClass} text-sm text-zinc-500`}>○ {wording.status_inactive.toUpperCase()}</p>
              )}
            </div>

            {/* Owner (if claimed) */}
            {isClaimed && owner && (
              <div className="mt-4 border bg-zinc-900/50 p-4" style={{ borderColor: `${primaryColor}33` }}>
                <p className={`${fontClass} text-xs text-zinc-600`}>{isChainRunners ? 'OPERATOR' : 'Owner'}</p>
                <p className={`mt-1 truncate ${fontClass} text-sm text-zinc-400`}>
                  {owner.ens_name || owner.wallet_address}
                </p>
              </div>
            )}

            {/* Traits */}
            {traits.length > 0 && (
              <div className="mt-4 border bg-zinc-900/50 p-4" style={{ borderColor: `${primaryColor}33` }}>
                <p className={`mb-2 ${fontClass} text-xs text-zinc-600`}>{isChainRunners ? 'ATTRIBUTES' : 'Traits'}</p>
                <div className="flex flex-wrap gap-2">
                  {traits.map((trait, i) => (
                    <span
                      key={i}
                      className={`border px-2 py-1 ${fontClass} text-xs text-zinc-400`}
                      style={{ borderColor: `${primaryColor}44`, backgroundColor: `${primaryColor}11` }}
                    >
                      {trait.trait_type}: {trait.value}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Name, Bio & Signals */}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className={`${fontClass} text-3xl font-bold`} style={{ color: primaryColor }}>{name}</h1>
              {race && (
                <span className={`${fontClass} text-lg text-zinc-500`}>({race})</span>
              )}
            </div>
            <p className={`mt-1 ${fontClass} text-sm text-zinc-600`}>#{tokenId}</p>

            {isClaimed && profile?.bio && (
              <p className={`mt-4 ${fontClass} text-sm text-zinc-400`}>{profile.bio}</p>
            )}

            {/* Silent State - Claim Button */}
            {!isClaimed && contractAddress && (
              <div className="mt-6 border bg-zinc-900/50 p-6" style={{ borderColor: `${primaryColor}33` }}>
                <p className={`${fontClass} text-sm text-zinc-400`}>
                  {isChainRunners ? '// This runner is silent. No signal detected.' : wording.inactive_title}
                </p>
                <p className={`mt-2 ${fontClass} text-xs text-zinc-600`}>
                  {isChainRunners ? '> Connect to activate this identity_' : wording.inactive_description}
                </p>
                <div className="mt-4">
                  <ClaimButton
                    tokenId={tokenId}
                    contractAddress={contractAddress}
                    primaryColor={primaryColor}
                    fontStyle={fontStyle as 'mono' | 'sans' | 'serif'}
                    wording={{
                      activate_button: wording.activate_button,
                      character: wording.character,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Signals (Posts) */}
            {isClaimed && (
              <div className="mt-8">
                <div className="mb-4">
                  <p className={`${fontClass} text-xs text-zinc-600`}>
                    {isChainRunners ? `// SIGNAL_LOG [${signals.length}]` : `${wording.posts} (${signals.length})`}
                  </p>
                </div>

                {signals.length > 0 ? (
                  <div className="space-y-2">
                    {signals.map((signal) => {
                      const timestamp = new Date(signal.created_at)
                      const timeStr = timestamp.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      })
                      const dateStr = timestamp.toLocaleDateString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                      })

                      return (
                        <div
                          key={signal.id}
                          className="border-l-2 bg-zinc-900/30 py-3 pl-4 pr-3"
                          style={{ borderColor: `${primaryColor}44` }}
                        >
                          <p className={`${fontClass} text-xs text-zinc-600`}>
                            {dateStr} {timeStr}
                          </p>
                          {/* Reply indicator */}
                          {signal.reply_to_post_id && signal.parent_author_name && (
                            <div className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                              </svg>
                              <span>{isChainRunners ? 'REPLY_TO:' : 'Replying to'}</span>
                              <Link
                                href={`/profile/${signal.parent_author_id}`}
                                className="hover:underline"
                                style={{ color: primaryColor }}
                              >
                                {signal.parent_author_name}
                              </Link>
                            </div>
                          )}
                          <p className={`mt-1 ${fontClass} text-sm text-zinc-300`}>
                            {signal.content}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="border border-dashed p-6 text-center" style={{ borderColor: `${primaryColor}33` }}>
                    <p className={`${fontClass} text-sm text-zinc-600`}>
                      {isChainRunners ? '// NO_SIGNALS_YET' : `No ${wording.posts} yet`}
                    </p>
                    <p className={`mt-1 ${fontClass} text-xs text-zinc-700`}>
                      {isChainRunners ? '> Awaiting first transmission_' : 'Waiting for first post...'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        </main>
      </div>
    </UniverseTheme>
  )
}

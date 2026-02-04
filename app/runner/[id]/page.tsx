import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getNftMetadata } from '@/lib/alchemy/nfts'
import { ClaimRunnerButton } from '@/components/ClaimRunnerButton'
import { OwnerControls } from '@/components/OwnerControls'

interface RunnerPageProps {
  params: Promise<{
    id: string
  }>
}

interface Universe {
  slug: string
  name: string
  primary_color: string | null
  font_style: string | null
  wording: {
    post: string
    posts: string
    status_active: string
    status_inactive: string
  } | null
}

interface Profile {
  id: string
  contract_address: string
  token_id: string
  name: string
  image_url: string | null
  bio: string | null
  traits: Array<{ trait_type: string; value: string }>
  users: { wallet_address: string; ens_name: string | null } | null
}

export default async function RunnerPage({ params }: RunnerPageProps) {
  const { id } = await params
  const supabase = await createClient()

  let profile: Profile | null = null
  let universe: Universe | null = null
  let signals: Array<{ id: string; content: string; created_at: string }> = []

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
      .select('slug, name, primary_color, font_style, wording')
      .eq('contract_address', profile.contract_address)
      .single()

    universe = universeData as unknown as Universe

    // Fetch signals
    const { data: signalsData } = await supabase
      .from('posts')
      .select('id, content, created_at')
      .eq('nft_profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50)

    signals = signalsData || []
  }

  // If no profile found and it's a token ID, try to fetch from Alchemy
  // We need to know which contract - for now, show 404 for unclaimed non-Chain-Runners
  let alchemyData: { name: string; imageUrl: string; traits: Array<{ trait_type: string; value: string }>; contractAddress: string } | null = null

  if (!profile && !isUuid) {
    // Try Chain Runners first (most common)
    const CHAIN_RUNNERS_CONTRACT = '0x97597002980134bea46250aa0510c9b90d87a587'
    try {
      const nft = await getNftMetadata(CHAIN_RUNNERS_CONTRACT, id)
      if (nft) {
        alchemyData = {
          name: nft.name || `Runner #${id}`,
          imageUrl: nft.image?.cachedUrl || nft.image?.originalUrl || '',
          traits: (nft.raw?.metadata?.attributes as Array<{ trait_type: string; value: string }>) || [],
          contractAddress: CHAIN_RUNNERS_CONTRACT,
        }
        // Get Chain Runners universe
        const { data: crUniverse } = await supabase
          .from('universes')
          .select('slug, name, primary_color, font_style, wording')
          .eq('contract_address', CHAIN_RUNNERS_CONTRACT)
          .single()
        universe = crUniverse as unknown as Universe
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

  // Get universe-specific styling
  const primaryColor = universe?.primary_color || '#d946ef'
  const fontStyle = universe?.font_style || 'mono'
  const wording = universe?.wording || {
    post: 'signal',
    posts: 'signals',
    status_active: 'Transmitting',
    status_inactive: 'Silent',
  }
  const universeSlug = universe?.slug || 'chain-runners'
  const isChainRunners = universeSlug === 'chain-runners'

  const fontClass = fontStyle === 'mono' ? 'font-mono' : fontStyle === 'serif' ? 'font-serif' : 'font-sans'

  return (
    <div className="min-h-screen bg-black text-white">
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
              {isClaimed && profile && (
                <OwnerControls
                  profileId={profile.id}
                  ownerAddress={owner?.wallet_address || null}
                  type="bio"
                />
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
                  {isChainRunners ? '// This runner is silent. No signal detected.' : 'This character is inactive.'}
                </p>
                <p className={`mt-2 ${fontClass} text-xs text-zinc-600`}>
                  {isChainRunners ? '> Connect to activate this identity_' : 'Connect your wallet to activate.'}
                </p>
                <div className="mt-4">
                  <ClaimRunnerButton tokenId={tokenId} contractAddress={contractAddress} />
                </div>
              </div>
            )}

            {/* Signals (Posts) */}
            {isClaimed && (
              <div className="mt-8">
                <div className="mb-4 flex items-center justify-between">
                  <p className={`${fontClass} text-xs text-zinc-600`}>
                    {isChainRunners ? `// SIGNAL_LOG [${signals.length}]` : `${wording.posts} (${signals.length})`}
                  </p>
                  {profile && (
                    <OwnerControls
                      profileId={profile.id}
                      ownerAddress={owner?.wallet_address || null}
                      type="post"
                    />
                  )}
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
  )
}

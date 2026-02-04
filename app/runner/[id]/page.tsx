import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getNftMetadata } from '@/lib/alchemy/nfts'
import { ClaimRunnerButton } from '@/components/ClaimRunnerButton'
import { OwnerControls } from '@/components/OwnerControls'

const CHAIN_RUNNERS_CONTRACT = '0x97597002980134bea46250aa0510c9b90d87a587'

interface RunnerPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function RunnerPage({ params }: RunnerPageProps) {
  const { id: tokenId } = await params
  const supabase = await createClient()

  // Check if runner is claimed (exists in DB)
  const { data: profile } = await supabase
    .from('nft_profiles')
    .select(`
      *,
      users (wallet_address, ens_name)
    `)
    .eq('contract_address', CHAIN_RUNNERS_CONTRACT)
    .eq('token_id', tokenId)
    .single()

  // If claimed, fetch signals
  let signals: Array<{ id: string; content: string; created_at: string }> = []
  if (profile) {
    const { data } = await supabase
      .from('posts')
      .select('id, content, created_at')
      .eq('nft_profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50)
    signals = data || []
  }

  // If not claimed, fetch from Alchemy
  let alchemyData: { name: string; imageUrl: string; traits: Array<{ trait_type: string; value: string }> } | null = null
  if (!profile) {
    try {
      const nft = await getNftMetadata(CHAIN_RUNNERS_CONTRACT, tokenId)
      if (nft) {
        alchemyData = {
          name: nft.name || `Chain Runner #${tokenId}`,
          imageUrl: nft.image?.cachedUrl || nft.image?.originalUrl || '',
          traits: (nft.raw?.metadata?.attributes as Array<{ trait_type: string; value: string }>) || [],
        }
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
  const name = profile?.name || alchemyData?.name || `Runner #${tokenId}`
  const imageUrl = profile?.image_url || alchemyData?.imageUrl
  const traits = (profile?.traits as Array<{ trait_type: string; value: string }>) || alchemyData?.traits || []
  const owner = profile?.users as { wallet_address: string; ens_name: string | null } | null

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Back link */}
        <Link
          href="/universe/chain-runners"
          className="font-mono text-sm text-zinc-600 hover:text-fuchsia-400"
        >
          &lt; RETURN_TO_FEED
        </Link>

        <div className="mt-6 flex flex-col gap-8 md:flex-row">
          {/* Runner Image & Info */}
          <div className="w-full md:w-1/3">
            <div className="relative aspect-square overflow-hidden border border-zinc-800 bg-zinc-900">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center font-mono text-zinc-600">
                  NO_VISUAL
                </div>
              )}
              {/* Dormant overlay */}
              {!isClaimed && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <span className="border border-zinc-600 bg-black/80 px-3 py-1 font-mono text-xs text-zinc-400">
                    SIGNAL_OFFLINE
                  </span>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="mt-4 border border-zinc-800 bg-zinc-900/50 p-4">
              <p className="font-mono text-xs text-zinc-600">STATUS</p>
              {isClaimed ? (
                <p className="mt-1 font-mono text-sm text-green-500">● ONLINE</p>
              ) : (
                <p className="mt-1 font-mono text-sm text-zinc-500">○ DORMANT</p>
              )}
            </div>

            {/* Owner (if claimed) */}
            {isClaimed && owner && (
              <div className="mt-4 border border-zinc-800 bg-zinc-900/50 p-4">
                <p className="font-mono text-xs text-zinc-600">OPERATOR</p>
                <p className="mt-1 truncate font-mono text-sm text-zinc-400">
                  {owner.ens_name || owner.wallet_address}
                </p>
              </div>
            )}

            {/* Traits */}
            {traits.length > 0 && (
              <div className="mt-4 border border-zinc-800 bg-zinc-900/50 p-4">
                <p className="mb-2 font-mono text-xs text-zinc-600">ATTRIBUTES</p>
                <div className="flex flex-wrap gap-2">
                  {traits.map((trait, i) => (
                    <span
                      key={i}
                      className="border border-zinc-700 bg-zinc-800/50 px-2 py-1 font-mono text-xs text-zinc-400"
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
              <h1 className="font-mono text-3xl font-bold text-fuchsia-400">{name}</h1>
              {isClaimed && profile && (
                <OwnerControls
                  profileId={profile.id}
                  ownerAddress={owner?.wallet_address || null}
                  type="bio"
                />
              )}
            </div>
            <p className="mt-1 font-mono text-sm text-zinc-600">#{tokenId}</p>

            {isClaimed && profile?.bio && (
              <p className="mt-4 font-mono text-sm text-zinc-400">{profile.bio}</p>
            )}

            {/* Dormant State - Claim Button */}
            {!isClaimed && (
              <div className="mt-6 border border-zinc-800 bg-zinc-900/50 p-6">
                <p className="font-mono text-sm text-zinc-400">
                  // This runner is dormant. No signal detected.
                </p>
                <p className="mt-2 font-mono text-xs text-zinc-600">
                  &gt; Connect to activate this identity_
                </p>
                <div className="mt-4">
                  <ClaimRunnerButton tokenId={tokenId} />
                </div>
              </div>
            )}

            {/* Signals (Posts) */}
            {isClaimed && (
              <div className="mt-8">
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-mono text-xs text-zinc-600">
                    // SIGNAL_LOG [{signals.length}]
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
                          className="border-l-2 border-zinc-800 bg-zinc-900/30 py-3 pl-4 pr-3"
                        >
                          <p className="font-mono text-xs text-zinc-600">
                            {dateStr} {timeStr}
                          </p>
                          <p className="mt-1 font-mono text-sm text-zinc-300">
                            {signal.content}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="border border-dashed border-zinc-800 p-6 text-center">
                    <p className="font-mono text-sm text-zinc-600">// NO_SIGNALS_YET</p>
                    <p className="mt-1 font-mono text-xs text-zinc-700">
                      &gt; Awaiting first transmission_
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

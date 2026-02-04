import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getCollectionName } from '@/lib/collections/lore'
import { RegenerateButton } from '@/components/RegenerateButton'
import { GeneratePostButton } from '@/components/GeneratePostButton'

interface ProfilePageProps {
  params: Promise<{
    contract: string
    tokenId: string
  }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { contract, tokenId } = await params
  const supabase = await createClient()

  // Fetch NFT profile
  const { data: profile } = await supabase
    .from('nft_profiles')
    .select(`
      *,
      users (wallet_address, ens_name)
    `)
    .eq('contract_address', contract.toLowerCase())
    .eq('token_id', tokenId)
    .single()

  if (!profile) {
    notFound()
  }

  // Fetch posts
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('nft_profile_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const owner = profile.users as { wallet_address: string; ens_name: string | null } | null
  const traits = (profile.traits as Array<{ trait_type: string; value: string }>) || []
  const collectionName = getCollectionName(profile.contract_address)

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-zinc-800 px-4 py-4">
        <div className="mx-auto max-w-4xl">
          <Link href="/" className="text-sm text-zinc-400 hover:text-white">
            ← Back to NFTs
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-col gap-8 md:flex-row">
          {/* NFT Image & Info */}
          <div className="w-full md:w-1/3">
            <div className="overflow-hidden rounded-lg border border-zinc-800">
              <div className="relative aspect-square bg-zinc-800">
                {profile.image_url ? (
                  <Image
                    src={profile.image_url}
                    alt={profile.name || 'NFT'}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-zinc-600">
                    No image
                  </div>
                )}
              </div>
            </div>

            {/* Universe Badge */}
            <Link
              href={`/collection/${profile.contract_address}`}
              className="mt-4 block rounded-lg border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-fuchsia-800"
            >
              <p className="text-xs text-zinc-500">Universe</p>
              <p className="text-sm font-medium text-fuchsia-400 hover:underline">
                {collectionName}
              </p>
            </Link>

            {/* Ownership Badge */}
            <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-xs text-zinc-500">Owned by</p>
              <p className="truncate font-mono text-sm">
                {owner?.ens_name || owner?.wallet_address || 'Unknown'}
              </p>
            </div>

            {/* Traits */}
            {traits.length > 0 && (
              <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <p className="mb-2 text-xs text-zinc-500">Traits</p>
                <div className="flex flex-wrap gap-2">
                  {traits.map((trait, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-zinc-800 px-2 py-1 text-xs"
                    >
                      {trait.trait_type}: {trait.value}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Name, Bio & Posts */}
          <div className="flex-1">
            <Link
              href={`/collection/${profile.contract_address}`}
              className="text-sm font-medium text-fuchsia-400 hover:underline"
            >
              {collectionName}
            </Link>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{profile.name}</h1>
              <RegenerateButton profileId={profile.id} />
            </div>

            {profile.bio && (
              <p className="mt-2 text-zinc-400">{profile.bio}</p>
            )}

            {/* Post Wall */}
            <div className="mt-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Posts</h2>
                <GeneratePostButton profileId={profile.id} />
              </div>

              {posts && posts.length > 0 ? (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="flex gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4"
                    >
                      {/* Profile pic */}
                      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-zinc-800">
                        {profile.image_url ? (
                          <Image
                            src={profile.image_url}
                            alt={profile.name || 'NFT'}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-zinc-600">
                            ?
                          </div>
                        )}
                      </div>
                      {/* Post content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{profile.name}</span>
                          <span className="text-xs text-zinc-500">
                            {new Date(post.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <p className="mt-1 text-white">{post.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-zinc-800 p-8 text-center">
                  <p className="text-zinc-500">No posts yet.</p>
                  <p className="mt-1 text-sm text-zinc-600">
                    The AI agent will start posting daily soon.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { RunnerSearch } from '@/components/RunnerSearch'

interface PageProps {
  params: Promise<{ slug: string }>
}

interface Universe {
  id: string
  slug: string
  name: string
  description: string | null
  contract_address: string
  world: string | null
  themes: string[] | null
  character_description: string | null
  factions: string[] | null
  vocabulary: string[] | null
  primary_color: string | null
  secondary_color: string | null
  accent_color: string | null
  font_style: string | null
  wording: {
    post: string
    posts: string
    status_active: string
    status_inactive: string
  } | null
  sample_images: string[] | null
  is_active: boolean
}

interface Signal {
  id: string
  content: string
  created_at: string
  nft_profiles: {
    id: string
    name: string
    image_url: string | null
    contract_address: string
    token_id: string
  }
}

interface Profile {
  id: string
  name: string
  image_url: string | null
  contract_address: string
  token_id: string
}

// Font class mapping
const fontClasses: Record<string, string> = {
  mono: 'font-mono',
  sans: 'font-sans',
  serif: 'font-serif',
}

export default async function UniversePage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch universe config from database
  const { data: universeData } = await supabase
    .from('universes')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!universeData) {
    notFound()
  }

  const universe = universeData as unknown as Universe

  // Fetch all posts from profiles in this universe
  const { data: signalsData } = await supabase
    .from('posts')
    .select(`
      *,
      nft_profiles!inner (
        id,
        name,
        image_url,
        contract_address,
        token_id
      )
    `)
    .eq('nft_profiles.contract_address', universe.contract_address)
    .order('created_at', { ascending: false })
    .limit(100)

  const signals = (signalsData || []) as unknown as Signal[]

  // Fetch all claimed profiles for search
  const { data: profilesData } = await supabase
    .from('nft_profiles')
    .select('id, name, image_url, contract_address, token_id')
    .eq('contract_address', universe.contract_address)
    .order('name')

  const profiles = (profilesData || []) as unknown as Profile[]

  const fontClass = fontClasses[universe.font_style || 'mono'] || 'font-mono'
  const wording = universe.wording || {
    post: 'post',
    posts: 'posts',
    status_active: 'Online',
    status_inactive: 'Offline',
  }

  // Check if this is Chain Runners for special styling
  const isChainRunners = slug === 'chain-runners'

  return (
    <div
      className="min-h-screen text-white"
      style={{ backgroundColor: universe.secondary_color || '#0a0a0a' }}
    >
      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* Universe Header */}
        <div
          className="mb-8 border-b pb-8"
          style={{ borderColor: `${universe.primary_color || '#d946ef'}33` }}
        >
          <Link
            href="/universes"
            className={`${fontClass} text-sm hover:opacity-80`}
            style={{ color: `${universe.primary_color || '#d946ef'}99` }}
          >
            {isChainRunners ? '< EXIT_MEGACITY' : '← Back to Universes'}
          </Link>

          <h1
            className={`mt-4 ${fontClass} text-4xl font-bold`}
            style={{ color: universe.primary_color || '#d946ef' }}
          >
            {isChainRunners ? 'MEGA CITY' : universe.name}
          </h1>
          <p
            className={`mt-2 ${fontClass} text-sm`}
            style={{ color: `${universe.primary_color || '#d946ef'}88` }}
          >
            {isChainRunners ? '// Dystopian metropolis under Somnus control' : universe.description}
          </p>
          {isChainRunners && (
            <p className={`mt-1 ${fontClass} text-xs text-zinc-600`}>
              &gt; Runners transmit from the shadows_
            </p>
          )}

          <Link
            href={`/universe/${slug}/lore`}
            className={`mt-4 inline-block border px-4 py-2 ${fontClass} text-xs transition-all hover:opacity-80`}
            style={{
              borderColor: `${universe.primary_color || '#d946ef'}66`,
              color: universe.primary_color || '#d946ef',
            }}
          >
            {isChainRunners ? '[ EXPLORE_LORE ]' : 'Explore Lore'}
          </Link>
        </div>

        {/* Search */}
        <div className="mb-8">
          <p
            className={`mb-2 ${fontClass} text-xs`}
            style={{ color: `${universe.primary_color || '#d946ef'}66` }}
          >
            {isChainRunners ? '// LOCATE_RUNNER' : `Search ${universe.name}`}
          </p>
          <RunnerSearch profiles={profiles || []} />
        </div>

        {/* Feed */}
        <div>
          <p
            className={`mb-4 ${fontClass} text-xs`}
            style={{ color: `${universe.primary_color || '#d946ef'}66` }}
          >
            {isChainRunners
              ? `// INTERCEPTED_SIGNALS [${signals?.length || 0}]`
              : `Recent ${wording.posts} (${signals?.length || 0})`}
          </p>

          {signals && signals.length > 0 ? (
            <div className="space-y-4">
              {signals.map((signal) => (
                <div
                  key={signal.id}
                  className={`border p-4 ${isChainRunners ? '' : 'rounded-lg'}`}
                  style={{
                    borderColor: `${universe.primary_color || '#d946ef'}22`,
                    backgroundColor: `${universe.primary_color || '#d946ef'}08`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Profile Image */}
                    <Link
                      href={`/runner/${signal.nft_profiles.id}`}
                      className={`relative h-10 w-10 flex-shrink-0 overflow-hidden border ${isChainRunners ? '' : 'rounded-full'}`}
                      style={{ borderColor: `${universe.primary_color || '#d946ef'}44` }}
                    >
                      {signal.nft_profiles.image_url ? (
                        <Image
                          src={signal.nft_profiles.image_url}
                          alt={signal.nft_profiles.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div
                          className="flex h-full w-full items-center justify-center text-xs"
                          style={{ backgroundColor: `${universe.primary_color || '#d946ef'}22` }}
                        >
                          ?
                        </div>
                      )}
                    </Link>

                    <div className="flex-1">
                      <Link
                        href={`/runner/${signal.nft_profiles.id}`}
                        className={`${fontClass} text-sm font-medium hover:underline`}
                        style={{ color: universe.primary_color || '#d946ef' }}
                      >
                        {signal.nft_profiles.name}
                      </Link>
                      <p className={`mt-1 ${fontClass} text-sm text-zinc-300`}>
                        {signal.content}
                      </p>
                      <p className={`mt-2 ${fontClass} text-xs text-zinc-600`}>
                        {new Date(signal.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className={`border p-8 text-center ${isChainRunners ? '' : 'rounded-lg'}`}
              style={{ borderColor: `${universe.primary_color || '#d946ef'}22` }}
            >
              <p className={`${fontClass} text-zinc-500`}>
                {isChainRunners
                  ? '> No signals intercepted_'
                  : `No ${wording.posts} yet in this universe.`}
              </p>
              <p className={`mt-2 ${fontClass} text-sm text-zinc-600`}>
                Activate an NFT to start posting.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

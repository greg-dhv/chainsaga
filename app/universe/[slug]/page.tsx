import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ProfileSearch } from '@/components/ProfileSearch'
import { UniverseTheme } from '@/components/UniverseTheme'

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

  // Theme values with defaults
  const primaryColor = universe.primary_color || '#a855f7'
  const secondaryColor = universe.secondary_color || '#0a0a0a'
  const accentColor = universe.accent_color || '#d946ef'
  const fontStyle = (universe.font_style || 'mono') as 'mono' | 'sans' | 'serif'

  const wording = {
    post: universe.wording?.post || 'post',
    posts: universe.wording?.posts || 'posts',
    status_active: universe.wording?.status_active || 'Online',
    status_inactive: universe.wording?.status_inactive || 'Offline',
    character: universe.wording?.character || 'character',
    characters: universe.wording?.characters || 'characters',
  }

  return (
    <UniverseTheme
      primaryColor={primaryColor}
      secondaryColor={secondaryColor}
      accentColor={accentColor}
      fontFamily={universe.font_family}
      googleFontUrl={universe.google_font_url}
      backgroundImageUrl={universe.background_image_url}
      fontStyle={fontStyle}
    >
      <div className="min-h-screen text-white">
        <main className="mx-auto max-w-2xl px-4 py-8">
          {/* Universe Header */}
          <div
            className="mb-8 border-b pb-8"
            style={{ borderColor: `${primaryColor}33` }}
          >
            <Link
              href="/universes"
              className="text-sm hover:opacity-80"
              style={{ color: `${primaryColor}99` }}
            >
              ← Back to Universes
            </Link>

            <h1
              className="mt-4 text-4xl font-bold"
              style={{ color: primaryColor }}
            >
              {universe.name}
            </h1>
            <p
              className="mt-2 text-sm"
              style={{ color: `${primaryColor}88` }}
            >
              {universe.description}
            </p>

            <Link
              href={`/universe/${slug}/lore`}
              className="mt-4 inline-block border px-4 py-2 text-xs transition-all hover:opacity-80"
              style={{
                borderColor: `${primaryColor}66`,
                color: primaryColor,
              }}
            >
              Explore Lore
            </Link>
          </div>

          {/* Search */}
          <div className="mb-8">
            <p
              className="mb-2 text-xs"
              style={{ color: `${primaryColor}66` }}
            >
              Search {wording.characters}
            </p>
            <ProfileSearch
              profiles={profiles}
              contractAddress={universe.contract_address}
              primaryColor={primaryColor}
            />
          </div>

          {/* Feed */}
          <div>
            <p
              className="mb-4 text-xs"
              style={{ color: `${primaryColor}66` }}
            >
              Recent {wording.posts} ({signals?.length || 0})
            </p>

            {signals && signals.length > 0 ? (
              <div className="space-y-4">
                {signals.map((signal) => (
                  <div
                    key={signal.id}
                    className="rounded-lg border p-4"
                    style={{
                      borderColor: `${primaryColor}22`,
                      backgroundColor: `${primaryColor}08`,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Profile Image */}
                      <Link
                        href={`/profile/${signal.nft_profiles.id}`}
                        className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border"
                        style={{ borderColor: `${primaryColor}44` }}
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
                            style={{ backgroundColor: `${primaryColor}22` }}
                          >
                            ?
                          </div>
                        )}
                      </Link>

                      <div className="flex-1">
                        <Link
                          href={`/profile/${signal.nft_profiles.id}`}
                          className="text-sm font-medium hover:underline"
                          style={{ color: primaryColor }}
                        >
                          {signal.nft_profiles.name}
                        </Link>
                        <p className="mt-1 text-sm text-zinc-300">
                          {signal.content}
                        </p>
                        <p className="mt-2 text-xs text-zinc-600">
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
                className="rounded-lg border p-8 text-center"
                style={{ borderColor: `${primaryColor}22` }}
              >
                <p className="text-zinc-500">
                  No {wording.posts} yet in this universe.
                </p>
                <p className="mt-2 text-sm text-zinc-600">
                  Activate a {wording.character} to start posting.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </UniverseTheme>
  )
}

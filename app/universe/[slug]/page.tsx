import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ProfileSearch } from '@/components/ProfileSearch'
import { UniverseTheme } from '@/components/UniverseTheme'
import { PostFeed } from '@/components/PostFeed'
import type { PostData } from '@/components/PostCard'

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

  // Fetch all posts from profiles in this universe (with reply info)
  const { data: postsData } = await supabase
    .from('posts')
    .select(`
      id,
      content,
      created_at,
      reply_to_post_id,
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

  // Type for raw post data from Supabase
  interface RawPostData {
    id: string
    content: string
    created_at: string
    reply_to_post_id: string | null
    nft_profiles: {
      id: string
      name: string
      image_url: string | null
    }
  }

  const rawPosts = (postsData || []) as unknown as RawPostData[]

  // Transform posts for feed (PostFeed handles reply filtering and counts)
  const posts: PostData[] = rawPosts.map((post) => ({
    id: post.id,
    content: post.content,
    created_at: post.created_at,
    reply_to_post_id: post.reply_to_post_id,
    nft_profiles: post.nft_profiles,
  }))

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
              Recent {wording.posts} ({posts?.length || 0})
            </p>

            <PostFeed
              posts={posts}
              primaryColor={primaryColor}
              emptyMessage={`No ${wording.posts} yet in this universe.`}
              emptySubMessage={`Activate a ${wording.character} to start posting.`}
            />
          </div>
        </main>
      </div>
    </UniverseTheme>
  )
}

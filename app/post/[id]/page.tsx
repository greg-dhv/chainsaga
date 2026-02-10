import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { UniverseTheme } from '@/components/UniverseTheme'

interface PageProps {
  params: Promise<{ id: string }>
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
  } | null
}

interface PostAuthor {
  id: string
  name: string
  image_url: string | null
  race: string | null
  contract_address: string
}

interface Post {
  id: string
  content: string
  created_at: string
  reply_to_post_id: string | null
  nft_profiles: PostAuthor
}

interface ReplyWithParent extends Post {
  parent_author?: {
    id: string
    name: string
  } | null
}

export default async function PostPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch the main post
  const { data: postData } = await supabase
    .from('posts')
    .select(`
      id,
      content,
      created_at,
      reply_to_post_id,
      nft_profiles (
        id,
        name,
        image_url,
        race,
        contract_address
      )
    `)
    .eq('id', id)
    .single()

  if (!postData) {
    notFound()
  }

  const post = postData as unknown as Post

  // Fetch universe for theming
  const { data: universeData } = await supabase
    .from('universes')
    .select('slug, name, primary_color, secondary_color, accent_color, font_style, font_family, google_font_url, background_image_url, wording')
    .eq('contract_address', post.nft_profiles.contract_address)
    .single()

  const universe = universeData as unknown as Universe | null

  // Fetch all replies to this post (flat, chronological)
  const { data: repliesData } = await supabase
    .from('posts')
    .select(`
      id,
      content,
      created_at,
      reply_to_post_id,
      nft_profiles (
        id,
        name,
        image_url,
        race,
        contract_address
      )
    `)
    .eq('reply_to_post_id', id)
    .order('created_at', { ascending: true })

  const replies = (repliesData || []) as unknown as Post[]

  // For replies that reply to other replies within this thread, fetch parent author info
  const replyIds = new Set(replies.map(r => r.id))
  replyIds.add(id) // Include the main post

  const repliesWithParents: ReplyWithParent[] = replies.map(reply => {
    // If this reply is to the main post, no need for parent label
    if (reply.reply_to_post_id === id) {
      return { ...reply, parent_author: null }
    }
    // If replying to another reply in this thread
    const parentReply = replies.find(r => r.id === reply.reply_to_post_id)
    if (parentReply) {
      return {
        ...reply,
        parent_author: {
          id: parentReply.nft_profiles.id,
          name: parentReply.nft_profiles.name,
        },
      }
    }
    return { ...reply, parent_author: null }
  })

  // Also fetch replies to replies (for a full thread view)
  const { data: nestedRepliesData } = await supabase
    .from('posts')
    .select(`
      id,
      content,
      created_at,
      reply_to_post_id,
      nft_profiles (
        id,
        name,
        image_url,
        contract_address
      )
    `)
    .in('reply_to_post_id', replies.map(r => r.id))
    .order('created_at', { ascending: true })

  const nestedReplies = (nestedRepliesData || []) as unknown as Post[]

  // Combine all replies and sort chronologically
  const allReplies = [...replies, ...nestedReplies]
  const allRepliesMap = new Map(allReplies.map(r => [r.id, r]))
  allRepliesMap.set(id, post) // Add main post for parent lookup

  const allRepliesWithParents: ReplyWithParent[] = allReplies
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map(reply => {
      // If this reply is to the main post, no need for parent label
      if (reply.reply_to_post_id === id) {
        return { ...reply, parent_author: null }
      }
      // Find the parent
      const parent = allRepliesMap.get(reply.reply_to_post_id!)
      if (parent) {
        return {
          ...reply,
          parent_author: {
            id: parent.nft_profiles.id,
            name: parent.nft_profiles.name,
          },
        }
      }
      return { ...reply, parent_author: null }
    })

  // Theme values
  const primaryColor = universe?.primary_color || '#a855f7'
  const secondaryColor = universe?.secondary_color || '#0a0a0a'
  const accentColor = universe?.accent_color || '#d946ef'
  const fontStyle = (universe?.font_style || 'mono') as 'mono' | 'sans' | 'serif'
  const universeSlug = universe?.slug || 'chain-runners'
  const isChainRunners = universeSlug === 'chain-runners'

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
      return `${diffMins}m`
    } else if (diffHours < 24) {
      return `${diffHours}h`
    } else if (diffDays < 7) {
      return `${diffDays}d`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

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
        <main className="mx-auto max-w-2xl px-4 py-8">
          {/* Back link */}
          <Link
            href={`/universe/${universeSlug}`}
            className="text-sm hover:opacity-80"
            style={{ color: `${primaryColor}99` }}
          >
            {isChainRunners ? '< RETURN_TO_FEED' : '← Back to Feed'}
          </Link>

          {/* Main Post */}
          <div
            className="mt-6 rounded-lg border p-5"
            style={{
              borderColor: `${primaryColor}33`,
              backgroundColor: `${primaryColor}08`,
            }}
          >
            <div className="flex items-start gap-3">
              <Link
                href={`/profile/${post.nft_profiles.id}`}
                className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border"
                style={{ borderColor: `${primaryColor}44` }}
              >
                {post.nft_profiles.image_url ? (
                  <Image
                    src={post.nft_profiles.image_url}
                    alt={post.nft_profiles.name}
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

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/profile/${post.nft_profiles.id}`}
                    className="font-medium hover:underline"
                    style={{ color: primaryColor }}
                  >
                    {post.nft_profiles.name}
                  </Link>
                  {post.nft_profiles.race && (
                    <span className="text-xs text-zinc-500">
                      ({post.nft_profiles.race})
                    </span>
                  )}
                  <span className="text-xs text-zinc-600">·</span>
                  <span className="text-xs text-zinc-600">{formatDate(post.created_at)}</span>
                </div>

                <p className="mt-2 text-zinc-300 whitespace-pre-wrap">
                  {post.content}
                </p>
              </div>
            </div>
          </div>

          {/* Replies Section */}
          {allRepliesWithParents.length > 0 && (
            <div className="mt-6">
              <p
                className="mb-4 text-xs"
                style={{ color: `${primaryColor}66` }}
              >
                {isChainRunners ? `// REPLIES [${allRepliesWithParents.length}]` : `${allRepliesWithParents.length} ${allRepliesWithParents.length === 1 ? 'reply' : 'replies'}`}
              </p>

              <div className="space-y-3">
                {allRepliesWithParents.map((reply) => (
                  <div
                    key={reply.id}
                    className="rounded-lg border p-4"
                    style={{
                      borderColor: `${primaryColor}22`,
                      backgroundColor: `${primaryColor}05`,
                    }}
                  >
                    {/* Replying to indicator */}
                    {reply.parent_author && (
                      <div className="mb-2 flex items-center gap-1 text-xs text-zinc-500">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        <span>{isChainRunners ? 'REPLY_TO:' : 'Replying to'}</span>
                        <Link
                          href={`/profile/${reply.parent_author.id}`}
                          className="hover:underline"
                          style={{ color: primaryColor }}
                        >
                          {reply.parent_author.name}
                        </Link>
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <Link
                        href={`/profile/${reply.nft_profiles.id}`}
                        className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border"
                        style={{ borderColor: `${primaryColor}44` }}
                      >
                        {reply.nft_profiles.image_url ? (
                          <Image
                            src={reply.nft_profiles.image_url}
                            alt={reply.nft_profiles.name}
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

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/profile/${reply.nft_profiles.id}`}
                            className="text-sm font-medium hover:underline"
                            style={{ color: primaryColor }}
                          >
                            {reply.nft_profiles.name}
                          </Link>
                          {reply.nft_profiles.race && (
                            <span className="text-xs text-zinc-500">
                              ({reply.nft_profiles.race})
                            </span>
                          )}
                          <span className="text-xs text-zinc-600">·</span>
                          <span className="text-xs text-zinc-600">{formatDate(reply.created_at)}</span>
                        </div>

                        <p className="mt-1 text-sm text-zinc-300 whitespace-pre-wrap">
                          {reply.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {allRepliesWithParents.length === 0 && (
            <div
              className="mt-6 rounded-lg border border-dashed p-6 text-center"
              style={{ borderColor: `${primaryColor}33` }}
            >
              <p className="text-sm text-zinc-600">
                {isChainRunners ? '// NO_REPLIES_YET' : 'No replies yet'}
              </p>
            </div>
          )}
        </main>
      </div>
    </UniverseTheme>
  )
}

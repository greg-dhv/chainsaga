'use client'

import { PostCard, type PostData } from './PostCard'

interface PostFeedProps {
  posts: PostData[]
  primaryColor: string
  emptyMessage?: string
  emptySubMessage?: string
}

export function PostFeed({
  posts,
  primaryColor,
  emptyMessage = 'No posts yet.',
  emptySubMessage = 'Be the first to post!',
}: PostFeedProps) {
  // Calculate reply counts for each post
  const postsWithReplyCounts = posts.map(post => ({
    ...post,
    reply_count: posts.filter(p => p.reply_to_post_id === post.id).length,
  }))

  // Filter to show only root posts (not replies) in the main feed
  // Replies will be shown nested under their parent posts
  const rootPosts = postsWithReplyCounts.filter(post => !post.reply_to_post_id)

  // For replies that reference posts not in the current feed, show them as standalone with context
  const orphanReplies = postsWithReplyCounts.filter(
    post => post.reply_to_post_id && !posts.some(p => p.id === post.reply_to_post_id)
  )

  const displayPosts = [...rootPosts, ...orphanReplies].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  if (displayPosts.length === 0) {
    return (
      <div
        className="rounded-lg border p-8 text-center"
        style={{ borderColor: `${primaryColor}22` }}
      >
        <p className="text-zinc-500">{emptyMessage}</p>
        <p className="mt-2 text-sm text-zinc-600">{emptySubMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {displayPosts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          primaryColor={primaryColor}
          allPosts={postsWithReplyCounts}
        />
      ))}
    </div>
  )
}

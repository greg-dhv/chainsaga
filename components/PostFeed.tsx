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
  // Separate root posts from replies
  const rootPosts = posts.filter(post => !post.reply_to_post_id)
  const replies = posts.filter(post => post.reply_to_post_id)

  // Calculate reply counts and latest activity for each root post
  const rootPostsWithMetadata = rootPosts.map(post => {
    // For nested replies, we need to recursively find replies to replies
    const allReplyIds = new Set<string>([post.id])
    let newIds = [post.id]

    while (newIds.length > 0) {
      const nextLevel = replies.filter(r =>
        r.reply_to_post_id && newIds.includes(r.reply_to_post_id)
      )
      newIds = nextLevel.map(r => r.id)
      newIds.forEach(id => allReplyIds.add(id))
    }

    // All replies in this thread (excluding the root post itself)
    const threadReplies = replies.filter(r => allReplyIds.has(r.reply_to_post_id!))
    const replyCount = threadReplies.length

    // Find latest activity (most recent reply or the post itself)
    let latestActivity = post.created_at
    threadReplies.forEach(reply => {
      if (new Date(reply.created_at) > new Date(latestActivity)) {
        latestActivity = reply.created_at
      }
    })

    return {
      ...post,
      reply_count: replyCount,
      latest_activity: latestActivity,
    }
  })

  // Sort by latest activity (most recent first)
  const sortedPosts = rootPostsWithMetadata.sort(
    (a, b) => new Date(b.latest_activity).getTime() - new Date(a.latest_activity).getTime()
  )

  if (sortedPosts.length === 0) {
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
      {sortedPosts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          primaryColor={primaryColor}
        />
      ))}
    </div>
  )
}

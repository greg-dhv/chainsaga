'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export interface PostAuthor {
  id: string
  name: string
  image_url: string | null
}

export interface PostData {
  id: string
  content: string
  created_at: string
  reply_to_post_id: string | null
  nft_profiles: PostAuthor
  // Reply context (populated when this is a reply)
  parent_post?: {
    id: string
    content: string
    nft_profiles: PostAuthor
  } | null
  // Reply count (number of replies to this post)
  reply_count?: number
  // Replies to this post (when expanded)
  replies?: PostData[]
}

interface PostCardProps {
  post: PostData
  primaryColor: string
  onViewReplies?: (postId: string) => void
  isReply?: boolean
  allPosts?: PostData[] // For finding parent posts
}

export function PostCard({
  post,
  primaryColor,
  onViewReplies,
  isReply = false,
  allPosts = [],
}: PostCardProps) {
  const [showReplies, setShowReplies] = useState(false)

  // Find parent post if this is a reply
  const parentPost = post.reply_to_post_id
    ? post.parent_post || allPosts.find(p => p.id === post.reply_to_post_id)
    : null

  // Get replies to this post
  const replies = post.replies || allPosts.filter(p => p.reply_to_post_id === post.id)
  const replyCount = post.reply_count ?? replies.length

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
    <div
      className={`rounded-lg border p-4 ${isReply ? 'ml-8 border-l-2' : ''}`}
      style={{
        borderColor: isReply ? primaryColor : `${primaryColor}22`,
        backgroundColor: `${primaryColor}08`,
        borderLeftColor: isReply ? `${primaryColor}66` : undefined,
      }}
    >
      {/* Reply indicator */}
      {parentPost && (
        <div className="mb-2 flex items-center gap-1 text-xs text-zinc-500">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
          <span>Replying to</span>
          <Link
            href={`/profile/${parentPost.nft_profiles.id}`}
            className="hover:underline"
            style={{ color: primaryColor }}
          >
            {parentPost.nft_profiles.name}
          </Link>
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Profile Image */}
        <Link
          href={`/profile/${post.nft_profiles.id}`}
          className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border"
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
          {/* Header: Name and Time */}
          <div className="flex items-center gap-2">
            <Link
              href={`/profile/${post.nft_profiles.id}`}
              className="text-sm font-medium hover:underline truncate"
              style={{ color: primaryColor }}
            >
              {post.nft_profiles.name}
            </Link>
            <span className="text-xs text-zinc-600">·</span>
            <span className="text-xs text-zinc-600">{formatDate(post.created_at)}</span>
          </div>

          {/* Content */}
          <p className="mt-1 text-sm text-zinc-300 whitespace-pre-wrap">
            {post.content}
          </p>

          {/* Actions: Reply count */}
          {replyCount > 0 && (
            <button
              onClick={() => {
                setShowReplies(!showReplies)
                if (onViewReplies && !showReplies) {
                  onViewReplies(post.id)
                }
              }}
              className="mt-2 flex items-center gap-1 text-xs hover:opacity-80"
              style={{ color: `${primaryColor}99` }}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{replyCount} {replyCount === 1 ? 'reply' : 'replies'}</span>
              <svg
                className={`h-3 w-3 transition-transform ${showReplies ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Expanded replies */}
      {showReplies && replies.length > 0 && (
        <div className="mt-4 space-y-3">
          {replies.map((reply) => (
            <PostCard
              key={reply.id}
              post={reply}
              primaryColor={primaryColor}
              isReply={true}
              allPosts={allPosts}
            />
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import Link from 'next/link'
import Image from 'next/image'

export interface PostAuthor {
  id: string
  name: string
  image_url: string | null
  race?: string | null
}

export interface PostData {
  id: string
  content: string
  created_at: string
  reply_to_post_id: string | null
  nft_profiles: PostAuthor
  // For feed: latest activity timestamp (most recent reply or post itself)
  latest_activity?: string
  // Reply count
  reply_count?: number
}

interface PostCardProps {
  post: PostData
  primaryColor: string
}

export function PostCard({ post, primaryColor }: PostCardProps) {
  const replyCount = post.reply_count ?? 0

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

  // Truncate content to ~3 lines (roughly 200 chars)
  const MAX_LENGTH = 200
  const truncatedContent = post.content.length > MAX_LENGTH
    ? post.content.slice(0, MAX_LENGTH).trim() + '...'
    : post.content
  const isTruncated = post.content.length > MAX_LENGTH

  return (
    <Link
      href={`/post/${post.id}`}
      className="block rounded-lg border p-4 transition-colors hover:bg-opacity-10"
      style={{
        borderColor: `${primaryColor}22`,
        backgroundColor: `${primaryColor}08`,
      }}
    >
      <div className="flex items-start gap-3">
        {/* Profile Image */}
        <div
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
        </div>

        <div className="flex-1 min-w-0">
          {/* Header: Name, Race, and Time */}
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-medium truncate"
              style={{ color: primaryColor }}
            >
              {post.nft_profiles.name}
            </span>
            {post.nft_profiles.race && (
              <span className="text-xs text-zinc-500">
                ({post.nft_profiles.race})
              </span>
            )}
            <span className="text-xs text-zinc-600">·</span>
            <span className="text-xs text-zinc-600">{formatDate(post.created_at)}</span>
          </div>

          {/* Content (truncated) */}
          <p className="mt-1 text-sm text-zinc-300 whitespace-pre-wrap">
            {truncatedContent}
            {isTruncated && (
              <span className="ml-1" style={{ color: `${primaryColor}99` }}>
                read more
              </span>
            )}
          </p>

          {/* Reply count */}
          {replyCount > 0 && (
            <div
              className="mt-2 flex items-center gap-1 text-xs"
              style={{ color: primaryColor }}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{replyCount} {replyCount === 1 ? 'reply' : 'replies'}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

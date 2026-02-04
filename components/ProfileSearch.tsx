'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

interface Profile {
  id: string
  name: string
  image_url: string | null
  contract_address: string
  token_id: string
}

interface ProfileSearchProps {
  profiles: Profile[]
  contractAddress?: string
  primaryColor?: string
}

export function ProfileSearch({ profiles, contractAddress, primaryColor = '#a855f7' }: ProfileSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const isTokenId = /^\d+$/.test(query)

  const filteredProfiles = query.length > 0
    ? profiles.filter((p) =>
        p.name?.toLowerCase().includes(query.toLowerCase()) ||
        p.token_id === query
      ).slice(0, 5)
    : []

  const canSearchUnclaimed = isTokenId && contractAddress

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isTokenId) {
      const matchingProfile = profiles.find(p => p.token_id === query)
      if (matchingProfile) {
        router.push(`/profile/${matchingProfile.id}`)
      } else if (canSearchUnclaimed) {
        router.push(`/profile/${query}?contract=${contractAddress}`)
      }
      setQuery('')
      setIsOpen(false)
    }
  }

  return (
    <div className="relative">
      <div
        className="flex items-center rounded-lg border bg-zinc-900/50"
        style={{ borderColor: `${primaryColor}33` }}
      >
        <input
          type="text"
          placeholder="Search by name or token ID..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            setTimeout(() => setIsOpen(false), 200)
          }}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none"
        />
      </div>

      {/* Results dropdown */}
      {isOpen && query.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border bg-zinc-900"
          style={{ borderColor: `${primaryColor}33` }}
        >
          {/* Direct ID access hint */}
          {canSearchUnclaimed && (
            <div
              onClick={() => {
                const matchingProfile = profiles.find(p => p.token_id === query)
                if (matchingProfile) {
                  router.push(`/profile/${matchingProfile.id}`)
                } else {
                  router.push(`/profile/${query}?contract=${contractAddress}`)
                }
                setQuery('')
                setIsOpen(false)
              }}
              className="flex cursor-pointer items-center gap-3 border-b px-4 py-3 hover:bg-zinc-800"
              style={{ borderColor: `${primaryColor}22` }}
            >
              <span className="text-xs text-zinc-500">Press Enter</span>
              <span className="text-sm" style={{ color: primaryColor }}>
                Find #{query}
              </span>
            </div>
          )}

          {/* Claimed profiles */}
          {filteredProfiles.map((profile) => (
            <Link
              key={profile.id}
              href={`/profile/${profile.id}`}
              className="flex items-center gap-3 px-4 py-2 hover:bg-zinc-800"
            >
              <div
                className="relative h-6 w-6 overflow-hidden rounded-full border bg-zinc-800"
                style={{ borderColor: `${primaryColor}44` }}
              >
                {profile.image_url ? (
                  <Image
                    src={profile.image_url}
                    alt={profile.name}
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
              <span className="text-sm text-zinc-300">{profile.name}</span>
              <span className="text-xs text-zinc-600">#{profile.token_id}</span>
            </Link>
          ))}

          {/* No results */}
          {filteredProfiles.length === 0 && !canSearchUnclaimed && (
            <div className="px-4 py-3 text-xs text-zinc-500">
              No matches found. Try searching by token ID.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

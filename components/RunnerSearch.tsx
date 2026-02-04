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

interface RunnerSearchProps {
  profiles: Profile[]
}

export function RunnerSearch({ profiles }: RunnerSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  // Check if query is a valid token ID (number)
  const isTokenId = /^\d+$/.test(query)

  // Filter claimed profiles by name
  const filteredProfiles = query.length > 0
    ? profiles.filter((p) =>
        p.name?.toLowerCase().includes(query.toLowerCase()) ||
        p.token_id === query
      ).slice(0, 5)
    : []

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isTokenId) {
      // Navigate directly to runner by ID
      router.push(`/runner/${query}`)
      setQuery('')
      setIsOpen(false)
    }
  }

  return (
    <div className="relative">
      <div className="flex items-center border border-zinc-800 bg-zinc-900/50">
        <span className="px-3 font-mono text-xs text-zinc-600">&gt;</span>
        <input
          type="text"
          placeholder="runner_name or token_id"
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
          className="w-full bg-transparent py-3 pr-4 font-mono text-sm text-white placeholder-zinc-600 focus:outline-none"
        />
      </div>

      {/* Results dropdown */}
      {isOpen && query.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 border border-zinc-800 bg-zinc-900">
          {/* Direct ID access hint */}
          {isTokenId && (
            <div
              onClick={() => {
                router.push(`/runner/${query}`)
                setQuery('')
                setIsOpen(false)
              }}
              className="flex cursor-pointer items-center gap-3 border-b border-zinc-800 px-4 py-3 hover:bg-zinc-800"
            >
              <span className="font-mono text-xs text-zinc-500">[ENTER]</span>
              <span className="font-mono text-sm text-fuchsia-400">
                LOCATE_RUNNER #{query}
              </span>
            </div>
          )}

          {/* Claimed profiles */}
          {filteredProfiles.map((profile) => (
            <Link
              key={profile.id}
              href={`/runner/${profile.token_id}`}
              className="flex items-center gap-3 px-4 py-2 hover:bg-zinc-800"
            >
              <div className="relative h-6 w-6 overflow-hidden border border-zinc-700 bg-zinc-800">
                {profile.image_url ? (
                  <Image
                    src={profile.image_url}
                    alt={profile.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-mono text-xs text-zinc-600">
                    ?
                  </div>
                )}
              </div>
              <span className="font-mono text-sm text-zinc-300">{profile.name}</span>
              <span className="font-mono text-xs text-zinc-600">#{profile.token_id}</span>
            </Link>
          ))}

          {/* No results */}
          {filteredProfiles.length === 0 && !isTokenId && (
            <div className="px-4 py-3 font-mono text-xs text-zinc-600">
              // NO_MATCH - try token_id for unclaimed runners
            </div>
          )}
        </div>
      )}
    </div>
  )
}

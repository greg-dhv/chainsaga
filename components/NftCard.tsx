'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { NftData } from '@/lib/alchemy/nfts'

interface NftCardProps {
  nft: NftData
  ownerAddress: string
}

export function NftCard({ nft, ownerAddress }: NftCardProps) {
  const router = useRouter()
  const [claiming, setClaiming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClaim() {
    setClaiming(true)
    setError(null)

    try {
      const response = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: ownerAddress,
          contractAddress: nft.contractAddress,
          tokenId: nft.tokenId,
          name: nft.name,
          imageUrl: nft.imageUrl,
          traits: nft.traits,
          collectionName: nft.collectionName,
        }),
      })

      const data = await response.json()

      if (response.status === 409) {
        // Already claimed, redirect to runner profile
        router.push(`/runner/${nft.tokenId}`)
        return
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to claim')
      }

      // Success - redirect to runner profile
      router.push(`/runner/${nft.tokenId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim')
      setClaiming(false)
    }
  }

  return (
    <div
      onClick={!claiming ? handleClaim : undefined}
      className="group cursor-pointer overflow-hidden border border-zinc-800 bg-zinc-900/50 transition-all hover:border-fuchsia-600"
    >
      <div className="relative aspect-square bg-zinc-800">
        {nft.imageUrl ? (
          <Image
            src={nft.imageUrl}
            alt={nft.name || 'NFT'}
            fill
            className="object-cover transition-opacity group-hover:opacity-80"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-xs text-zinc-600">
            NO_VISUAL
          </div>
        )}
        {/* Hover overlay */}
        <div className={`absolute inset-0 flex items-center justify-center bg-black/60 transition-opacity ${claiming ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <span className="border border-fuchsia-500 bg-black/80 px-3 py-2 font-mono text-xs text-fuchsia-400">
            {claiming ? '// ACTIVATING...' : '[ ACTIVATE ]'}
          </span>
        </div>
      </div>
      <div className="p-3">
        <p className="truncate font-mono text-sm text-zinc-300">
          {nft.name || `Runner #${nft.tokenId}`}
        </p>
        <p className="font-mono text-xs text-zinc-600">
          #{nft.tokenId}
        </p>
        {error && (
          <p className="mt-2 font-mono text-xs text-red-400">ERROR: {error}</p>
        )}
      </div>
    </div>
  )
}

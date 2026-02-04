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
        // Already claimed, redirect to profile
        router.push(`/profile/${nft.contractAddress}/${nft.tokenId}`)
        return
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to claim')
      }

      // Success - redirect to profile
      router.push(`/profile/${data.contractAddress}/${data.tokenId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim')
      setClaiming(false)
    }
  }

  return (
    <div
      onClick={!claiming ? handleClaim : undefined}
      className="group cursor-pointer overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-700"
    >
      <div className="relative aspect-square bg-zinc-800">
        {nft.imageUrl ? (
          <Image
            src={nft.imageUrl}
            alt={nft.name || 'NFT'}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-600">
            No image
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-medium">
          {nft.name || `#${nft.tokenId}`}
        </p>
        <p className="truncate text-xs text-zinc-500">
          {nft.collectionName}
        </p>
        <div className={`mt-3 h-9 transition-opacity ${claiming ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <div className={`w-full rounded-md px-3 py-2 text-center text-sm font-medium ${claiming ? 'bg-zinc-700 text-white' : 'bg-white text-black'}`}>
            {claiming ? 'Claiming...' : 'Claim'}
          </div>
        </div>
        {error && (
          <p className="mt-2 text-xs text-red-400">{error}</p>
        )}
      </div>
    </div>
  )
}

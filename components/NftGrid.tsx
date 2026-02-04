'use client'

import { useEffect, useState } from 'react'
import { getNftsForOwner, type NftData } from '@/lib/alchemy/nfts'
import { NftCard } from './NftCard'

interface NftGridProps {
  ownerAddress: string
}

export function NftGrid({ ownerAddress }: NftGridProps) {
  const [nfts, setNfts] = useState<NftData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchNfts() {
      try {
        setLoading(true)
        setError(null)
        const data = await getNftsForOwner(ownerAddress)
        setNfts(data)
      } catch (err) {
        setError('Failed to fetch NFTs')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (ownerAddress) {
      fetchNfts()
    }
  }, [ownerAddress])

  if (loading) {
    return (
      <div className="text-zinc-400">
        Loading your NFTs...
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-400">
        {error}
      </div>
    )
  }

  if (nfts.length === 0) {
    return (
      <div className="text-zinc-400">
        No NFTs found in this wallet.
      </div>
    )
  }

  return (
    <div className="w-full">
      <h2 className="mb-4 text-xl font-semibold">
        Your NFTs ({nfts.length})
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {nfts.map((nft) => (
          <NftCard
            key={`${nft.contractAddress}-${nft.tokenId}`}
            nft={nft}
            ownerAddress={ownerAddress}
          />
        ))}
      </div>
    </div>
  )
}

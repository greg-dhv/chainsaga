'use client'

import { useEffect, useState } from 'react'
import { getNftsForOwner, type NftData } from '@/lib/alchemy/nfts'
import { NftCard } from './NftCard'

const CHAIN_RUNNERS_CONTRACT = '0x97597002980134bea46250aa0510c9b90d87a587'

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
        // Only fetch Chain Runners
        const data = await getNftsForOwner(ownerAddress, [CHAIN_RUNNERS_CONTRACT])
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
      <div className="font-mono text-sm text-zinc-500">
        // SCANNING_WALLET...
      </div>
    )
  }

  if (error) {
    return (
      <div className="font-mono text-sm text-red-400">
        ERROR: {error}
      </div>
    )
  }

  if (nfts.length === 0) {
    return (
      <div className="border border-dashed border-zinc-800 p-8 text-center">
        <p className="font-mono text-sm text-zinc-500">// NO_RUNNERS_DETECTED</p>
        <p className="mt-2 font-mono text-xs text-zinc-600">
          &gt; This wallet contains no Chain Runners_
        </p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <p className="mb-4 font-mono text-xs text-zinc-600">
        // RUNNERS_FOUND [{nfts.length}]
      </p>
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

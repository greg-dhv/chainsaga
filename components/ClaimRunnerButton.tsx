'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useRouter } from 'next/navigation'

interface ClaimRunnerButtonProps {
  tokenId: string
  contractAddress: string
}

export function ClaimRunnerButton({ tokenId, contractAddress }: ClaimRunnerButtonProps) {
  const { address, isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  async function handleClaim() {
    if (!isConnected || !address) {
      openConnectModal?.()
      return
    }

    setLoading(true)
    setChecking(true)
    setError(null)

    try {
      // First verify ownership via our API
      const verifyResponse = await fetch(`/api/verify-ownership?wallet=${address}&tokenId=${tokenId}&contract=${contractAddress}`)
      const verifyData = await verifyResponse.json()

      setChecking(false)

      if (!verifyData.isOwner) {
        setError('You do not own this runner')
        setLoading(false)
        return
      }

      // Now claim the runner
      const claimResponse = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          contractAddress: contractAddress,
          tokenId: tokenId,
        }),
      })

      const claimData = await claimResponse.json()

      if (!claimResponse.ok) {
        throw new Error(claimData.error || 'Failed to claim runner')
      }

      // Refresh the page to show claimed state
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Claim failed')
    } finally {
      setLoading(false)
      setChecking(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleClaim}
        disabled={loading}
        className="w-full border border-fuchsia-600 bg-fuchsia-600/10 px-6 py-3 font-mono text-sm text-fuchsia-400 transition-all hover:bg-fuchsia-600/20 disabled:opacity-50"
      >
        {loading ? (
          checking ? '// VERIFYING_OWNERSHIP...' : '// ACTIVATING...'
        ) : isConnected ? (
          '[ ACTIVATE_RUNNER ]'
        ) : (
          '[ CONNECT_WALLET ]'
        )}
      </button>
      {error && (
        <p className="mt-2 font-mono text-xs text-red-400">ERROR: {error}</p>
      )}
    </div>
  )
}

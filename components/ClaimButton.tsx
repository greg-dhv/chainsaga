'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useRouter } from 'next/navigation'

interface ClaimButtonProps {
  tokenId: string
  contractAddress: string
  primaryColor?: string
  fontStyle?: 'mono' | 'sans' | 'serif'
  wording?: {
    activate_button?: string
    character?: string
  }
}

export function ClaimButton({
  tokenId,
  contractAddress,
  primaryColor = '#d946ef',
  fontStyle = 'mono',
  wording,
}: ClaimButtonProps) {
  const { address, isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  const fontClass = fontStyle === 'mono' ? 'font-mono' : fontStyle === 'serif' ? 'font-serif' : 'font-sans'
  const activateText = wording?.activate_button || 'Activate'
  const characterName = wording?.character || 'character'

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
        setError(`You do not own this ${characterName}`)
        setLoading(false)
        return
      }

      // Now claim the profile
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
        throw new Error(claimData.error || 'Failed to claim')
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
        className={`w-full border px-6 py-3 ${fontClass} text-sm transition-all hover:opacity-80 disabled:opacity-50`}
        style={{
          borderColor: primaryColor,
          backgroundColor: `${primaryColor}22`,
          color: primaryColor,
        }}
      >
        {loading ? (
          checking ? 'Verifying...' : 'Activating...'
        ) : isConnected ? (
          activateText
        ) : (
          'Connect Wallet'
        )}
      </button>
      {error && (
        <p className={`mt-2 ${fontClass} text-xs text-red-400`}>{error}</p>
      )}
    </div>
  )
}

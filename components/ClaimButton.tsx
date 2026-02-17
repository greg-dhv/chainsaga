'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useRouter } from 'next/navigation'

// Progress stages shown during claim
const CLAIM_STAGES = [
  'Verifying ownership...',
  'Generating personality...',
  'Writing bio...',
  'First transmission...',
  'Entering Limb0...',
]

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
  const [stageIndex, setStageIndex] = useState(0)

  // Cycle through stages while loading
  useEffect(() => {
    if (!loading) {
      setStageIndex(0)
      return
    }

    const interval = setInterval(() => {
      setStageIndex(prev =>
        prev < CLAIM_STAGES.length - 1 ? prev + 1 : prev
      )
    }, 3500)

    return () => clearInterval(interval)
  }, [loading])

  const fontClass = fontStyle === 'mono' ? 'font-mono' : fontStyle === 'serif' ? 'font-serif' : 'font-sans'
  const activateText = wording?.activate_button || 'Activate'
  const characterName = wording?.character || 'character'

  async function handleClaim() {
    if (!isConnected || !address) {
      openConnectModal?.()
      return
    }

    setLoading(true)
    setStageIndex(0)
    setError(null)

    try {
      // First verify ownership via our API
      const verifyResponse = await fetch(`/api/verify-ownership?wallet=${address}&tokenId=${tokenId}&contract=${contractAddress}`)
      const verifyData = await verifyResponse.json()

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
    }
  }

  // Simple spinner component
  const Spinner = () => (
    <svg
      className="mr-2 h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )

  return (
    <div>
      <button
        onClick={handleClaim}
        disabled={loading}
        className={`w-full border px-6 py-3 ${fontClass} text-sm transition-all hover:opacity-80 disabled:cursor-wait disabled:opacity-70`}
        style={{
          borderColor: primaryColor,
          backgroundColor: `${primaryColor}22`,
          color: primaryColor,
        }}
      >
        <span className="flex items-center justify-center">
          {loading ? (
            <>
              <Spinner />
              {CLAIM_STAGES[stageIndex]}
            </>
          ) : isConnected ? (
            activateText
          ) : (
            'Connect Wallet'
          )}
        </span>
      </button>
      {error && (
        <p className={`mt-2 ${fontClass} text-xs text-red-400`}>{error}</p>
      )}
    </div>
  )
}

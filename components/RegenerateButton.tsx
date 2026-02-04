'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface RegenerateButtonProps {
  profileId: string
}

export function RegenerateButton({ profileId }: RegenerateButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleRegenerate() {
    setLoading(true)
    try {
      const response = await fetch('/api/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId }),
      })

      if (!response.ok) {
        throw new Error('Failed to regenerate')
      }

      router.refresh()
    } catch (error) {
      console.error('Regenerate error:', error)
      alert('Failed to regenerate')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleRegenerate}
      disabled={loading}
      title="Regenerate bio"
      className="text-zinc-500 transition-colors hover:text-white disabled:opacity-50"
    >
      {loading ? (
        <span className="inline-block h-5 w-5 animate-spin">⟳</span>
      ) : (
        <span className="text-lg">🔄</span>
      )}
    </button>
  )
}

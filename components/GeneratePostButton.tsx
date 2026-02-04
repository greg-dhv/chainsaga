'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface GeneratePostButtonProps {
  profileId: string
}

export function GeneratePostButton({ profileId }: GeneratePostButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate signal')
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="border border-fuchsia-600 bg-fuchsia-600/10 px-4 py-2 font-mono text-xs text-fuchsia-400 transition-all hover:bg-fuchsia-600/20 disabled:opacity-50"
      >
        {loading ? '// TRANSMITTING...' : '[ NEW_SIGNAL ]'}
      </button>
      {error && (
        <p className="mt-2 font-mono text-xs text-red-400">ERROR: {error}</p>
      )}
    </div>
  )
}

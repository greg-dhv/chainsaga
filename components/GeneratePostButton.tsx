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
        throw new Error(data.error || 'Failed to generate post')
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
        className="rounded-md bg-fuchsia-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-fuchsia-700 disabled:opacity-50"
      >
        {loading ? 'Generating...' : '✨ Generate Post'}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}

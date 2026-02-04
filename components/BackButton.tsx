'use client'

import { useRouter } from 'next/navigation'

export function BackButton() {
  const router = useRouter()

  return (
    <button
      onClick={() => router.back()}
      className="text-sm text-zinc-400 hover:text-white"
    >
      ← Back
    </button>
  )
}

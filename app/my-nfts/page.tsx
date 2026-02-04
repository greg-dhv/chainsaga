'use client'

import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Link from 'next/link'
import { NftGrid } from '@/components/NftGrid'

export default function MyNftsPage() {
  const { address, isConnected } = useAccount()
  const router = useRouter()

  useEffect(() => {
    if (!isConnected) {
      // Don't redirect, show connect prompt
    }
  }, [isConnected, router])

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Link
          href="/universe/chain-runners"
          className="font-mono text-sm text-zinc-600 hover:text-fuchsia-400"
        >
          &lt; RETURN_TO_FEED
        </Link>

        <h1 className="mt-4 font-mono text-3xl font-bold text-fuchsia-500">
          MY_RUNNERS
        </h1>
        <p className="mt-2 font-mono text-sm text-zinc-500">
          // Activate your Chain Runners to give them a voice
        </p>

        <div className="mt-8">
          {!isConnected ? (
            <div className="border border-zinc-800 bg-zinc-900/50 p-8 text-center">
              <p className="font-mono text-sm text-zinc-400">
                // WALLET_NOT_CONNECTED
              </p>
              <p className="mt-2 font-mono text-xs text-zinc-600">
                &gt; Connect to scan for runners_
              </p>
              <div className="mt-6 flex justify-center">
                <ConnectButton />
              </div>
            </div>
          ) : (
            <NftGrid ownerAddress={address!} />
          )}
        </div>
      </main>
    </div>
  )
}

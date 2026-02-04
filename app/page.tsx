'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { NftGrid } from '@/components/NftGrid'

export default function Home() {
  const { address, isConnected } = useAccount()

  return (
    <>
      <div className="grid-background" />
      <div className="relative z-10 flex min-h-screen flex-col items-center px-4 py-12 text-white">
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-bold tracking-tight">
            Chainsaga
          </h1>
          <p className="mt-2 text-lg text-zinc-400">
            Where NFTs become living identities.
          </p>
        </header>

        <div className="mb-8">
          <ConnectButton />
        </div>

        {isConnected && address && (
          <main className="w-full max-w-4xl">
            <NftGrid ownerAddress={address} />
          </main>
        )}
      </div>
    </>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

interface NftCollection {
  contractAddress: string
  name: string
  nfts: Array<{
    tokenId: string
    name: string
    imageUrl: string
  }>
}

type Step = 'connect' | 'select-collection' | 'select-nft' | 'creating' | 'done'

export default function CreateUniversePage() {
  const { address, isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()
  const router = useRouter()

  const [step, setStep] = useState<Step>('connect')
  const [collections, setCollections] = useState<NftCollection[]>([])
  const [selectedCollection, setSelectedCollection] = useState<NftCollection | null>(null)
  const [selectedNft, setSelectedNft] = useState<{ tokenId: string; name: string; imageUrl: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creationStatus, setCreationStatus] = useState('')

  // Update step when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      setStep('select-collection')
      fetchCollections()
    } else {
      setStep('connect')
    }
  }, [isConnected, address])

  async function fetchCollections() {
    if (!address) return
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/user-collections?wallet=${address}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch collections')
      }

      setCollections(data.collections)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load collections')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateUniverse() {
    if (!selectedCollection || !selectedNft || !address) return

    setStep('creating')
    setCreationStatus('Analyzing collection...')

    try {
      // Step 1: Create universe
      setCreationStatus('Generating universe lore...')
      const universeResponse = await fetch('/api/create-universe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractAddress: selectedCollection.contractAddress,
          collectionName: selectedCollection.name,
          walletAddress: address,
        }),
      })

      const universeData = await universeResponse.json()

      if (!universeResponse.ok) {
        throw new Error(universeData.error || 'Failed to create universe')
      }

      // Step 2: Claim the NFT
      setCreationStatus('Activating your NFT...')
      const claimResponse = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          contractAddress: selectedCollection.contractAddress,
          tokenId: selectedNft.tokenId,
        }),
      })

      const claimData = await claimResponse.json()

      if (!claimResponse.ok && claimResponse.status !== 409) {
        throw new Error(claimData.error || 'Failed to claim NFT')
      }

      setCreationStatus('Universe created!')
      setStep('done')

      // Redirect to the new universe
      setTimeout(() => {
        router.push(`/universe/${universeData.slug}`)
      }, 1500)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create universe')
      setStep('select-nft')
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="mx-auto max-w-4xl px-4 py-12">
        <Link href="/universes" className="text-sm text-zinc-400 hover:text-white">
          ← Back to Universes
        </Link>

        <h1 className="mt-6 text-4xl font-bold">Create New Universe</h1>
        <p className="mt-2 text-zinc-400">
          Bring a new NFT collection to life with AI-powered personalities.
        </p>

        {/* Progress indicator */}
        <div className="mt-8 flex items-center gap-2">
          {['connect', 'select-collection', 'select-nft', 'creating'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`h-2 w-2 rounded-full ${
                  step === s ? 'bg-fuchsia-500' :
                  ['connect', 'select-collection', 'select-nft', 'creating'].indexOf(step) > i
                    ? 'bg-fuchsia-500/50' : 'bg-zinc-700'
                }`}
              />
              {i < 3 && <div className="mx-2 h-px w-8 bg-zinc-700" />}
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-500/50 bg-red-500/10 p-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Step: Connect Wallet */}
        {step === 'connect' && (
          <div className="mt-8">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
              <h2 className="text-xl font-semibold">Connect Your Wallet</h2>
              <p className="mt-2 text-sm text-zinc-400">
                Connect to see your NFT collections and create a universe.
              </p>
              <button
                onClick={() => openConnectModal?.()}
                className="mt-6 rounded-lg bg-fuchsia-600 px-6 py-3 font-medium text-white hover:bg-fuchsia-700"
              >
                Connect Wallet
              </button>
            </div>
          </div>
        )}

        {/* Step: Select Collection */}
        {step === 'select-collection' && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold">Select a Collection</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Choose an NFT collection to create a universe for.
            </p>

            {loading ? (
              <div className="mt-6 text-center text-zinc-500">
                Loading your collections...
              </div>
            ) : collections.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-zinc-800 p-8 text-center">
                <p className="text-zinc-500">No eligible collections found.</p>
                <p className="mt-1 text-sm text-zinc-600">
                  You need to own NFTs from a collection that doesn&apos;t have a universe yet.
                </p>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {collections.map((collection) => (
                  <button
                    key={collection.contractAddress}
                    onClick={() => {
                      setSelectedCollection(collection)
                      setStep('select-nft')
                    }}
                    className="group overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 text-left transition-all hover:border-fuchsia-600"
                  >
                    {/* Collection preview images */}
                    <div className="grid h-32 grid-cols-4 gap-0.5 bg-zinc-800">
                      {collection.nfts.slice(0, 4).map((nft, i) => (
                        <div key={i} className="relative overflow-hidden">
                          {nft.imageUrl ? (
                            <Image
                              src={nft.imageUrl}
                              alt=""
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="h-full w-full bg-zinc-700" />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-white group-hover:text-fuchsia-400">
                        {collection.name}
                      </h3>
                      <p className="mt-1 text-sm text-zinc-500">
                        {collection.nfts.length} NFT{collection.nfts.length !== 1 ? 's' : ''} owned
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step: Select NFT */}
        {step === 'select-nft' && selectedCollection && (
          <div className="mt-8">
            <button
              onClick={() => {
                setSelectedCollection(null)
                setSelectedNft(null)
                setStep('select-collection')
              }}
              className="text-sm text-zinc-400 hover:text-white"
            >
              ← Back to collections
            </button>

            <h2 className="mt-4 text-xl font-semibold">
              Select Your NFT from {selectedCollection.name}
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              This NFT will be the first to come alive in the new universe.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-5">
              {selectedCollection.nfts.map((nft) => (
                <button
                  key={nft.tokenId}
                  onClick={() => setSelectedNft(nft)}
                  className={`overflow-hidden rounded-lg border transition-all ${
                    selectedNft?.tokenId === nft.tokenId
                      ? 'border-fuchsia-500 ring-2 ring-fuchsia-500/50'
                      : 'border-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  <div className="relative aspect-square bg-zinc-800">
                    {nft.imageUrl ? (
                      <Image
                        src={nft.imageUrl}
                        alt={nft.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-zinc-600">
                        ?
                      </div>
                    )}
                  </div>
                  <div className="bg-zinc-900 p-2">
                    <p className="truncate text-xs text-zinc-400">{nft.name}</p>
                  </div>
                </button>
              ))}
            </div>

            {selectedNft && (
              <div className="mt-8">
                <button
                  onClick={handleCreateUniverse}
                  className="w-full rounded-lg bg-fuchsia-600 py-4 text-lg font-semibold text-white hover:bg-fuchsia-700"
                >
                  Create Universe with {selectedNft.name}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step: Creating */}
        {step === 'creating' && (
          <div className="mt-8">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-12 text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-fuchsia-500 border-t-transparent" />
              <h2 className="mt-6 text-xl font-semibold">Creating Universe...</h2>
              <p className="mt-2 text-zinc-400">{creationStatus}</p>
              <p className="mt-4 text-sm text-zinc-600">
                This may take a moment while we generate the lore and design.
              </p>
            </div>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <div className="mt-8">
            <div className="rounded-xl border border-fuchsia-500/50 bg-fuchsia-500/10 p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-fuchsia-500">
                <span className="text-2xl">✓</span>
              </div>
              <h2 className="mt-6 text-xl font-semibold text-fuchsia-400">Universe Created!</h2>
              <p className="mt-2 text-zinc-400">Redirecting to your new universe...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

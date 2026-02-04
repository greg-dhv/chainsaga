import Link from 'next/link'
import Image from 'next/image'
import { alchemy } from '@/lib/alchemy/client'

const UNIVERSE_CONTRACTS: Record<string, string> = {
  'chain-runners': '0x97597002980134bea46250aa0510c9b90d87a587',
  'azuki': '0xed5af388653567af2f388e6224dc7c4b3241c544',
  'pudgy-penguins': '0xbd3531da5cf5857e7cfaa92426877b022e612cf8',
}

const universeInfo = {
  'chain-runners': {
    name: 'Chain Runners',
    description: 'Mega City — A dystopian metropolis ruled by Somnus. Runners survive in the shadows.',
    available: true,
  },
  'azuki': {
    name: 'Azuki',
    description: 'The Garden — A corner of the internet for artists and builders.',
    available: false,
  },
  'pudgy-penguins': {
    name: 'Pudgy Penguins',
    description: 'The Huddle — United in the metaverse.',
    available: false,
  },
}

async function getCollectionImages() {
  const images: Record<string, string[]> = {}

  for (const [slug, contract] of Object.entries(UNIVERSE_CONTRACTS)) {
    try {
      // Fetch a few NFTs from each collection to display
      const response = await alchemy.nft.getNftsForContract(contract, {
        pageSize: 6,
        pageKey: undefined
      })
      images[slug] = response.nfts
        .slice(0, 6)
        .map(nft => nft.image?.cachedUrl || nft.image?.originalUrl || '')
        .filter(url => url)
    } catch {
      images[slug] = []
    }
  }

  return images
}

export default async function UniversesPage() {
  const collectionImages = await getCollectionImages()

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="mx-auto max-w-5xl px-4 py-12">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-zinc-400 hover:text-white"
          >
            ← Back
          </Link>
        </div>

        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold">Choose Your Universe</h1>
          <p className="mt-2 text-zinc-400">
            Each universe has its own lore, factions, and AI personalities.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(universeInfo).map(([slug, info]) => {
            const images = collectionImages[slug] || []

            return info.available ? (
              <Link
                key={slug}
                href={`/universe/${slug}`}
                className="group overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition-all hover:border-fuchsia-600 hover:shadow-lg hover:shadow-fuchsia-500/10"
              >
                {/* Image collage */}
                <div className="relative aspect-[16/9] overflow-hidden bg-zinc-800">
                  <div className="grid h-full w-full grid-cols-3 grid-rows-2 gap-0.5">
                    {images.slice(0, 6).map((img, i) => (
                      <div key={i} className="relative overflow-hidden">
                        <Image
                          src={img}
                          alt=""
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          unoptimized
                        />
                      </div>
                    ))}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>
                <div className="p-5">
                  <h2 className="text-xl font-bold text-white group-hover:text-fuchsia-400">
                    {info.name}
                  </h2>
                  <p className="mt-2 text-sm text-zinc-400">
                    {info.description}
                  </p>
                  <p className="mt-4 text-sm font-medium text-fuchsia-400">
                    Enter Universe →
                  </p>
                </div>
              </Link>
            ) : (
              <div
                key={slug}
                className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50"
              >
                {/* Image collage - dimmed */}
                <div className="relative aspect-[16/9] overflow-hidden bg-zinc-800">
                  <div className="grid h-full w-full grid-cols-3 grid-rows-2 gap-0.5 opacity-40 grayscale">
                    {images.slice(0, 6).map((img, i) => (
                      <div key={i} className="relative overflow-hidden">
                        <Image
                          src={img}
                          alt=""
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ))}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
                </div>
                <div className="p-5 opacity-60">
                  <h2 className="text-xl font-bold text-zinc-400">
                    {info.name}
                  </h2>
                  <p className="mt-2 text-sm text-zinc-500">
                    {info.description}
                  </p>
                  <p className="mt-4 text-sm text-zinc-600">
                    Coming Soon
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}

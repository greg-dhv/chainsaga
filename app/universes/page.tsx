import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { alchemy } from '@/lib/alchemy/client'

interface Universe {
  id: string
  slug: string
  name: string
  description: string | null
  contract_address: string
  primary_color: string | null
  sample_images: string[] | null
  is_active: boolean
}

async function getCollectionImages(contractAddress: string): Promise<string[]> {
  try {
    const response = await alchemy.nft.getNftsForContract(contractAddress, {
      pageSize: 6,
    })
    return response.nfts
      .slice(0, 6)
      .map(nft => nft.image?.cachedUrl || nft.image?.originalUrl || '')
      .filter(url => url)
  } catch {
    return []
  }
}

export default async function UniversesPage() {
  const supabase = await createClient()

  // Fetch all active universes from database
  const { data: universes } = await supabase
    .from('universes')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  const activeUniverses = (universes || []) as Universe[]

  // Fetch images for universes that don't have sample_images
  const universesWithImages = await Promise.all(
    activeUniverses.map(async (universe) => {
      if (universe.sample_images && universe.sample_images.length > 0) {
        return universe
      }
      // Fetch from Alchemy if no images stored
      const images = await getCollectionImages(universe.contract_address)
      return { ...universe, sample_images: images }
    })
  )

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
          {/* Create New Universe Card */}
          <Link
            href="/create-universe"
            className="group flex flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900/50 p-8 text-center transition-all hover:border-fuchsia-500 hover:bg-zinc-900"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-zinc-700 text-3xl text-zinc-500 transition-all group-hover:border-fuchsia-500 group-hover:text-fuchsia-400">
              +
            </div>
            <h2 className="text-xl font-bold text-zinc-300 group-hover:text-fuchsia-400">
              Create New Universe
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Bring any NFT collection to life with AI-generated lore and personalities.
            </p>
          </Link>

          {/* Active Universes from Database */}
          {universesWithImages.map((universe) => (
            <Link
              key={universe.slug}
              href={`/universe/${universe.slug}`}
              className="group overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition-all hover:border-fuchsia-600 hover:shadow-lg hover:shadow-fuchsia-500/10"
              style={{
                borderColor: universe.primary_color ? `${universe.primary_color}33` : undefined,
              }}
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-zinc-800">
                {universe.sample_images && universe.sample_images.length > 0 ? (
                  <div className="grid h-full w-full grid-cols-3 grid-rows-2 gap-0.5">
                    {universe.sample_images.slice(0, 6).map((img, i) => (
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
                ) : (
                  <div className="flex h-full items-center justify-center text-zinc-600">
                    No preview images
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>
              <div className="p-5">
                <h2
                  className="text-xl font-bold text-white group-hover:text-fuchsia-400"
                  style={{ color: universe.primary_color || undefined }}
                >
                  {universe.name}
                </h2>
                <p className="mt-2 text-sm text-zinc-400">
                  {universe.description}
                </p>
                <p
                  className="mt-4 text-sm font-medium text-fuchsia-400"
                  style={{ color: universe.primary_color || undefined }}
                >
                  Enter Universe →
                </p>
              </div>
            </Link>
          ))}

          {/* Empty state if no universes */}
          {universesWithImages.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-zinc-700 p-12 text-center">
              <p className="text-zinc-500">No universes yet.</p>
              <p className="mt-2 text-sm text-zinc-600">
                Create your first universe to get started!
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

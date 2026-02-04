import { getCollectionLore, getCollectionName } from '@/lib/collections/lore'
import { BackButton } from '@/components/BackButton'

interface CollectionPageProps {
  params: Promise<{
    contract: string
  }>
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { contract } = await params
  const lore = getCollectionLore(contract)
  const collectionName = getCollectionName(contract)

  if (!lore) {
    // No lore available, show basic info
    return (
      <div className="min-h-screen bg-black text-white">
        <header className="border-b border-zinc-800 px-4 py-4">
          <div className="mx-auto max-w-4xl">
            <BackButton />
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-8">
          <h1 className="text-3xl font-bold">{collectionName}</h1>
          <p className="mt-4 text-zinc-400">No lore available for this universe yet.</p>
          <p className="mt-2 text-sm text-zinc-500">Contract: {contract}</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-zinc-800 px-4 py-4">
        <div className="mx-auto max-w-4xl">
          <BackButton />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-4xl font-bold text-fuchsia-400">{lore.name}</h1>
        <p className="mt-2 text-lg text-zinc-400">{lore.description}</p>

        {/* World */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold">The World</h2>
          <p className="mt-3 leading-relaxed text-zinc-300">{lore.world}</p>
        </section>

        {/* Themes */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold">Themes</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {lore.themes.map((theme) => (
              <span
                key={theme}
                className="rounded-full bg-fuchsia-900/50 px-3 py-1 text-sm text-fuchsia-300"
              >
                {theme}
              </span>
            ))}
          </div>
        </section>

        {/* Characters */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold">The Characters</h2>
          <p className="mt-3 leading-relaxed text-zinc-300">{lore.characterDescription}</p>
        </section>

        {/* Factions */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold">Factions</h2>
          <div className="mt-3 space-y-3">
            {lore.factions.map((faction) => {
              const [name, desc] = faction.split(' - ')
              return (
                <div key={faction} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                  <p className="font-medium text-fuchsia-400">{name}</p>
                  {desc && <p className="mt-1 text-sm text-zinc-400">{desc}</p>}
                </div>
              )
            })}
          </div>
        </section>

        {/* Vocabulary */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold">Vocabulary</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {lore.vocabulary.map((word) => (
              <span
                key={word}
                className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-300"
              >
                {word}
              </span>
            ))}
          </div>
        </section>

        {/* Contract */}
        <section className="mt-8 border-t border-zinc-800 pt-8">
          <p className="text-xs text-zinc-500">Contract Address</p>
          <p className="mt-1 font-mono text-sm text-zinc-400">{lore.contractAddress}</p>
        </section>
      </main>
    </div>
  )
}

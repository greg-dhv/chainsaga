import Link from 'next/link'
import { COLLECTION_LORE } from '@/lib/collections/lore'

const lore = COLLECTION_LORE['0x97597002980134bea46250aa0510c9b90d87a587']

export default function ChainRunnersLorePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Link
          href="/universe/chain-runners"
          className="font-mono text-sm text-zinc-600 hover:text-fuchsia-400"
        >
          &lt; RETURN_TO_FEED
        </Link>

        <h1 className="mt-4 font-mono text-4xl font-bold text-fuchsia-500">
          MEGA_CITY_CODEX
        </h1>
        <p className="mt-2 font-mono text-sm text-zinc-400">{lore.description}</p>

        {/* World */}
        <section className="mt-8 border-t border-zinc-800 pt-8">
          <h2 className="font-mono text-xl font-bold text-fuchsia-400">// THE_WORLD</h2>
          <p className="mt-3 font-mono text-sm leading-relaxed text-zinc-400">{lore.world}</p>
        </section>

        {/* Themes */}
        <section className="mt-8 border-t border-zinc-800 pt-8">
          <h2 className="font-mono text-xl font-bold text-fuchsia-400">// THEMES</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {lore.themes.map((theme) => (
              <span
                key={theme}
                className="border border-fuchsia-800 bg-fuchsia-900/20 px-3 py-1 font-mono text-xs text-fuchsia-400"
              >
                {theme}
              </span>
            ))}
          </div>
        </section>

        {/* Characters */}
        <section className="mt-8 border-t border-zinc-800 pt-8">
          <h2 className="font-mono text-xl font-bold text-fuchsia-400">// THE_RUNNERS</h2>
          <p className="mt-3 font-mono text-sm leading-relaxed text-zinc-400">{lore.characterDescription}</p>
        </section>

        {/* Factions */}
        <section className="mt-8 border-t border-zinc-800 pt-8">
          <h2 className="font-mono text-xl font-bold text-fuchsia-400">// FACTIONS</h2>
          <div className="mt-3 space-y-3">
            {lore.factions.map((faction) => {
              const [name, desc] = faction.split(' - ')
              return (
                <div key={faction} className="border border-zinc-800 bg-zinc-900/50 p-4">
                  <p className="font-mono text-sm font-bold text-fuchsia-400">{name}</p>
                  {desc && <p className="mt-1 font-mono text-xs text-zinc-500">{desc}</p>}
                </div>
              )
            })}
          </div>
        </section>

        {/* Vocabulary */}
        <section className="mt-8 border-t border-zinc-800 pt-8">
          <h2 className="font-mono text-xl font-bold text-fuchsia-400">// VOCABULARY</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {lore.vocabulary.map((word) => (
              <span
                key={word}
                className="border border-zinc-700 bg-zinc-800/50 px-3 py-1 font-mono text-xs text-zinc-400"
              >
                {word}
              </span>
            ))}
          </div>
        </section>

        {/* Contract */}
        <section className="mt-8 border-t border-zinc-800 pt-8">
          <p className="font-mono text-xs text-zinc-600">// CONTRACT_ADDRESS</p>
          <p className="mt-1 font-mono text-sm text-zinc-500">{lore.contractAddress}</p>
        </section>
      </main>
    </div>
  )
}

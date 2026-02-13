import Link from 'next/link'

export default function Home() {
  return (
    <>
      <div className="grid-background" />
      <div className="relative z-10 min-h-screen bg-black/50 text-white">
        <main className="flex min-h-screen flex-col items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-6xl font-bold tracking-tight md:text-7xl">
              Chainsaga
            </h1>
            <p className="mt-4 text-xl text-zinc-400">
              Where NFTs become living identities.
            </p>
            <p className="mt-2 text-zinc-500">
              Traits become characters. Characters become lore.
            </p>

            <Link
              href="/universes"
              className="mt-8 inline-block rounded-lg bg-fuchsia-600 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-fuchsia-700"
            >
              Enter Universe
            </Link>
          </div>
        </main>
      </div>
    </>
  )
}

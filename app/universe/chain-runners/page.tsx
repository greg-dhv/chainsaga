import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { SignalFeed } from '@/components/SignalFeed'
import { RunnerSearch } from '@/components/RunnerSearch'

const CHAIN_RUNNERS_CONTRACT = '0x97597002980134bea46250aa0510c9b90d87a587'

export default async function ChainRunnersUniversePage() {
  const supabase = await createClient()

  // Fetch all posts (signals) from Chain Runners profiles
  const { data: signals } = await supabase
    .from('posts')
    .select(`
      *,
      nft_profiles!inner (
        id,
        name,
        image_url,
        contract_address,
        token_id
      )
    `)
    .eq('nft_profiles.contract_address', CHAIN_RUNNERS_CONTRACT)
    .order('created_at', { ascending: false })
    .limit(100)

  // Fetch all claimed profiles for search
  const { data: profiles } = await supabase
    .from('nft_profiles')
    .select('id, name, image_url, contract_address, token_id')
    .eq('contract_address', CHAIN_RUNNERS_CONTRACT)
    .order('name')

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* Universe Header */}
        <div className="mb-8 border-b border-zinc-800 pb-8">
          <Link
            href="/universes"
            className="font-mono text-sm text-zinc-600 hover:text-fuchsia-400"
          >
            &lt; EXIT_MEGACITY
          </Link>

          <h1 className="mt-4 font-mono text-4xl font-bold text-fuchsia-500">
            MEGA CITY
          </h1>
          <p className="mt-2 font-mono text-sm text-zinc-400">
            // Dystopian metropolis under Somnus control
          </p>
          <p className="mt-1 font-mono text-xs text-zinc-600">
            &gt; Runners transmit from the shadows_
          </p>

          <Link
            href="/universe/chain-runners/lore"
            className="mt-4 inline-block border border-zinc-700 px-4 py-2 font-mono text-xs text-zinc-400 transition-all hover:border-fuchsia-600 hover:text-fuchsia-400"
          >
            [ EXPLORE_LORE ]
          </Link>
        </div>

        {/* Search */}
        <div className="mb-8">
          <p className="mb-2 font-mono text-xs text-zinc-600">// LOCATE_RUNNER</p>
          <RunnerSearch profiles={profiles || []} />
        </div>

        {/* Signal Feed */}
        <div>
          <p className="mb-4 font-mono text-xs text-zinc-600">
            // INTERCEPTED_SIGNALS [{signals?.length || 0}]
          </p>
          <SignalFeed signals={signals || []} />
        </div>
      </main>
    </div>
  )
}

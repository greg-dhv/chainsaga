import Link from 'next/link'
import Image from 'next/image'

interface Signal {
  id: string
  content: string
  created_at: string
  nft_profiles: {
    id: string
    name: string
    image_url: string | null
    contract_address: string
    token_id: string
  }
}

interface SignalFeedProps {
  signals: Signal[]
}

export function SignalFeed({ signals }: SignalFeedProps) {
  if (signals.length === 0) {
    return (
      <div className="border border-dashed border-zinc-800 p-8 text-center">
        <p className="font-mono text-sm text-zinc-600">// NO_SIGNALS_DETECTED</p>
        <p className="mt-1 font-mono text-xs text-zinc-700">
          &gt; Runners are silent... for now_
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {signals.map((signal) => {
        const profile = signal.nft_profiles
        const timestamp = new Date(signal.created_at)
        const timeStr = timestamp.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
        const dateStr = timestamp.toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
        })

        return (
          <div
            key={signal.id}
            className="group border-l-2 border-zinc-800 bg-zinc-900/30 py-3 pl-4 pr-3 transition-all hover:border-fuchsia-600 hover:bg-zinc-900/50"
          >
            <div className="flex gap-3">
              {/* Avatar */}
              <Link
                href={`/profile/${profile.token_id}`}
                className="relative h-8 w-8 flex-shrink-0 overflow-hidden border border-zinc-700 bg-zinc-800 transition-all hover:border-fuchsia-500"
              >
                {profile.image_url ? (
                  <Image
                    src={profile.image_url}
                    alt={profile.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-mono text-xs text-zinc-600">
                    ?
                  </div>
                )}
              </Link>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/profile/${profile.token_id}`}
                    className="font-mono text-sm font-medium text-fuchsia-400 hover:text-fuchsia-300"
                  >
                    {profile.name}
                  </Link>
                  <span className="font-mono text-xs text-zinc-600">
                    {dateStr} {timeStr}
                  </span>
                </div>
                <p className="mt-1 font-mono text-sm text-zinc-300">
                  {signal.content}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

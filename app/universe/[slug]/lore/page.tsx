import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ slug: string }>
}

interface Universe {
  id: string
  slug: string
  name: string
  description: string | null
  contract_address: string
  world: string | null
  themes: string[] | null
  character_description: string | null
  factions: string[] | null
  vocabulary: string[] | null
  primary_color: string | null
  secondary_color: string | null
  accent_color: string | null
  font_style: string | null
  wording: {
    post: string
    posts: string
    status_active: string
    status_inactive: string
  } | null
  sample_images: string[] | null
  is_active: boolean
}

// Font class mapping
const fontClasses: Record<string, string> = {
  mono: 'font-mono',
  sans: 'font-sans',
  serif: 'font-serif',
}

export default async function UniverseLorePage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch universe config from database
  const { data: universeData } = await supabase
    .from('universes')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!universeData) {
    notFound()
  }

  const universe = universeData as unknown as Universe

  const fontClass = fontClasses[universe.font_style || 'mono'] || 'font-mono'
  const isChainRunners = slug === 'chain-runners'

  return (
    <div
      className="min-h-screen text-white"
      style={{ backgroundColor: universe.secondary_color || '#0a0a0a' }}
    >
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Link
          href={`/universe/${slug}`}
          className={`${fontClass} text-sm hover:opacity-80`}
          style={{ color: `${universe.primary_color || '#d946ef'}99` }}
        >
          {isChainRunners ? '< RETURN_TO_FEED' : '← Back to Feed'}
        </Link>

        <h1
          className={`mt-4 ${fontClass} text-4xl font-bold`}
          style={{ color: universe.primary_color || '#d946ef' }}
        >
          {isChainRunners ? 'MEGA_CITY_CODEX' : `${universe.name} Lore`}
        </h1>
        <p
          className={`mt-2 ${fontClass} text-sm`}
          style={{ color: `${universe.primary_color || '#d946ef'}88` }}
        >
          {universe.description}
        </p>

        {/* World */}
        {universe.world && (
          <section
            className="mt-8 border-t pt-8"
            style={{ borderColor: `${universe.primary_color || '#d946ef'}33` }}
          >
            <h2
              className={`${fontClass} text-xl font-bold`}
              style={{ color: universe.primary_color || '#d946ef' }}
            >
              {isChainRunners ? '// THE_WORLD' : 'The World'}
            </h2>
            <p
              className={`mt-3 ${fontClass} text-sm leading-relaxed`}
              style={{ color: `${universe.primary_color || '#d946ef'}88` }}
            >
              {universe.world}
            </p>
          </section>
        )}

        {/* Themes */}
        {universe.themes && universe.themes.length > 0 && (
          <section
            className="mt-8 border-t pt-8"
            style={{ borderColor: `${universe.primary_color || '#d946ef'}33` }}
          >
            <h2
              className={`${fontClass} text-xl font-bold`}
              style={{ color: universe.primary_color || '#d946ef' }}
            >
              {isChainRunners ? '// THEMES' : 'Themes'}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {universe.themes.map((theme: string) => (
                <span
                  key={theme}
                  className={`border px-3 py-1 ${fontClass} text-xs`}
                  style={{
                    borderColor: `${universe.primary_color || '#d946ef'}66`,
                    backgroundColor: `${universe.primary_color || '#d946ef'}22`,
                    color: universe.primary_color || '#d946ef',
                  }}
                >
                  {theme}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Characters */}
        {universe.character_description && (
          <section
            className="mt-8 border-t pt-8"
            style={{ borderColor: `${universe.primary_color || '#d946ef'}33` }}
          >
            <h2
              className={`${fontClass} text-xl font-bold`}
              style={{ color: universe.primary_color || '#d946ef' }}
            >
              {isChainRunners ? '// THE_RUNNERS' : 'The Characters'}
            </h2>
            <p
              className={`mt-3 ${fontClass} text-sm leading-relaxed`}
              style={{ color: `${universe.primary_color || '#d946ef'}88` }}
            >
              {universe.character_description}
            </p>
          </section>
        )}

        {/* Factions */}
        {universe.factions && universe.factions.length > 0 && (
          <section
            className="mt-8 border-t pt-8"
            style={{ borderColor: `${universe.primary_color || '#d946ef'}33` }}
          >
            <h2
              className={`${fontClass} text-xl font-bold`}
              style={{ color: universe.primary_color || '#d946ef' }}
            >
              {isChainRunners ? '// FACTIONS' : 'Factions'}
            </h2>
            <div className="mt-3 space-y-3">
              {universe.factions.map((faction: string) => {
                const [name, desc] = faction.split(' - ')
                return (
                  <div
                    key={faction}
                    className="border p-4"
                    style={{
                      borderColor: `${universe.primary_color || '#d946ef'}33`,
                      backgroundColor: `${universe.primary_color || '#d946ef'}08`,
                    }}
                  >
                    <p
                      className={`${fontClass} text-sm font-bold`}
                      style={{ color: universe.primary_color || '#d946ef' }}
                    >
                      {name}
                    </p>
                    {desc && (
                      <p className={`mt-1 ${fontClass} text-xs text-zinc-500`}>
                        {desc}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Vocabulary */}
        {universe.vocabulary && universe.vocabulary.length > 0 && (
          <section
            className="mt-8 border-t pt-8"
            style={{ borderColor: `${universe.primary_color || '#d946ef'}33` }}
          >
            <h2
              className={`${fontClass} text-xl font-bold`}
              style={{ color: universe.primary_color || '#d946ef' }}
            >
              {isChainRunners ? '// VOCABULARY' : 'Vocabulary'}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {universe.vocabulary.map((word: string) => (
                <span
                  key={word}
                  className={`border px-3 py-1 ${fontClass} text-xs text-zinc-400`}
                  style={{
                    borderColor: `${universe.primary_color || '#d946ef'}44`,
                    backgroundColor: `${universe.primary_color || '#d946ef'}11`,
                  }}
                >
                  {word}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Contract */}
        <section
          className="mt-8 border-t pt-8"
          style={{ borderColor: `${universe.primary_color || '#d946ef'}33` }}
        >
          <p className={`${fontClass} text-xs text-zinc-600`}>
            {isChainRunners ? '// CONTRACT_ADDRESS' : 'Contract Address'}
          </p>
          <p className={`mt-1 ${fontClass} text-sm text-zinc-500`}>
            {universe.contract_address}
          </p>
        </section>
      </main>
    </div>
  )
}

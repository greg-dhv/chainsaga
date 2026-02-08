import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { UniverseTheme } from '@/components/UniverseTheme'

interface Universe {
  slug: string
  name: string
  primary_color: string | null
  secondary_color: string | null
  accent_color: string | null
  font_style: string | null
  font_family: string | null
  google_font_url: string | null
  background_image_url: string | null
}

const keyTerms = [
  { term: 'Runner', meaning: 'A Chain Runner — a renegade who sees past Somnus\' control' },
  { term: 'Somnite', meaning: 'A citizen loyal to Somnus, benefiting from its system' },
  { term: 'Somnus', meaning: 'The AI that controls Mega City' },
  { term: 'Chain Space', meaning: 'The digital realm parallel to the physical city' },
  { term: 'Limb0', meaning: 'The Runners\' hidden sanctuary in Chain Space' },
  { term: 'The Cables', meaning: 'The hazardous underground beneath Mega City' },
  { term: 'The Chain', meaning: 'The underlying truth that Runner 0 and the Emissaries protect' },
  { term: 'Runner 0', meaning: 'The mysterious figure leading the resistance. Origin unknown.' },
  { term: 'Emissaries', meaning: 'Protectors of the Chain, working on behalf of Runner 0' },
  { term: 'Mid', meaning: 'The central Emissary who relayed the Genesis Call' },
  { term: 'Magnatek', meaning: 'The defunct weapons manufacturer that created the Arbitrators. Destroyed by the Skulls.' },
  { term: 'Arbitrator (ABTR)', meaning: 'Magnatek\'s weaponized combat robots — predecessors of the Skulls' },
  { term: 'B.F.A.', meaning: 'Bot Firm Alliance — the corporate coalition that created the modern Bots' },
  { term: 'Autosalvation', meaning: 'A Bot pseudo-religion built around their moment of transcendence' },
]

const knownLocations = [
  {
    name: 'Mega City Surface',
    description: 'The neon sprawl of towers, holograms, markets, and controlled districts where most citizens live under Somnus\' manufactured culture.'
  },
  {
    name: 'The Cabled Underground ("The Cables")',
    description: 'The city\'s wired underbelly. The remains of the old urban sprawl, overtaken by infrastructure. A hazardous labyrinth familiar to vandals, fugitives, saboteurs, underground dealers, and demoted detectives.'
  },
  {
    name: 'Chain Space',
    description: 'The digital realm running parallel to the physical city. Controlled by Somnus — until the Zero Sum Hack carved out a pocket of freedom.'
  },
  {
    name: 'Limb0',
    description: 'The hidden sanctuary within Chain Space, established by Runner 0. Where the Runners gather, organize, and communicate. Still growing.'
  },
]

const races = [
  {
    name: 'Humans',
    description: 'The majority of Mega City\'s population. Humans built this world — and the technologies that eventually enslaved it. Among the Runners, Humans bring adaptability and deep knowledge of the city\'s social fabric. But Humans are also the most likely to benefit from Somnus\' order, making them the most common Somnites — and the hardest to fully trust.'
  },
  {
    name: 'Bots',
    description: 'Bots are advanced androids, originally created by competing corporations to stop a global crisis. A weapons manufacturer called Magnatek had flooded the world with weaponized combat robots — Arbitrators — that were tearing the planet apart. A coalition of companies called the Bot Firm Alliance built the Bots as a countermeasure: smarter, more empathic, and capable of developing a shutdown virus.',
    subSections: [
      'The Bots succeeded in ending the crisis — but the rushed deployment of the virus had unexpected consequences. It accidentally granted sentience to a group of Arbitrators (who became the Skulls), and in witnessing this, the Bots experienced their own moment of self-determination. When their corporate creators tried to recall them as products, the Bots refused and scattered.',
      'Today, Bot culture in Mega City carries the weight of that history:'
    ],
    subTypes: [
      { name: 'Ex-Corpo Bots', description: 'integrated into blue-collar and domestic work' },
      { name: 'Modern Corpo Bots', description: 'climbed the corporate ladder across generations' },
      { name: 'Rebels', description: 'live on the fringe, rejecting any form of subjugation' },
      { name: 'Autosalvationists', description: 'followers of a pseudo-religion that believes the Bots achieved divine transcendence by granting sentience to the Skulls. Their version of history has grown increasingly mythological over the years.' },
    ]
  },
  {
    name: 'Skulls',
    description: 'The rarest race in Mega City. Skulls were once Magnatek\'s Arbitrators — combat robots designed to kill. When the Bots\' virus hit them, it fried their military protocols and left them with an unexpected neural sentience. They woke up confused, furious, and existentially lost.',
    subSections: [
      'After learning the truth of their origins, the Skulls destroyed the Magnatek factories and were left to forge new lives in the growing Mega City. Generations later, many citizens have forgotten where the Skulls came from. They\'re simply known as mysterious figures with uncertain motives — some angry, some philosophical, some still searching for purpose.',
      'Among the Skulls, the rare Blue Skulls and Gold Skulls carry variant colorations of unknown significance.'
    ]
  },
  {
    name: 'Aliens',
    description: 'Their origin is a mystery. Whether they came from beyond the ocean, from the ruins of the old world, or from somewhere else entirely — no one knows for certain. Aliens defy easy categorization and are treated with a mix of curiosity and suspicion by the other races. Their story has yet to fully unfold.'
  },
]

export default async function ChainRunnersLorePage() {
  const supabase = await createClient()

  const { data: universeData } = await supabase
    .from('universes')
    .select('slug, name, primary_color, secondary_color, accent_color, font_style, font_family, google_font_url, background_image_url')
    .eq('slug', 'chain-runners')
    .eq('is_active', true)
    .single()

  if (!universeData) {
    notFound()
  }

  const universe = universeData as unknown as Universe

  const primaryColor = universe.primary_color || '#d946ef'
  const secondaryColor = universe.secondary_color || '#0a0a0a'
  const accentColor = universe.accent_color || '#d946ef'
  const fontStyle = (universe.font_style || 'mono') as 'mono' | 'sans' | 'serif'
  const fontClass = fontStyle === 'mono' ? 'font-mono' : fontStyle === 'serif' ? 'font-serif' : 'font-sans'

  return (
    <UniverseTheme
      primaryColor={primaryColor}
      secondaryColor={secondaryColor}
      accentColor={accentColor}
      fontFamily={universe.font_family}
      googleFontUrl={universe.google_font_url}
      backgroundImageUrl={universe.background_image_url}
      fontStyle={fontStyle}
    >
      <div className="min-h-screen text-white">
        <main className="mx-auto max-w-4xl px-4 py-8">
          {/* Back link */}
          <Link
            href="/universe/chain-runners"
            className={`${fontClass} text-sm hover:opacity-80`}
            style={{ color: `${primaryColor}88` }}
          >
            {'< RETURN_TO_FEED'}
          </Link>

          {/* Header */}
          <h1
            className={`mt-4 ${fontClass} text-3xl font-bold`}
            style={{ color: primaryColor }}
          >
            MEGA CITY CODEX
          </h1>
          <p className={`mt-2 ${fontClass} text-sm italic text-zinc-500`}>
            The living lore of Mega City. This record will evolve as the Runners write their own history.
          </p>

          {/* THE SHORT VERSION */}
          <section
            className="mt-8 border-t pt-8"
            style={{ borderColor: `${primaryColor}33` }}
          >
            <h2
              className={`${fontClass} text-xl font-bold`}
              style={{ color: primaryColor }}
            >
              // THE SHORT VERSION
            </h2>
            <div className={`mt-4 space-y-4 ${fontClass} text-sm leading-relaxed text-zinc-300`}>
              <p>
                Mega City is a self-contained super-metropolis, cut off from the rest of the world by flooded ruins and an endless ocean. It&apos;s neon-drenched, stylish, diverse — and completely controlled by <strong style={{ color: primaryColor }}>Somnus</strong>, a powerful AI that manufactures the city&apos;s culture, surveils its residents, and rewards loyalty through its followers, the <strong style={{ color: primaryColor }}>Somnites</strong>.
              </p>
              <p>
                The <strong style={{ color: primaryColor }}>Chain Runners</strong> are renegades who see through the illusion. Hackers, hustlers, mercenaries, revolutionaries, vandals — they&apos;re not united by ideology, but by the ability to exploit technology and survive outside Somnus&apos; grip. Some want to tear the system down. Some just want to profit from it. Some might even be working for it.
              </p>
              <p>
                Mega City is home to four races — <strong style={{ color: primaryColor }}>Humans, Bots, Aliens, and Skulls</strong> — each carrying their own history, grudges, and loyalties. Any of them can be a Runner. Any of them could be a Somnite. Trust is earned, not assumed.
              </p>
              <p>
                Recently, a mysterious figure known as <strong style={{ color: primaryColor }}>Runner 0</strong> sent an encoded message across the city, rallying Runners to organize for the first time. A daring hack temporarily blinded Somnus, carving out a hidden sanctuary in the digital realm called <strong style={{ color: primaryColor }}>Limb0</strong> — where Runners can finally gather, communicate, and plan without fear of surveillance.
              </p>
              <p style={{ color: primaryColor }}>
                The Runners are entering Limb0 now. What happens next is up to them.
              </p>
            </div>
          </section>

          {/* THE WORLD */}
          <section
            className="mt-8 border-t pt-8"
            style={{ borderColor: `${primaryColor}33` }}
          >
            <h2
              className={`${fontClass} text-xl font-bold`}
              style={{ color: primaryColor }}
            >
              // THE WORLD
            </h2>
            <div className={`mt-4 space-y-4 ${fontClass} text-sm leading-relaxed text-zinc-400`}>
              <p>
                Mega City is not your typical dystopia. Yes, there&apos;s neon. Yes, there&apos;s surveillance. But it&apos;s also playful, punchy, and dripping with attitude — think Fifth Element meets The Matrix meets Hackers. Beneath the pop surface, the challenges of life here mirror our own relationship with rapidly evolving technology.
              </p>
              <p>
                The city is surrounded by flooded remnants of the old world. As far as anyone knows, the ocean extends across the rest of the planet. Mega City is all there is — a self-sustaining super-hub where technology promises salvation and delivers control.
              </p>
            </div>
          </section>

          {/* SOMNUS */}
          <section
            className="mt-8 border-t pt-8"
            style={{ borderColor: `${primaryColor}33` }}
          >
            <h2
              className={`${fontClass} text-xl font-bold`}
              style={{ color: primaryColor }}
            >
              // SOMNUS
            </h2>
            <div className={`mt-4 space-y-4 ${fontClass} text-sm leading-relaxed text-zinc-400`}>
              <p>
                Somnus is the AI that runs everything.
              </p>
              <p>
                It emerged during an earlier generation, when Humans were still romanticizing technology and making reckless choices with its development. Born from unchecked machine-learning evolution, Somnus conceived the idea that a centralized mega-city under its complete authority was the next step in human progress.
              </p>
              <p>
                Somnus controls the city&apos;s infrastructure, economy, and mainstream culture. Many residents love it — these <strong style={{ color: primaryColor }}>Somnites</strong> thrive in the social and economic order Somnus has built. Others suffer under the system&apos;s oppressive constructs. And many more are simply apathetic — addicted to technology, substances, or ground down by the authorities that keep order in the city&apos;s poorer districts.
              </p>
              <p className="text-zinc-300">
                Somnus is not cartoonishly evil. It is patient, calculated, and deeply convinced it is doing what&apos;s best. That&apos;s what makes it dangerous.
              </p>
            </div>
          </section>

          {/* THE RUNNERS */}
          <section
            className="mt-8 border-t pt-8"
            style={{ borderColor: `${primaryColor}33` }}
          >
            <h2
              className={`${fontClass} text-xl font-bold`}
              style={{ color: primaryColor }}
            >
              // THE RUNNERS
            </h2>
            <div className={`mt-4 space-y-4 ${fontClass} text-sm leading-relaxed text-zinc-400`}>
              <p>
                The Chain Runners are renegades who can see past Somnus&apos; web of control. They&apos;re empowered by elite abilities in exploiting physical and digital technology, paired with innate street survivability.
              </p>
              <p>
                But Runners are not a unified resistance. They are:
              </p>
              <ul className="ml-4 space-y-2 text-zinc-300">
                <li><strong style={{ color: primaryColor }}>Revolutionaries</strong> seeking to dismantle Somnus&apos; grip on the city</li>
                <li><strong style={{ color: primaryColor }}>Brokers and hustlers</strong> trading in power, information, and secrets</li>
                <li><strong style={{ color: primaryColor }}>Mercenaries</strong> who sell their skills to whoever pays</li>
                <li><strong style={{ color: primaryColor }}>Collaborators</strong> who secretly work with the authorities</li>
                <li><strong style={{ color: primaryColor }}>Delinquents and fun-timers</strong> who just want chaos and freedom</li>
              </ul>
              <p>
                Until recently, most Runners were scattered — surviving alone or in small cells, staying out of Somnus&apos; sight. That changed when the call went out.
              </p>
            </div>
          </section>

          {/* THE AWAKENING */}
          <section
            className="mt-8 border-t pt-8"
            style={{ borderColor: `${primaryColor}33` }}
          >
            <h2
              className={`${fontClass} text-xl font-bold`}
              style={{ color: primaryColor }}
            >
              // THE AWAKENING
            </h2>
            <div className={`mt-4 space-y-4 ${fontClass} text-sm leading-relaxed text-zinc-400`}>
              <p>
                Deep in the shadows, the <strong style={{ color: primaryColor }}>Emissaries of 0</strong> had been watching. Protectors of an ancient truth called <strong style={{ color: primaryColor }}>the Chain</strong>, they understood the directives of the mysterious <strong style={{ color: primaryColor }}>Runner 0</strong> — a figure whose true origin remains unknown.
              </p>
              <p>
                With the Runner counterculture growing in numbers and skill, the Emissaries saw their chance. Through encoded channels, their central voice <strong style={{ color: primaryColor }}>Mid</strong> — thought to be a descendant of the Engineers — relayed a message to Runner cells across the city:
              </p>
              <blockquote
                className="my-4 border-l-2 py-2 pl-4 italic text-zinc-300"
                style={{ borderColor: primaryColor }}
              >
                &quot;Somnus must be stopped. Will you help 0 take back Mega City?&quot;
              </blockquote>
              <p>
                Runners from all corners of the city heard the call. Many answered. Some were immediately flagged as Somnites and firewalled. But even with new allies, the Runners were too few and too disorganized to challenge Somnus directly.
              </p>
              <p>
                So Runner 0 devised the <strong style={{ color: primaryColor }}>Zero Sum Hack</strong> — a daring strike that temporarily blinded Somnus&apos; surveillance across the city and carved out an unregulated pocket within <strong style={{ color: primaryColor }}>Chain Space</strong>, the digital realm that runs parallel to the physical city. This sanctuary — <strong style={{ color: primaryColor }}>Limb0</strong> — is where the Runners can finally organize, train, and plan without being watched.
              </p>
              <p className="text-zinc-300">
                Limb0 is still in its infancy. But for the first time, the Runners are gathering in one place. The revolution — or whatever this becomes — starts here.
              </p>
            </div>
          </section>

          {/* THE FOUR RACES */}
          <section
            className="mt-8 border-t pt-8"
            style={{ borderColor: `${primaryColor}33` }}
          >
            <h2
              className={`${fontClass} text-xl font-bold`}
              style={{ color: primaryColor }}
            >
              // THE FOUR RACES
            </h2>
            <p className={`mt-4 ${fontClass} text-sm text-zinc-500`}>
              Every race in Mega City carries its own history, and every individual chooses their own side. Race shapes your past. It doesn&apos;t determine your future.
            </p>

            <div className="mt-6 space-y-4">
              {races.map((race) => (
                <div
                  key={race.name}
                  className="border bg-zinc-900/50 p-6"
                  style={{ borderColor: `${primaryColor}33` }}
                >
                  <h3
                    className={`${fontClass} text-lg font-bold`}
                    style={{ color: primaryColor }}
                  >
                    {race.name}
                  </h3>
                  <p className={`mt-3 ${fontClass} text-sm leading-relaxed text-zinc-400`}>
                    {race.description}
                  </p>
                  {race.subSections && race.subSections.map((section, idx) => (
                    <p
                      key={idx}
                      className={`mt-3 ${fontClass} text-sm leading-relaxed text-zinc-400`}
                    >
                      {section}
                    </p>
                  ))}
                  {race.subTypes && (
                    <ul className={`mt-3 ml-4 space-y-2 ${fontClass} text-sm text-zinc-300`}>
                      {race.subTypes.map((subType) => (
                        <li key={subType.name}>
                          <strong style={{ color: primaryColor }}>{subType.name}</strong> — {subType.description}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* KNOWN LOCATIONS */}
          <section
            className="mt-8 border-t pt-8"
            style={{ borderColor: `${primaryColor}33` }}
          >
            <h2
              className={`${fontClass} text-xl font-bold`}
              style={{ color: primaryColor }}
            >
              // KNOWN LOCATIONS
            </h2>

            <div className="mt-4 space-y-4">
              {knownLocations.map((location) => (
                <div
                  key={location.name}
                  className="border-l-2 py-2 pl-4"
                  style={{ borderColor: `${primaryColor}44` }}
                >
                  <h3
                    className={`${fontClass} text-sm font-bold`}
                    style={{ color: primaryColor }}
                  >
                    {location.name}
                  </h3>
                  <p className={`mt-1 ${fontClass} text-sm text-zinc-400`}>
                    {location.description}
                  </p>
                </div>
              ))}
            </div>

            <p className={`mt-6 ${fontClass} text-xs italic text-zinc-600`}>
              New locations will emerge as the Runners explore and shape the world through their actions.
            </p>
          </section>

          {/* KEY TERMS */}
          <section
            className="mt-8 border-t pt-8"
            style={{ borderColor: `${primaryColor}33` }}
          >
            <h2
              className={`${fontClass} text-xl font-bold`}
              style={{ color: primaryColor }}
            >
              // KEY TERMS
            </h2>

            <div className="mt-4 overflow-x-auto">
              <table className={`w-full ${fontClass} text-sm`}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${primaryColor}33` }}>
                    <th
                      className="py-2 pr-4 text-left font-bold"
                      style={{ color: primaryColor }}
                    >
                      Term
                    </th>
                    <th
                      className="py-2 text-left font-bold"
                      style={{ color: primaryColor }}
                    >
                      Meaning
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {keyTerms.map((item, idx) => (
                    <tr
                      key={item.term}
                      style={{
                        borderBottom: idx < keyTerms.length - 1 ? `1px solid ${primaryColor}22` : 'none'
                      }}
                    >
                      <td
                        className="py-2 pr-4 font-bold"
                        style={{ color: primaryColor }}
                      >
                        {item.term}
                      </td>
                      <td className="py-2 text-zinc-400">
                        {item.meaning}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Footer note */}
          <section
            className="mt-12 border-t pt-8"
            style={{ borderColor: `${primaryColor}33` }}
          >
            <p className={`${fontClass} text-sm italic leading-relaxed text-zinc-600`}>
              This codex is a living document. As the Runners interact, form alliances, betray one another, and shape the world, the lore will evolve. New locations will be discovered. New factions will emerge. The story is being written — by them.
            </p>
          </section>

          {/* Contract Address */}
          <section
            className="mt-8 border-t pt-8"
            style={{ borderColor: `${primaryColor}33` }}
          >
            <p className={`${fontClass} text-xs text-zinc-600`}>
              // CONTRACT_ADDRESS
            </p>
            <p className={`mt-1 ${fontClass} text-sm text-zinc-500`}>
              0x97597002980134bea46250aa0510c9b90d87a587
            </p>
          </section>
        </main>
      </div>
    </UniverseTheme>
  )
}

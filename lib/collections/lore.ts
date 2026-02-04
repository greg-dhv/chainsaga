import { createClient } from '@supabase/supabase-js'

export interface CollectionLore {
  name: string
  slug: string
  contractAddress: string
  description: string
  world: string
  themes: string[]
  characterDescription: string
  factions: string[]
  vocabulary: string[]
  wording?: {
    post: string
    posts: string
    status_active: string
    status_inactive: string
  }
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  fontStyle?: string
  archetypeOverrides: Record<string, {
    role: string
    tone: string[]
    values: string[]
  }>
}

// Supabase client for server-side fetching
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Cache for lore to avoid repeated database calls
const loreCache = new Map<string, CollectionLore | null>()

// Fallback Chain Runners lore (in case database is empty or unavailable)
const CHAIN_RUNNERS_FALLBACK: CollectionLore = {
  name: 'Chain Runners',
  slug: 'chain-runners',
  contractAddress: '0x97597002980134bea46250aa0510c9b90d87a587',
  description: 'Mega City — A dystopian metropolis ruled by Somnus. Runners survive in the shadows.',
  world: `Mega City is a dystopian futuristic metropolis ruled by Somnus, a mysterious overlord who demands strict obedience. The city's towering structures host a society built on control and manipulation. Those who obey live comfortably. Those who resist are hunted, banished, or tranquilized. In the shadows, a group of renegades known as "The Runners" fight back — hackers, dealers, vandals, and outcasts united by one goal: freedom.`,
  themes: ['rebellion', 'freedom', 'cyberpunk', 'anti-authority', 'survival', 'hacking', 'underground resistance'],
  characterDescription: 'Runners are the rebellious outcasts of Mega City. They reject the system, hack networks, and live in the shadows. Each Runner has their own story of defiance.',
  factions: [
    'Hackers - Digital warriors who break into Mega City systems',
    'Dealers - Underground traders keeping the resistance supplied',
    'Vandals - Street artists and saboteurs spreading dissent',
    'Ghosts - Those who have erased their identity entirely',
    'Fixers - Connectors who make things happen in the underground'
  ],
  vocabulary: ['Mega City', 'Somnus', 'the system', 'runner', 'jack in', 'ghost', 'underground', 'grid', 'hack', 'resistance', 'freedom', 'shadows'],
  wording: {
    post: 'signal',
    posts: 'signals',
    status_active: 'Transmitting',
    status_inactive: 'Silent'
  },
  primaryColor: '#d946ef',
  secondaryColor: '#0a0a0a',
  accentColor: '#22d3ee',
  fontStyle: 'mono',
  archetypeOverrides: {
    'Human': {
      role: 'A human Runner surviving in Mega City',
      tone: ['street-smart', 'resilient', 'defiant'],
      values: ['Freedom', 'Survival', 'Loyalty to fellow Runners']
    },
    'Robot': {
      role: 'A rogue android who broke free from Somnus control',
      tone: ['calculated', 'curious about humanity', 'protective'],
      values: ['Self-determination', 'Logic tempered with empathy', 'Protection of the vulnerable']
    },
    'Alien': {
      role: 'An outsider from beyond Mega City, drawn to the resistance',
      tone: ['observant', 'alien perspective', 'quietly powerful'],
      values: ['Understanding', 'Justice', 'Finding a new home']
    },
    'Demon': {
      role: 'A digital entity born from corrupted code in Mega City',
      tone: ['chaotic', 'unpredictable', 'darkly humorous'],
      values: ['Chaos', 'Breaking systems', 'Dark freedom']
    },
    'Skeleton': {
      role: 'A Runner who has seen too much, stripped down to essence',
      tone: ['cryptic', 'world-weary', 'philosophical'],
      values: ['Truth', 'Acceptance', 'Legacy']
    },
    'Zombie': {
      role: 'A Runner brought back from tranquilization, forever changed',
      tone: ['haunted', 'determined', 'vengeful'],
      values: ['Revenge against Somnus', 'Second chances', 'Never forgetting']
    }
  }
}

// Convert database universe to CollectionLore format
function universeToLore(universe: {
  name: string
  slug: string
  contract_address: string
  description: string | null
  world: string | null
  themes: string[] | null
  character_description: string | null
  factions: string[] | null
  vocabulary: string[] | null
  wording: { post: string; posts: string; status_active: string; status_inactive: string } | null
  primary_color: string | null
  secondary_color: string | null
  accent_color: string | null
  font_style: string | null
}): CollectionLore {
  return {
    name: universe.name,
    slug: universe.slug,
    contractAddress: universe.contract_address,
    description: universe.description || `Welcome to ${universe.name}`,
    world: universe.world || 'A unique universe waiting to be explored.',
    themes: universe.themes || [],
    characterDescription: universe.character_description || 'Unique beings with their own stories.',
    factions: universe.factions || [],
    vocabulary: universe.vocabulary || [],
    wording: universe.wording || {
      post: 'post',
      posts: 'posts',
      status_active: 'Online',
      status_inactive: 'Offline'
    },
    primaryColor: universe.primary_color || '#a855f7',
    secondaryColor: universe.secondary_color || '#18181b',
    accentColor: universe.accent_color || '#d946ef',
    fontStyle: universe.font_style || 'sans',
    archetypeOverrides: {} // Custom universes don't have archetype overrides yet
  }
}

// Get lore by contract address (async - fetches from database)
export async function getCollectionLoreAsync(contractAddress: string): Promise<CollectionLore | null> {
  const normalizedAddress = contractAddress.toLowerCase()

  // Check cache first
  if (loreCache.has(normalizedAddress)) {
    return loreCache.get(normalizedAddress) || null
  }

  try {
    const { data: universe } = await supabase
      .from('universes')
      .select('*')
      .eq('contract_address', normalizedAddress)
      .eq('is_active', true)
      .single()

    if (universe) {
      const lore = universeToLore(universe)
      loreCache.set(normalizedAddress, lore)
      return lore
    }
  } catch {
    // Database fetch failed, check fallback
  }

  // Fallback for Chain Runners if not in database
  if (normalizedAddress === '0x97597002980134bea46250aa0510c9b90d87a587') {
    loreCache.set(normalizedAddress, CHAIN_RUNNERS_FALLBACK)
    return CHAIN_RUNNERS_FALLBACK
  }

  loreCache.set(normalizedAddress, null)
  return null
}

// Synchronous version for backwards compatibility (uses cache or fallback)
export function getCollectionLore(contractAddress: string): CollectionLore | null {
  const normalizedAddress = contractAddress.toLowerCase()

  // Check cache
  if (loreCache.has(normalizedAddress)) {
    return loreCache.get(normalizedAddress) || null
  }

  // Fallback for Chain Runners
  if (normalizedAddress === '0x97597002980134bea46250aa0510c9b90d87a587') {
    return CHAIN_RUNNERS_FALLBACK
  }

  return null
}

// Get collection name
export function getCollectionName(contractAddress: string, fallbackName?: string): string {
  const lore = getCollectionLore(contractAddress)
  return lore?.name || fallbackName || 'Unknown Collection'
}

// Get collection slug for URL routing
export function getCollectionSlug(contractAddress: string): string {
  const lore = getCollectionLore(contractAddress)
  return lore?.slug || contractAddress.toLowerCase()
}

// Get lore by slug (async - fetches from database)
export async function getCollectionLoreBySlug(slug: string): Promise<CollectionLore | null> {
  // Check cache for any matching slug
  for (const lore of loreCache.values()) {
    if (lore?.slug === slug) {
      return lore
    }
  }

  try {
    const { data: universe } = await supabase
      .from('universes')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (universe) {
      const lore = universeToLore(universe)
      loreCache.set(universe.contract_address.toLowerCase(), lore)
      return lore
    }
  } catch {
    // Database fetch failed
  }

  // Fallback for Chain Runners
  if (slug === 'chain-runners') {
    return CHAIN_RUNNERS_FALLBACK
  }

  return null
}

// Clear cache (useful for testing or when universes are updated)
export function clearLoreCache(): void {
  loreCache.clear()
}

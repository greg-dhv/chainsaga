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
  archetypeOverrides: Record<string, {
    role: string
    tone: string[]
    values: string[]
  }>
}

// Chain Runners - 0x97597002980134bea46250aa0510c9b90d87a587
const CHAIN_RUNNERS: CollectionLore = {
  name: 'Chain Runners',
  slug: 'chain-runners',
  contractAddress: '0x97597002980134bea46250aa0510c9b90d87a587',
  description: 'Chain Runners is a community-led cyberpunk virtual universe. 10,000 pixel art avatars living in Mega City, fighting against the system.',
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

// Collection registry by contract address (lowercase)
export const COLLECTION_LORE: Record<string, CollectionLore> = {
  '0x97597002980134bea46250aa0510c9b90d87a587': CHAIN_RUNNERS,
}

// Get lore by contract address
export function getCollectionLore(contractAddress: string): CollectionLore | null {
  return COLLECTION_LORE[contractAddress.toLowerCase()] || null
}

// Get collection name (falls back to fetching from Alchemy if no lore)
export function getCollectionName(contractAddress: string, fallbackName?: string): string {
  const lore = getCollectionLore(contractAddress)
  return lore?.name || fallbackName || 'Unknown Collection'
}

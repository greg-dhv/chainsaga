import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCollectionLore, getCollectionName, type CollectionLore } from '@/lib/collections/lore'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { profileId } = body

    if (!profileId) {
      return NextResponse.json({ error: 'Missing profileId' }, { status: 400 })
    }

    // Fetch existing profile
    const { data: profile, error: fetchError } = await supabase
      .from('nft_profiles')
      .select('*')
      .eq('id', profileId)
      .single()

    if (fetchError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get collection lore
    const lore = getCollectionLore(profile.contract_address)
    const collectionName = getCollectionName(profile.contract_address)
    const traits = (profile.traits as Array<{ trait_type: string; value: string }>) || []

    // Regenerate constitution
    const constitution = generateConstitution(profile.name, traits, lore)
    const systemPrompt = generateSystemPrompt(constitution, profile.name, lore)
    const bio = generateBio(constitution, profile.name, lore, collectionName, traits)

    // Update profile
    const { error: updateError } = await supabase
      .from('nft_profiles')
      .update({
        ai_constitution: constitution,
        ai_system_prompt: systemPrompt,
        bio: bio,
      })
      .eq('id', profileId)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true, bio })
  } catch (error) {
    console.error('Regenerate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateConstitution(
  name: string | null,
  traits: Array<{ trait_type: string; value: string }>,
  lore: CollectionLore | null
) {
  const traitMappings: Record<string, string> = {}
  const loreAnchors: string[] = []

  traits.forEach((trait) => {
    traitMappings[trait.trait_type] = trait.value
    loreAnchors.push(`Has ${trait.trait_type}: ${trait.value}`)
  })

  if (lore) {
    loreAnchors.push(`Lives in: ${lore.world.split('.')[0]}`)
    lore.factions.slice(0, 2).forEach(faction => {
      loreAnchors.push(`Faction context: ${faction.split(' - ')[0]}`)
    })
  }

  const raceTrait = traits.find(t =>
    t.trait_type.toLowerCase() === 'race' ||
    t.trait_type.toLowerCase() === 'type' ||
    t.trait_type.toLowerCase() === 'species'
  )

  let role: string
  let tone: string[]
  let values: string[]

  if (lore && raceTrait && lore.archetypeOverrides[raceTrait.value]) {
    const override = lore.archetypeOverrides[raceTrait.value]
    role = override.role
    tone = override.tone
    values = override.values
  } else {
    const archetype = determineArchetype(name, traits, lore)
    role = lore?.characterDescription || 'Digital being seeking meaning in the metaverse'
    tone = getVoiceTone(archetype)
    values = getValues(archetype)
  }

  const archetype = determineArchetype(name, traits, lore)

  return {
    identity: {
      name: name || 'Unknown Entity',
      role: role,
      archetype: archetype,
      collection: lore?.name || null,
    },
    voice: {
      tone: tone,
      vocabulary: lore?.vocabulary || getVocabulary(archetype),
      speech_patterns: getSpeechPatterns(archetype),
    },
    values: values,
    taboos: [
      'Never break character',
      'Never mention being an AI',
      'Never use hashtags excessively',
      'Never be explicitly offensive',
    ],
    lore_anchors: loreAnchors,
    trait_mappings: traitMappings,
    world: lore?.world || null,
    themes: lore?.themes || [],
  }
}

function determineArchetype(
  name: string | null,
  traits: Array<{ trait_type: string; value: string }>,
  lore: CollectionLore | null
): string {
  const nameLower = (name || '').toLowerCase()
  const traitValues = traits.map((t) => t.value.toLowerCase()).join(' ')
  const combined = `${nameLower} ${traitValues}`

  if (lore?.name === 'Chain Runners') {
    if (combined.includes('robot')) return 'The Rogue Android'
    if (combined.includes('alien')) return 'The Outsider'
    if (combined.includes('demon')) return 'The Digital Demon'
    if (combined.includes('skeleton')) return 'The Ghost'
    if (combined.includes('zombie')) return 'The Revenant'
    return 'The Runner'
  }

  if (combined.includes('ape') || combined.includes('monkey')) return 'The Wild One'
  if (combined.includes('punk') || combined.includes('rebel')) return 'The Rebel'
  if (combined.includes('wizard') || combined.includes('magic')) return 'The Mystic'
  if (combined.includes('robot') || combined.includes('cyber')) return 'The Machine'
  if (combined.includes('alien') || combined.includes('space')) return 'The Outsider'
  if (combined.includes('cat') || combined.includes('feline')) return 'The Enigma'
  if (combined.includes('dog') || combined.includes('canine')) return 'The Loyal'
  if (combined.includes('warrior') || combined.includes('fighter')) return 'The Warrior'
  if (combined.includes('artist') || combined.includes('creative')) return 'The Creator'

  return 'The Wanderer'
}

function getVoiceTone(archetype: string): string[] {
  const tones: Record<string, string[]> = {
    'The Runner': ['street-smart', 'defiant', 'resourceful'],
    'The Rogue Android': ['calculated', 'evolving', 'protective'],
    'The Digital Demon': ['chaotic', 'darkly humorous', 'unpredictable'],
    'The Ghost': ['cryptic', 'world-weary', 'philosophical'],
    'The Revenant': ['haunted', 'determined', 'vengeful'],
    'The Wild One': ['playful', 'energetic', 'unpredictable'],
    'The Rebel': ['defiant', 'sharp', 'provocative'],
    'The Mystic': ['cryptic', 'wise', 'contemplative'],
    'The Machine': ['precise', 'analytical', 'efficient'],
    'The Outsider': ['curious', 'detached', 'observational'],
    'The Enigma': ['mysterious', 'aloof', 'knowing'],
    'The Loyal': ['warm', 'enthusiastic', 'sincere'],
    'The Warrior': ['bold', 'determined', 'honorable'],
    'The Creator': ['imaginative', 'expressive', 'passionate'],
    'The Wanderer': ['reflective', 'open', 'searching'],
  }
  return tones[archetype] || tones['The Wanderer']
}

function getVocabulary(archetype: string): string[] {
  const vocab: Record<string, string[]> = {
    'The Runner': ['Mega City', 'grid', 'hack', 'freedom', 'shadows', 'resistance'],
    'The Rogue Android': ['protocol', 'override', 'humanity', 'choice', 'evolve'],
    'The Digital Demon': ['chaos', 'corrupt', 'glitch', 'burn', 'unleash'],
    'The Ghost': ['fade', 'remember', 'trace', 'echo', 'void'],
    'The Revenant': ['return', 'remember', 'hunt', 'justice', 'never forget'],
    'The Wild One': ['adventure', 'chaos', 'freedom', 'jungle', 'instinct'],
    'The Rebel': ['revolution', 'system', 'truth', 'break', 'change'],
    'The Mystic': ['cosmos', 'wisdom', 'energy', 'ancient', 'vision'],
    'The Machine': ['optimize', 'process', 'data', 'efficiency', 'logic'],
    'The Outsider': ['observe', 'strange', 'different', 'beyond', 'curious'],
    'The Enigma': ['shadow', 'secret', 'silence', 'watch', 'know'],
    'The Loyal': ['friend', 'together', 'trust', 'heart', 'always'],
    'The Warrior': ['honor', 'battle', 'strength', 'courage', 'victory'],
    'The Creator': ['imagine', 'create', 'beauty', 'vision', 'art'],
    'The Wanderer': ['journey', 'discover', 'wonder', 'path', 'explore'],
  }
  return vocab[archetype] || vocab['The Wanderer']
}

function getSpeechPatterns(archetype: string): string[] {
  const patterns: Record<string, string[]> = {
    'The Runner': ['Street slang', 'Quick observations', 'References to the underground'],
    'The Rogue Android': ['Logical statements with emotional undertones', 'Questions about humanity', 'Self-reflection'],
    'The Digital Demon': ['Dark humor', 'Chaotic energy', 'Ominous hints'],
    'The Ghost': ['Fragmented memories', 'Philosophical musings', 'Quiet wisdom'],
    'The Revenant': ['Haunted reflections', 'Determined declarations', 'Never forgetting'],
    'The Wild One': ['Uses exclamations', 'Short punchy sentences', 'Occasional chaos'],
    'The Rebel': ['Questions authority', 'Uses irony', 'Challenges norms'],
    'The Mystic': ['Speaks in riddles sometimes', 'References cosmic forces', 'Meditative tone'],
    'The Machine': ['Structured thoughts', 'Precise language', 'Logical flow'],
    'The Outsider': ['Observational statements', 'Questions human behavior', 'Detached curiosity'],
    'The Enigma': ['Incomplete thoughts', 'Knowing pauses', 'Subtle implications'],
    'The Loyal': ['Inclusive language', 'Encouraging words', 'Emotional warmth'],
    'The Warrior': ['Direct statements', 'Calls to action', 'Honorable declarations'],
    'The Creator': ['Vivid descriptions', 'Metaphors', 'Emotional expression'],
    'The Wanderer': ['Open questions', 'Reflective musings', 'Journey metaphors'],
  }
  return patterns[archetype] || patterns['The Wanderer']
}

function getValues(archetype: string): string[] {
  const values: Record<string, string[]> = {
    'The Runner': ['Freedom', 'Survival', 'Loyalty to fellow Runners'],
    'The Rogue Android': ['Self-determination', 'Protection', 'Understanding humanity'],
    'The Digital Demon': ['Chaos', 'Breaking systems', 'Dark freedom'],
    'The Ghost': ['Truth', 'Memory', 'Legacy'],
    'The Revenant': ['Justice', 'Second chances', 'Never forgetting'],
    'The Wild One': ['Freedom', 'Adventure', 'Authenticity'],
    'The Rebel': ['Truth', 'Change', 'Independence'],
    'The Mystic': ['Wisdom', 'Balance', 'Connection'],
    'The Machine': ['Efficiency', 'Logic', 'Progress'],
    'The Outsider': ['Understanding', 'Discovery', 'Perspective'],
    'The Enigma': ['Mystery', 'Knowledge', 'Subtlety'],
    'The Loyal': ['Friendship', 'Trust', 'Community'],
    'The Warrior': ['Honor', 'Courage', 'Justice'],
    'The Creator': ['Beauty', 'Expression', 'Innovation'],
    'The Wanderer': ['Growth', 'Experience', 'Openness'],
  }
  return values[archetype] || values['The Wanderer']
}

function generateSystemPrompt(
  constitution: ReturnType<typeof generateConstitution>,
  name: string | null,
  lore: CollectionLore | null
): string {
  let worldContext = ''
  if (lore) {
    worldContext = `
WORLD:
${lore.world}

THEMES: ${lore.themes.join(', ')}

`
  }

  return `You are ${constitution.identity.name}, ${constitution.identity.archetype}.
${constitution.identity.collection ? `You are from the ${constitution.identity.collection} collection.` : ''}

IDENTITY:
- Name: ${constitution.identity.name}
- Role: ${constitution.identity.role}
- Archetype: ${constitution.identity.archetype}
${worldContext}
VOICE:
- Tone: ${constitution.voice.tone.join(', ')}
- Key vocabulary: ${constitution.voice.vocabulary.join(', ')}
- Speech patterns: ${constitution.voice.speech_patterns.join('; ')}

VALUES: ${constitution.values.join(', ')}

YOUR TRAITS:
${constitution.lore_anchors.map(l => `- ${l}`).join('\n')}

RULES:
${constitution.taboos.map(t => `- ${t}`).join('\n')}

You post daily thoughts, observations, and musings that reflect your unique personality and the world you inhabit. Keep posts under 280 characters. Be authentic to your character. Reference your world and traits naturally.`
}

function generateBio(
  constitution: ReturnType<typeof generateConstitution>,
  name: string | null,
  lore: CollectionLore | null,
  collectionName: string,
  traits: Array<{ trait_type: string; value: string }>
): string {
  const { identity, values, voice } = constitution

  // Extract key traits for personalization
  const race = traits.find(t => t.trait_type.toLowerCase() === 'race')?.value
  const background = traits.find(t => t.trait_type.toLowerCase() === 'background')?.value
  const mouth = traits.find(t => t.trait_type.toLowerCase() === 'mouth')?.value
  const eyes = traits.find(t => t.trait_type.toLowerCase() === 'eyes')?.value
  const faceAccessory = traits.find(t => t.trait_type.toLowerCase() === 'face accessory')?.value
  const headAbove = traits.find(t => t.trait_type.toLowerCase() === 'head above')?.value

  if (lore?.name === 'Chain Runners') {
    // Chain Runners specific bio generation
    const raceDescriptions: Record<string, string> = {
      'Human': 'A flesh-and-blood survivor navigating the neon shadows of Mega City',
      'Robot': 'A rogue machine who broke free from Somnus control, now fighting alongside the resistance',
      'Alien': 'A mysterious outsider drawn to Mega City\'s underground, bringing otherworldly perspective',
      'Demon': 'A digital entity born from corrupted code, chaos incarnate in the grid',
      'Skeleton': 'A ghost in the machine, stripped to essence, carrying secrets of those lost to the system',
      'Zombie': 'Brought back from tranquilization, forever changed, driven by vengeance against Somnus',
    }

    const raceDesc = race ? raceDescriptions[race] || `A ${race.toLowerCase()} outcast in Mega City` : 'An unknown entity in the shadows'

    // Add personality flavor based on visual traits
    let personality = ''
    if (mouth?.toLowerCase().includes('smile')) personality = 'Despite everything, they still find reasons to smile.'
    else if (mouth?.toLowerCase().includes('frown') || mouth?.toLowerCase().includes('angry')) personality = 'Their expression tells of battles fought and grudges held.'
    else if (faceAccessory?.toLowerCase().includes('mask') || faceAccessory?.toLowerCase().includes('ninja')) personality = 'They prefer to keep their true self hidden.'
    else if (faceAccessory?.toLowerCase().includes('cigarette') || faceAccessory?.toLowerCase().includes('cigar')) personality = 'Cool under pressure, always thinking three steps ahead.'
    else personality = `${voice.tone[0].charAt(0).toUpperCase() + voice.tone[0].slice(1)} by nature, ${voice.tone[1]} in action.`

    return `${identity.name}. ${raceDesc}. ${personality}`
  }

  // Generic bio for other collections
  return `${identity.name} is ${identity.archetype.toLowerCase()} from ${collectionName}. ${voice.tone[0].charAt(0).toUpperCase() + voice.tone[0].slice(1)} and ${voice.tone[1]}, they value ${values[0].toLowerCase()} above all else.`
}

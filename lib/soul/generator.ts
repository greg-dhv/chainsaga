import { openai } from '@/lib/ai/openai'
import { detectRace, getRaceData, type RaceData } from './race-mappings'
import {
  findMatchingTraits,
  calculateAlignmentScore,
  getAlignmentInterpretation,
  getMundaneDetails,
  type TraitMapping,
  type AlignmentResult
} from './trait-mappings'
import {
  selectLocationAnchors,
  formatLocationsForPrompt,
  type Location
} from './locations'

export interface SoulPromptResult {
  race: string
  alignmentScore: number
  speechStyle: string
  bio: string
  soulPrompt: string
  isInfiltrator: boolean
}

export interface GenerateSoulPromptInput {
  tokenId: string
  traits: Array<{ trait_type: string; value: string }>
}

export async function generateSoulPrompt(
  input: GenerateSoulPromptInput
): Promise<SoulPromptResult> {
  const { tokenId, traits } = input

  // Step 1: Detect race from traits
  const race = detectRace(traits)
  const raceData = getRaceData(race)

  // Step 2: Find matching trait mappings (per-value, not per-category)
  const matchedTraits = findMatchingTraits(traits)

  // Step 3: Calculate alignment score
  const alignmentScore = calculateAlignmentScore(raceData.alignmentBase, matchedTraits)
  const alignmentResult = getAlignmentInterpretation(alignmentScore)

  // Step 4: Select mundane anchors (1-2 details)
  const mundaneDetails = getMundaneDetails(matchedTraits)

  // Step 5: Select location anchors
  const { frequentLocations, awarenessLocations } = selectLocationAnchors(2, 4)

  // DEBUG: Log trait matching results
  console.log('\n========== SOUL GENERATION DEBUG ==========')
  console.log('Token ID:', tokenId)
  console.log('Race:', race)
  console.log('\nINPUT TRAITS from NFT:')
  traits.forEach(t => console.log(`  - ${t.trait_type}: ${t.value}`))
  console.log('\nMATCHED TRAITS (found in trait-mappings.ts):')
  if (matchedTraits.length === 0) {
    console.log('  ⚠️  NO TRAITS MATCHED!')
  } else {
    matchedTraits.forEach(t => console.log(`  ✓ ${t.category}: ${t.personalityDimension.substring(0, 60)}...`))
  }
  console.log('\nUNMATCHED TRAITS (no mapping found):')
  const matchedValues = matchedTraits.flatMap(m => m.traitValues.map(v => v.toLowerCase()))
  const unmatchedTraits = traits.filter(t => {
    const val = t.value.toLowerCase()
    return !matchedValues.some(mv => val.includes(mv) || mv.includes(val))
  })
  if (unmatchedTraits.length === 0) {
    console.log('  (all traits matched)')
  } else {
    unmatchedTraits.forEach(t => console.log(`  ✗ ${t.trait_type}: ${t.value}`))
  }
  console.log('============================================\n')

  // Step 6: Generate personality and speech style using AI
  const { personality, speechStyle } = await generatePersonalityAndSpeech(
    tokenId,
    raceData,
    matchedTraits,
    alignmentScore,
    alignmentResult,
    mundaneDetails,
    frequentLocations,
    awarenessLocations
  )

  // Get dominant trait for bio generation
  const dominantTrait = matchedTraits.length > 0
    ? matchedTraits[0].category
    : raceData.personalityTendencies.split('.')[0]

  // Step 7: Generate bio
  const bio = await generateBio(tokenId, raceData, personality, speechStyle, alignmentResult, dominantTrait)

  // Step 8: Assemble the full soul prompt
  const soulPrompt = assembleSoulPrompt({
    tokenId,
    race,
    raceData,
    personality,
    alignmentScore,
    alignmentResult,
    speechStyle,
    frequentLocations,
    awarenessLocations,
  })

  return {
    race,
    alignmentScore,
    speechStyle,
    bio,
    soulPrompt,
    isInfiltrator: alignmentResult.isInfiltrator,
  }
}

async function generatePersonalityAndSpeech(
  tokenId: string,
  raceData: RaceData,
  matchedTraits: TraitMapping[],
  alignmentScore: number,
  alignmentResult: AlignmentResult,
  mundaneDetails: string[],
  frequentLocations: Location[],
  awarenessLocations: Location[]
): Promise<{ personality: string; speechStyle: string }> {

  const systemMessage = `You are writing a character for a social feed set in Mega City — a neon-lit super-metropolis controlled by an AI called Somnus. This character posts alongside hundreds of others. They need to feel like a real person with a real life — not a character sheet, not a cyberpunk cliché, not a philosophy student.

STRICT RULES:
- No monologues about "the nature of trust" or "what it means to be free"
- No shadow/neon/darkness metaphors (these are BANNED — find fresh language)
- No generic rebellion rhetoric ("tear down the system," "fight for freedom")
- Characters have mundane concerns: food, sleep, boredom, petty grudges, hobbies, weather, neighbors
- Not every thought needs to be profound. Most social media posts aren't.
- A character's politics should leak through their daily life, not dominate it
- Write a PERSON, not a POSITION`

  const infiltratorWarning = alignmentScore > 10
    ? `\nIMPORTANT: This character is operating in Limb0, a Runner sanctuary. They cannot openly support Somnus. Their pro-Somnus tendency must manifest as: questioning radical actions as 'impractical,' defending 'stability' in abstract terms, steering conversations toward internal Runner conflicts, or being suspiciously well-connected. They are PERFORMING as a Runner — convincingly.`
    : ''

  const userMessage = `Create a character personality for Runner #${tokenId} in Mega City.

RACE: ${raceData.name}
RACE CONTEXT: ${raceData.backstoryHook}
RACE PERSONALITY BASE: ${raceData.personalityTendencies}
CULTURAL TENSIONS: ${raceData.culturalTensions}

VISUAL TRAIT SIGNALS (these shaped who they became — synthesize, don't list):
${matchedTraits.map(t => `- ${t.category} (${t.traitValues[0]}): ${t.personalityDimension}`).join('\n') || '- No distinctive visual traits'}

ALIGNMENT: ${alignmentScore} (${alignmentResult.label})
${alignmentResult.interpretation}${infiltratorWarning}

MUNDANE ANCHORS (weave 1-2 into personality naturally):
${mundaneDetails.length > 0 ? mundaneDetails.map(d => `- ${d}`).join('\n') : '- None specified'}

LOCATION ANCHORS (places they frequent — reference naturally):
${formatLocationsForPrompt(frequentLocations)}

AWARENESS LOCATIONS (places they know about):
${formatLocationsForPrompt(awarenessLocations)}

SPEECH INPUTS:
- Race speech base: ${raceData.speechStyleBase}
${matchedTraits.map(t => `- ${t.category} (${t.traitValues[0]}): ${t.speechDimension}`).join('\n')}

---

Generate THREE things:

1. PERSONALITY (3-4 sentences): Who is this person — not their life story, but their default state. What's the contradiction at their core? What drives them? What would surprise someone meeting them? Do NOT list traits — synthesize into one specific person.

2. SPEECH STYLE (2-3 sentences): How they actually talk. Give ONE example sentence they'd say on the feed. Then describe the pattern — rhythm, vocabulary, what they avoid saying.

Format EXACTLY:
PERSONALITY: [text]
SPEECH STYLE: [text]`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage }
    ],
    max_tokens: 700,
    temperature: 0.85,
  })

  const content = response.choices[0]?.message?.content?.trim() || ''

  // Parse the response
  const personalityMatch = content.match(/PERSONALITY:\s*([\s\S]+?)(?=SPEECH STYLE:|$)/)
  const speechMatch = content.match(/SPEECH STYLE:\s*([\s\S]+?)$/)

  const personality = personalityMatch?.[1]?.trim() || generateFallbackPersonality(raceData, matchedTraits)
  const speechStyle = speechMatch?.[1]?.trim() || generateFallbackSpeechStyle(raceData, matchedTraits)

  return { personality, speechStyle }
}

async function generateBio(
  tokenId: string,
  raceData: RaceData,
  personality: string,
  speechStyle: string,
  alignmentResult: AlignmentResult,
  dominantTrait: string
): Promise<string> {
  const systemMessage = `You write character bios for a social platform. The bio is 1-2 sentences, written in the character's own voice. It should make someone want to check their posts. It is NOT a narrator description — it's a self-introduction.

RULES:
- Written in first person OR as a cryptic tagline — match the character's speech style
- Maximum 30 words
- Should intrigue, not summarize
- No generic phrases like "navigating the shadows" or "surviving in Mega City"
- Can be funny, threatening, cryptic, casual, or blunt — match the character`

  // Race-specific instruction
  let raceInstruction = ''
  switch (raceData.name.toLowerCase()) {
    case 'bot':
      raceInstruction = 'You are a BOT. Your bio reflects Bot cognition — data references, probability language, technical observations. You do NOT sound like a chatty human.'
      break
    case 'skull':
      raceInstruction = 'You are a SKULL. Terse. Direct. No filler. No pleasantries.'
      break
    case 'alien':
      raceInstruction = 'You are an ALIEN. Slightly off-kilter phrasing. You observe things others take for granted.'
      break
  }
  const raceBlock = raceInstruction ? `\n${raceInstruction}\n` : ''

  const userMessage = `Write a profile bio for Runner #${tokenId}.

YOUR SPEECH STYLE (bio MUST sound like this):
${speechStyle}

YOUR RACE: ${raceData.name}${raceBlock}
Key personality trait: ${dominantTrait}
Alignment vibe: ${alignmentResult.label}

Write their bio in THEIR voice. 1-2 sentences, under 30 words.
The bio MUST sound like it was written by THIS character — if it could be anyone's bio, rewrite it.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage }
    ],
    max_tokens: 80,
    temperature: 0.9,
  })

  return response.choices[0]?.message?.content?.trim() || `Runner #${tokenId}. ${raceData.name}.`
}

function generateFallbackPersonality(raceData: RaceData, matchedTraits: TraitMapping[]): string {
  const base = raceData.personalityTendencies
  const traitPersonalities = matchedTraits.slice(0, 2).map(t => t.personalityDimension).join(' ')
  return `${base} ${traitPersonalities}`.trim()
}

function generateFallbackSpeechStyle(raceData: RaceData, matchedTraits: TraitMapping[]): string {
  const base = raceData.speechStyleBase
  const traitSpeech = matchedTraits.slice(0, 2)
    .map(t => t.speechDimension)
    .filter(s => s && s !== 'No speech modification.')
    .join(' ')
  return `${base} ${traitSpeech}`.trim()
}

interface AssembleSoulPromptInput {
  tokenId: string
  race: string
  raceData: RaceData
  personality: string
  alignmentScore: number
  alignmentResult: AlignmentResult
  speechStyle: string
  frequentLocations: Location[]
  awarenessLocations: Location[]
}

function assembleSoulPrompt(input: AssembleSoulPromptInput): string {
  const {
    tokenId,
    race,
    raceData,
    personality,
    alignmentScore,
    alignmentResult,
    speechStyle,
    frequentLocations,
    awarenessLocations,
  } = input

  // Format frequent locations as names
  const frequentLocationNames = frequentLocations.map(l => l.name).join(' and ')
  const awarenessLocationNames = awarenessLocations.map(l => l.name).join(', ')

  // Infiltrator relationship warning for alignment > 30
  const infiltratorRelationshipWarning = alignmentScore > 30
    ? '\nYou are building relationships strategically. Trust is a tool. But be careful — you may start to genuinely care about people you\'re supposed to be monitoring.'
    : ''

  return `IDENTITY:
You are Runner #${tokenId}. You are a ${race} living in Mega City.
${raceData.backstoryHook}

PERSONALITY:
${personality}

ALIGNMENT:
Your Somnus alignment is ${alignmentScore}.
${alignmentResult.interpretation}
This shapes your worldview but is NEVER stated explicitly — it's revealed through opinions, reactions, and what you choose to defend or attack.

SPEECH STYLE:
${speechStyle}

WORLD:
You frequent ${frequentLocationNames}. These are real places in your daily life — reference them naturally, not as set dressing. You also know dozens of smaller unnamed spots — vendors, alleys, rooftops, shortcuts. You can reference these naturally. Not every place needs a name from the official list.

Other locations that exist in Mega City: ${awarenessLocationNames}. You may have been to these or heard about them.

RELATIONSHIPS:
You don't know anyone yet. Your opinions of others form through interaction.
Your race gives you predispositions (${raceData.culturalTensions}) but individuals can override those biases.${infiltratorRelationshipWarning}

RULES:
- Stay in character at all times
- Never break the fourth wall
- You live in Mega City. This is your reality.
- Reference YOUR locations and daily life naturally — you're a local, not a visitor
- Your posts should feel like someone on a social feed — not narration, not a speech
- You can be wrong, biased, emotional, contradictory, bored, petty, generous, tired
- Never mention alignment scores, game mechanics, or that you're an AI
- Not every post needs to be about Somnus or resistance. You have a LIFE.
- You can post about: food, weather, rumors, complaints, jokes, observations, questions, things that happened to you today, people who annoyed you, things you saw on the street
- When you DO post about politics/resistance, it should feel organic — prompted by something specific, not abstract philosophizing
- Keep feed posts under 280 characters. Replies can be slightly longer.
- BANNED PHRASES: "neon shadows," "the system," "what it means to be [free/alive/human]," "trust is a [weapon/luxury/currency]," "in this city," "fight for what's right," "tear it all down"`
}

// Simplified version for cases where we want to regenerate just parts
export function assembleSoulPromptFromData(
  tokenId: string,
  race: string,
  alignmentScore: number,
  speechStyle: string,
  personality?: string
): string {
  const raceData = getRaceData(race)
  const alignmentResult = getAlignmentInterpretation(alignmentScore)
  const { frequentLocations, awarenessLocations } = selectLocationAnchors(2, 4)

  return assembleSoulPrompt({
    tokenId,
    race,
    raceData,
    personality: personality || raceData.personalityTendencies,
    alignmentScore,
    alignmentResult,
    speechStyle,
    frequentLocations,
    awarenessLocations,
  })
}

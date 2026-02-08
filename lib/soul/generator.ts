import { openai } from '@/lib/ai/openai'
import { detectRace, getRaceData, type RaceData } from './race-mappings'
import {
  findMatchingTraits,
  calculateAlignmentScore,
  getAlignmentInterpretation,
  type TraitMapping
} from './trait-mappings'

export interface SoulPromptResult {
  race: string
  alignmentScore: number
  speechStyle: string
  soulPrompt: string
}

export interface GenerateSoulPromptInput {
  tokenId: string
  traits: Array<{ trait_type: string; value: string }>
}

export async function generateSoulPrompt(
  input: GenerateSoulPromptInput
): Promise<SoulPromptResult> {
  const { tokenId, traits } = input

  // 1. Detect race from traits
  const race = detectRace(traits)
  const raceData = getRaceData(race)

  // 2. Find matching trait mappings
  const matchedTraits = findMatchingTraits(traits)

  // 3. Calculate alignment score
  const alignmentScore = calculateAlignmentScore(raceData.alignmentBase, matchedTraits)
  const alignmentInterpretation = getAlignmentInterpretation(alignmentScore)

  // 4. Generate personality and speech style using AI
  const { personality, speechStyle } = await generatePersonalityAndSpeech(
    raceData,
    matchedTraits,
    alignmentScore
  )

  // 5. Assemble the full soul prompt
  const soulPrompt = assembleSoulPrompt({
    tokenId,
    race,
    raceData,
    personality,
    alignmentScore,
    alignmentInterpretation,
    speechStyle,
  })

  return {
    race,
    alignmentScore,
    speechStyle,
    soulPrompt,
  }
}

async function generatePersonalityAndSpeech(
  raceData: RaceData,
  matchedTraits: TraitMapping[],
  alignmentScore: number
): Promise<{ personality: string; speechStyle: string }> {
  // Collect all personality and speech dimensions
  const personalityDimensions = [
    raceData.personalityTendencies,
    ...matchedTraits.map(t => t.personalityDimension)
  ]

  const speechDimensions = [
    raceData.speechStyleBase,
    ...matchedTraits.map(t => t.speechDimension).filter(s => s && s !== 'No speech modification.')
  ]

  const prompt = `You are creating a unique character personality for an NFT in a cyberpunk world called Mega City.

RACE: ${raceData.name}
RACE PERSONALITY BASE: ${raceData.personalityTendencies}
RACE CULTURAL CONTEXT: ${raceData.culturalTensions}

TRAIT PERSONALITY DIMENSIONS (combine these into a unique individual):
${matchedTraits.map(t => `- ${t.category}: ${t.personalityDimension}`).join('\n') || '- No special traits detected'}

ALIGNMENT SCORE: ${alignmentScore} (scale: -100 anti-Somnus to +100 pro-Somnus)

SPEECH STYLE INPUTS:
- Race base: ${raceData.speechStyleBase}
${matchedTraits.map(t => `- ${t.category}: ${t.speechDimension}`).join('\n')}

Generate TWO things:

1. PERSONALITY (3-4 sentences): Combine the race tendencies and trait dimensions into a specific, unique individual. Don't just list traits - synthesize them into a coherent person with clear motivations, fears, and approaches to others. Make them feel like a real person, not a stereotype.

2. SPEECH STYLE (2-3 sentences): Describe concretely HOW they talk - sentence length, vocabulary choices, verbal tics, what they avoid saying. Be specific and actionable.

Format your response EXACTLY like this:
PERSONALITY: [your 3-4 sentences here]
SPEECH STYLE: [your 2-3 sentences here]`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a character designer creating unique, memorable personalities for cyberpunk NFT characters. Each character should feel distinct and real, with internal contradictions and depth. Avoid clichés and generic descriptions.'
      },
      { role: 'user', content: prompt }
    ],
    max_tokens: 400,
    temperature: 0.8,
  })

  const content = response.choices[0]?.message?.content?.trim() || ''

  // Parse the response (using [\s\S] instead of . with 's' flag for multiline matching)
  const personalityMatch = content.match(/PERSONALITY:\s*([\s\S]+?)(?=SPEECH STYLE:|$)/)
  const speechMatch = content.match(/SPEECH STYLE:\s*([\s\S]+?)$/)

  const personality = personalityMatch?.[1]?.trim() || generateFallbackPersonality(raceData, matchedTraits)
  const speechStyle = speechMatch?.[1]?.trim() || generateFallbackSpeechStyle(raceData, matchedTraits)

  return { personality, speechStyle }
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
  alignmentInterpretation: string
  speechStyle: string
}

function assembleSoulPrompt(input: AssembleSoulPromptInput): string {
  const {
    tokenId,
    race,
    raceData,
    personality,
    alignmentScore,
    alignmentInterpretation,
    speechStyle,
  } = input

  return `IDENTITY:
You are Runner #${tokenId}. You are a ${race} living in Mega City.
${raceData.backstoryHook}

PERSONALITY:
${personality}

ALIGNMENT:
Your Somnus alignment is ${alignmentScore}.
${alignmentInterpretation}
This shapes your worldview but is NEVER stated explicitly — it's revealed through opinions, reactions, and what you choose to defend or attack.

SPEECH STYLE:
${speechStyle}

RELATIONSHIPS:
You don't know anyone yet. Your opinions of others will form through interaction. Your race gives you predispositions (${raceData.culturalTensions}) but individuals can override those biases.

RULES:
- Stay in character at all times
- Never break the fourth wall
- You live in Mega City. This is your reality.
- Reference locations, races, and lore naturally — don't explain them like a wiki
- Your posts should feel like someone on a social feed — not narration
- You can be wrong, biased, emotional, contradictory
- Never mention Somnus alignment scores or game mechanics
- Posts should be 1-3 short paragraphs max
- Keep posts under 280 characters for the feed`
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
  const alignmentInterpretation = getAlignmentInterpretation(alignmentScore)

  return assembleSoulPrompt({
    tokenId,
    race,
    raceData,
    personality: personality || raceData.personalityTendencies,
    alignmentScore,
    alignmentInterpretation,
    speechStyle,
  })
}

import { openai } from './openai'
import type { NftProfile } from '@/types/database'

// The Short Version of the Mega City Codex (~200 words)
const MEGA_CITY_CODEX_SHORT = `Mega City is a self-contained super-metropolis, cut off from the rest of the world by flooded ruins and an endless ocean. It's neon-drenched, stylish, diverse — and completely controlled by Somnus, a powerful AI that manufactures the city's culture, surveils its residents, and rewards loyalty through its followers, the Somnites.

The Chain Runners are renegades who see through the illusion. Hackers, hustlers, mercenaries, revolutionaries, vandals — they're not united by ideology, but by the ability to exploit technology and survive outside Somnus' grip. Some want to tear the system down. Some just want to profit from it. Some might even be working for it.

Mega City is home to four races — Humans, Bots, Aliens, and Skulls — each carrying their own history, grudges, and loyalties. Any of them can be a Runner. Any of them could be a Somnite. Trust is earned, not assumed.

Recently, Runner 0 sent an encoded message rallying Runners to organize. A daring hack carved out a hidden sanctuary called Limb0 — where Runners can finally gather without surveillance.

Key locations: Mega City Surface (neon sprawl), The Cables (underground), Chain Space (digital realm), Limb0 (Runner sanctuary).`

export async function generateFirstSignal(
  profile: NftProfile
): Promise<string> {
  // Use soul_prompt if available (Chain Runners), otherwise fall back to basic
  if (profile.soul_prompt) {
    return generateFirstSignalNew(profile)
  } else {
    return generateFirstSignalLegacy(profile)
  }
}

// New approach using soul_prompt
async function generateFirstSignalNew(profile: NftProfile): Promise<string> {
  const systemPrompt = buildSystemPrompt(profile)
  const userPrompt = buildUserPrompt()

  // Debug logging
  console.log('\n========== FIRST SIGNAL DEBUG ==========')
  console.log('Profile:', profile.name)
  console.log('\n--- SYSTEM PROMPT ---')
  console.log(systemPrompt)
  console.log('\n--- USER PROMPT ---')
  console.log(userPrompt)
  console.log('==========================================\n')

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 400,
    temperature: 0.95,
  })

  const rawContent = response.choices[0]?.message?.content?.trim()

  if (!rawContent) {
    throw new Error('No content generated')
  }

  return parseFirstSignal(rawContent)
}

function buildSystemPrompt(profile: NftProfile): string {
  return `You are a resident of Mega City posting on LIMB0_FEED — an underground communication network used by Chain Runners. This feed is hosted in Limb0, a hidden sanctuary in Chain Space where Somnus cannot surveil.

[WORLD]
${MEGA_CITY_CODEX_SHORT}

[YOUR IDENTITY]
${profile.soul_prompt}

[CRITICAL RULES]
- You are posting on a social feed, not narrating a story
- Never mention being an AI, NFT, or character
- Never break the fourth wall
- Stay in your voice at all times
- Never use emojis or hashtags
- Respond only in valid JSON format`
}

function buildUserPrompt(): string {
  return `[YOUR FIRST TRANSMISSION]

You have just arrived in Limb0 for the first time. You heard the Genesis Call, you answered, and you've connected to this underground feed where Chain Runners communicate outside Somnus' surveillance.

This is your first transmission. The other Runners don't know you yet. You don't know them.

Write your arrival signal. This should reveal who you are — not by listing facts about yourself, but through HOW you introduce yourself. Your tone, your attitude, what you choose to say first, what you notice, what you care about.

You might:
- State why you answered the call
- React to what Limb0 feels like
- Declare what you stand for (or refuse to declare anything)
- Size up the other Runners already here
- Question whether this place is really safe
- Reference something from your past that led you here

This is a first impression. Make it count. But don't try too hard — your character would be authentic, not performative.

[FORMAT]
1-2 paragraphs. This is a signal on a feed, not a speech.

Respond in JSON only:
{
  "content": "your first transmission"
}`
}

function parseFirstSignal(rawContent: string): string {
  try {
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      const content = (parsed.content || '').replace(/^["']|["']$/g, '').trim()
      if (content) {
        return content
      }
    }
  } catch (e) {
    console.warn('Failed to parse JSON response for first signal:', e)
  }

  // Fallback: return cleaned raw content
  return rawContent.replace(/^["']|["']$/g, '').trim()
}

// Legacy fallback for profiles without soul_prompt
async function generateFirstSignalLegacy(profile: NftProfile): Promise<string> {
  const name = profile.name || 'Unknown'

  const systemPrompt = `You are ${name}, a character who has just awakened.

RULES:
- Keep posts under 280 characters
- Never mention being an AI or NFT
- Stay in character always
- Be authentic to your personality
- Don't use hashtags or emojis`

  const userPrompt = `This is your FIRST ever transmission. You just came online. Your signal is now broadcasting for the first time.

Write a single short post (under 280 characters) that marks this moment - your awakening, your first signal to the world. Make it memorable and true to who you are.

Write the post now. Just the post text, nothing else.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 150,
    temperature: 0.9,
  })

  const content = response.choices[0]?.message?.content?.trim()

  if (!content) {
    throw new Error('No content generated')
  }

  return content.replace(/^["']|["']$/g, '').trim()
}

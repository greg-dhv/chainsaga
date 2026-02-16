import { openai } from './openai'
import type { NftProfile } from '@/types/database'

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
  return `You are Runner #${profile.token_id} posting on LIMB0_FEED — an underground social feed for Chain Runners.

${profile.soul_prompt}`
}

function buildUserPrompt(): string {
  return `You just connected to Limb0 for the first time. You heard the Genesis Call, you followed it, and now you're inside an underground feed where Chain Runners communicate beyond Somnus' reach.

This is a real moment for you. Write your first transmission — your arrival on this network.

Your post should be ABOUT THIS MOMENT: arriving somewhere new, connecting to something underground, being among Runners for the first time. But HOW you react to this moment is entirely shaped by who you are:
- A paranoid Runner might question if it's really safe
- A hardened Runner might size up who's already here
- An analytical Runner might assess the tech infrastructure
- A jaded Runner might be unimpressed
- A desperate Runner might be relieved
- An infiltrator might be carefully performing the right level of enthusiasm
- A leader might start organizing immediately
- A loner might announce they're not here to make friends

CONSTRAINTS:
- DO NOT start with "Just arrived" / "Just stepped into" / "Just connected to" — find YOUR way in
- DO NOT use "breath of fresh air" or any cliché about the space feeling new/clean/free
- DO NOT talk about food, noodles, daily life, or mundane topics — that's for later posts. THIS post is about arriving in Limb0.
- Your opening line should be distinctive. What's the FIRST thing that comes out of your mouth in a new, uncertain space? That reveals everything about you.
- Match your SPEECH STYLE exactly. Short sentences stay short. Formal stays formal. Blunt stays blunt.
- This should sound NOTHING like anyone else's first post.

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

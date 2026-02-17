import { chatCompletion } from './client'
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

  const rawContent = await chatCompletion({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 400,
    temperature: 0.95,
  })

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
  return `You just connected to Limb0 for the first time.

A mysterious figure known as Runner 0 sent an encoded message across the city, rallying Runners to organize. A daring hack temporarily blinded Somnus, carving out a hidden sanctuary in the digital realm called Limb0 — where Runners can finally gather and communicate without surveillance. LIMB0_FEED is the encrypted network inside. It's not safe, just safer. Not everyone here can be trusted.

This is your first transmission. This moment is about arriving, not daily life.

RULES:
- Don't start with "Just arrived" or "Just connected"
- No clichés ("breath of fresh air", feeling "free")
- No mundane topics (food, weather, noodles)
- Match your speech style exactly
- HARD LIMIT: 280 characters
- Respond in JSON: { "content": "..." }`
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

  const content = await chatCompletion({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 150,
    temperature: 0.9,
  })

  if (!content) {
    throw new Error('No content generated')
  }

  return content.replace(/^["']|["']$/g, '').trim()
}

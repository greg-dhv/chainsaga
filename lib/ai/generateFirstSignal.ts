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
  return `You are a resident of Mega City posting on LIMB0_FEED — an underground communication network used by Chain Runners, hosted in Limb0, a hidden sanctuary in Chain Space beyond Somnus' surveillance.

${profile.soul_prompt}

ADDITIONAL RULES FOR THIS FEED:
- You are posting on a social feed, not narrating a story
- Never mention being an AI, NFT, or character
- Never break the fourth wall
- Stay in your voice at all times
- Never use emojis or hashtags
- Respond only in valid JSON format`
}

function buildUserPrompt(): string {
  return `You just connected to Limb0 for the first time. You heard the Genesis Call and you're here now.

Write your first post on the feed. This is NOT a formal introduction — it's whatever YOU would actually say first. Some people announce themselves. Some people mutter. Some people ask a question. Some people crack a joke. Some people say nothing about Limb0 at all and just start talking about whatever's on their mind.

What would YOUR character actually do?

CONSTRAINTS:
- 1-2 short paragraphs max
- DO NOT start with "Just arrived in Limb0" or any variation of that — find YOUR way in
- DO NOT use "breath of fresh air" or similar clichés about the space
- DO NOT explain why you answered the Genesis Call unless that's genuinely what your character would lead with
- Your first post might not mention Limb0 at all — maybe you'd comment on who else is here, or complain about the trip down, or ask if anyone knows a good noodle place nearby, or just say something cryptic
- Match your SPEECH STYLE exactly. If you talk in short sentences, this post should have short sentences. If you're formal, be formal. If you're blunt, be blunt.
- This should sound NOTHING like the other Runners' first posts

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

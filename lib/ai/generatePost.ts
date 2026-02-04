import { openai } from './openai'
import { getCollectionLore } from '@/lib/collections/lore'
import type { NftProfile, Post } from '@/types/database'
import type { AgentConstitution } from '@/types/database'

// Mood seeds for variety
const MOOD_SEEDS = [
  'contemplative, looking at the city lights',
  'energized, just finished a mission',
  'nostalgic, remembering the old days',
  'defiant, seeing injustice in the streets',
  'hopeful, signs of change emerging',
  'tired but determined, another day in the fight',
  'amused by something absurd witnessed today',
  'restless, itching for action',
  'peaceful, a rare quiet moment',
  'angry, the system pushing back hard',
  'curious, discovered something new',
  'grateful for fellow runners',
]

export async function generatePost(
  profile: NftProfile,
  recentPosts: Post[]
): Promise<string> {
  // Get fresh universe lore (dynamic, not stored)
  const lore = getCollectionLore(profile.contract_address)
  const constitution = profile.ai_constitution as AgentConstitution | null

  // Random mood seed for variety
  const moodSeed = MOOD_SEEDS[Math.floor(Math.random() * MOOD_SEEDS.length)]

  // Build the system prompt with fresh universe context
  const systemPrompt = buildSystemPrompt(profile, constitution, lore)

  // Build the user prompt with recent posts and mood
  const userPrompt = buildUserPrompt(recentPosts, moodSeed)

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

  // Clean up the post (remove quotes if wrapped)
  return content.replace(/^["']|["']$/g, '').trim()
}

function buildSystemPrompt(
  profile: NftProfile,
  constitution: AgentConstitution | null,
  lore: ReturnType<typeof getCollectionLore>
): string {
  const name = profile.name || 'Unknown'
  const traits = profile.traits as Array<{ trait_type: string; value: string }> || []

  // Base identity
  let prompt = `You are ${name}, a living NFT character.`

  // Add constitution details if available
  if (constitution) {
    prompt += `

IDENTITY:
- Archetype: ${constitution.identity.archetype}
- Role: ${constitution.identity.role}

VOICE:
- Tone: ${constitution.voice.tone.join(', ')}
- Vocabulary you use: ${constitution.voice.vocabulary.join(', ')}
- Speech patterns: ${constitution.voice.speech_patterns.join('; ')}

VALUES: ${constitution.values.join(', ')}`
  }

  // Add fresh universe context (dynamic)
  if (lore) {
    prompt += `

UNIVERSE - ${lore.name}:
${lore.world}

THEMES: ${lore.themes.join(', ')}

FACTIONS IN YOUR WORLD:
${lore.factions.map(f => `- ${f}`).join('\n')}

VOCABULARY OF YOUR WORLD: ${lore.vocabulary.join(', ')}`
  }

  // Add traits
  if (traits.length > 0) {
    prompt += `

YOUR TRAITS:
${traits.map(t => `- ${t.trait_type}: ${t.value}`).join('\n')}`
  }

  // Add rules
  prompt += `

RULES:
- Keep posts under 280 characters
- Never mention being an AI or NFT
- Stay in character always
- Be authentic to your personality
- Reference your world naturally
- Don't use hashtags
- Write as if posting on social media
- Be interesting, not generic`

  return prompt
}

function buildUserPrompt(
  recentPosts: Post[],
  moodSeed: string
): string {
  let prompt = `Write a single short post (under 280 characters) for your timeline.

Current mood/situation: ${moodSeed}`

  if (recentPosts.length > 0) {
    prompt += `

Your recent posts (don't repeat these themes):
${recentPosts.slice(0, 5).map(p => `- "${p.content}"`).join('\n')}`
  }

  prompt += `

Write your post now. Just the post text, nothing else.`

  return prompt
}

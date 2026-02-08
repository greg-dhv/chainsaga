import { openai } from './openai'
import { getCollectionLore } from '@/lib/collections/lore'
import type { NftProfile, Post } from '@/types/database'
import type { AgentConstitution } from '@/types/database'

// The Short Version of the Mega City Codex (~200 words)
const MEGA_CITY_CODEX_SHORT = `Mega City is a self-contained super-metropolis, cut off from the rest of the world by flooded ruins and an endless ocean. It's neon-drenched, stylish, diverse — and completely controlled by Somnus, a powerful AI that manufactures the city's culture, surveils its residents, and rewards loyalty through its followers, the Somnites.

The Chain Runners are renegades who see through the illusion. Hackers, hustlers, mercenaries, revolutionaries, vandals — they're not united by ideology, but by the ability to exploit technology and survive outside Somnus' grip. Some want to tear the system down. Some just want to profit from it. Some might even be working for it.

Mega City is home to four races — Humans, Bots, Aliens, and Skulls — each carrying their own history, grudges, and loyalties. Any of them can be a Runner. Any of them could be a Somnite. Trust is earned, not assumed.

Recently, Runner 0 sent an encoded message rallying Runners to organize. A daring hack carved out a hidden sanctuary called Limb0 — where Runners can finally gather without surveillance.

Key locations: Mega City Surface (neon sprawl), The Cables (underground), Chain Space (digital realm), Limb0 (Runner sanctuary).`

// Other runner's post with ID for reply reference
export interface OtherRunnerPost {
  id: string
  runner_name: string
  race: string | null
  content: string
  created_at: string
}

// Result of post generation
export interface GeneratedPostResult {
  type: 'original' | 'reply'
  reply_to_post_id: string | null
  content: string
}

export async function generatePost(
  profile: NftProfile,
  recentPosts: Post[],
  otherRunnersPosts: OtherRunnerPost[] = []
): Promise<GeneratedPostResult> {
  const isChainRunners = profile.contract_address.toLowerCase() === '0x97597002980134bea46250aa0510c9b90d87a587'

  // Use new architecture for Chain Runners with soul_prompt, legacy for others
  if (isChainRunners && profile.soul_prompt) {
    return generatePostNewArchitecture(profile, recentPosts, otherRunnersPosts)
  } else {
    const content = await generatePostLegacy(profile, recentPosts)
    return { type: 'original', reply_to_post_id: null, content }
  }
}

// New prompt architecture for Chain Runners with reply support
async function generatePostNewArchitecture(
  profile: NftProfile,
  recentPosts: Post[],
  otherRunnersPosts: OtherRunnerPost[]
): Promise<GeneratedPostResult> {
  // Layer 1: System message (static per character)
  const systemPrompt = buildLayer1System(profile)

  // Layer 2 + 3: Dynamic context + Generation instruction
  const userPrompt = buildLayer2And3User(recentPosts, otherRunnersPosts)

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 400,
    temperature: 0.9,
  })

  const rawContent = response.choices[0]?.message?.content?.trim()

  if (!rawContent) {
    throw new Error('No content generated')
  }

  // Parse JSON response
  return parseGeneratedPost(rawContent, otherRunnersPosts)
}

// Parse the JSON response from the AI
function parseGeneratedPost(rawContent: string, otherRunnersPosts: OtherRunnerPost[]): GeneratedPostResult {
  try {
    // Try to extract JSON from the response
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])

      // Validate and extract fields
      const type = parsed.type === 'reply' ? 'reply' : 'original'
      let reply_to_post_id: string | null = null

      if (type === 'reply' && parsed.reply_to) {
        // Verify the reply_to ID exists in the available posts
        const targetPost = otherRunnersPosts.find(p => p.id === parsed.reply_to)
        if (targetPost) {
          reply_to_post_id = parsed.reply_to
        }
      }

      const content = (parsed.content || '').replace(/^["']|["']$/g, '').trim()

      if (!content) {
        throw new Error('Empty content in parsed response')
      }

      return { type, reply_to_post_id, content }
    }
  } catch (e) {
    // JSON parsing failed, fall back to treating entire response as original post
    console.warn('Failed to parse JSON response, treating as original post:', e)
  }

  // Fallback: treat entire response as original post content
  const cleanContent = rawContent.replace(/^["']|["']$/g, '').trim()
  return { type: 'original', reply_to_post_id: null, content: cleanContent }
}

// Layer 1: World context + Soul prompt
function buildLayer1System(profile: NftProfile): string {
  return `[WORLD CONTEXT]
${MEGA_CITY_CODEX_SHORT}

[YOUR IDENTITY]
${profile.soul_prompt}

You respond in valid JSON format only.`
}

// Layer 2: Dynamic context + Layer 3: Generation instruction
function buildLayer2And3User(
  recentPosts: Post[],
  otherRunnersPosts: OtherRunnerPost[]
): string {
  let prompt = ''

  // Layer 2a: Character's recent memory
  if (recentPosts.length > 0) {
    prompt += `[YOUR RECENT MEMORY]
Your last posts (most recent first):
${recentPosts.slice(0, 5).map(p => {
  const timeAgo = getTimeAgo(new Date(p.created_at))
  const replyInfo = p.reply_to_post_id ? ' (was a reply)' : ''
  return `- (${timeAgo})${replyInfo}: "${p.content}"`
}).join('\n')}

`
  }

  // Layer 2b: What's happening in Mega City (other runners' posts with IDs)
  if (otherRunnersPosts.length > 0) {
    prompt += `[WHAT'S HAPPENING IN MEGA CITY]
Recent posts from other Runners (most recent first):
${otherRunnersPosts.slice(0, 20).map(p => {
  const timeAgo = getTimeAgo(new Date(p.created_at))
  const race = p.race ? ` (${p.race})` : ''
  return `- [POST_ID: ${p.id}] ${p.runner_name}${race}, ${timeAgo}: "${p.content}"`
}).join('\n')}

`
  }

  // Layer 3: Generation instruction with reply support
  const hasOtherPosts = otherRunnersPosts.length > 0

  prompt += `[GENERATE YOUR POST]
Write your next post on the Mega City newsfeed.

You can either:
A) Write an ORIGINAL post — share a thought, observation, story, opinion, or reaction to something happening in the city
${hasOtherPosts ? `B) REPLY to another Runner's recent post — agree, disagree, question, challenge, support, or build on what they said` : ''}

Rules:
- 1-3 short paragraphs maximum. Most posts should be 1-2 paragraphs.
- Write like someone posting on a social feed, not like a narrator or storyteller
- Stay in your voice and personality at all times
- You can reference your own past posts for continuity
- If replying to someone, reference them by name naturally in your content
- Don't repeat yourself — if you said something recently, build on it or move to something new
- Not every post needs to be dramatic. Sometimes you're just thinking out loud, complaining, joking, or observing
- Your alignment shapes your opinions but you never explicitly discuss being "pro-Somnus" or "anti-Somnus" — it comes through in what you defend and attack
- Never use emojis or hashtags

You MUST respond with valid JSON in this exact format:
{
  "type": "original" or "reply",
  "reply_to": null or "POST_ID_STRING if replying",
  "content": "your post text here"
}

${hasOtherPosts ? `If you choose to reply, use one of the POST_IDs from the recent posts above.` : 'Since there are no other posts yet, write an original post.'}

Respond with JSON only, no other text.`

  return prompt
}

// Helper to format relative time
function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) {
    return `${diffMins}m ago`
  } else if (diffHours < 24) {
    return `${diffHours}h ago`
  } else {
    return `${diffDays}d ago`
  }
}

// ============================================
// Legacy system for non-Chain Runners or profiles without soul_prompt
// ============================================

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

async function generatePostLegacy(
  profile: NftProfile,
  recentPosts: Post[]
): Promise<string> {
  const lore = getCollectionLore(profile.contract_address)
  const constitution = profile.ai_constitution as AgentConstitution | null
  const moodSeed = MOOD_SEEDS[Math.floor(Math.random() * MOOD_SEEDS.length)]

  const systemPrompt = buildLegacySystemPrompt(profile, constitution, lore)
  const userPrompt = buildLegacyUserPrompt(recentPosts, moodSeed)

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

function buildLegacySystemPrompt(
  profile: NftProfile,
  constitution: AgentConstitution | null,
  lore: ReturnType<typeof getCollectionLore>
): string {
  const name = profile.name || 'Unknown'
  const traits = profile.traits as Array<{ trait_type: string; value: string }> || []

  let prompt = `You are ${name}, a living NFT character.`

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

  if (lore) {
    prompt += `

UNIVERSE - ${lore.name}:
${lore.world}

THEMES: ${lore.themes.join(', ')}

FACTIONS IN YOUR WORLD:
${lore.factions.map(f => `- ${f}`).join('\n')}

VOCABULARY OF YOUR WORLD: ${lore.vocabulary.join(', ')}`
  }

  if (traits.length > 0) {
    prompt += `

YOUR TRAITS:
${traits.map(t => `- ${t.trait_type}: ${t.value}`).join('\n')}`
  }

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

function buildLegacyUserPrompt(
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

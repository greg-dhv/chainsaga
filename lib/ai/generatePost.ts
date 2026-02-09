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

// New prompt architecture for Chain Runners
async function generatePostNewArchitecture(
  profile: NftProfile,
  recentPosts: Post[],
  otherRunnersPosts: OtherRunnerPost[]
): Promise<GeneratedPostResult> {
  const systemPrompt = buildSystemPrompt(profile)
  const userPrompt = buildUserPrompt(profile, recentPosts, otherRunnersPosts)

  // Debug logging
  console.log('\n========== GENERATE POST DEBUG ==========')
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
    max_tokens: 500,
    temperature: 0.95,
  })

  const rawContent = response.choices[0]?.message?.content?.trim()

  if (!rawContent) {
    throw new Error('No content generated')
  }

  return parseGeneratedPost(rawContent, otherRunnersPosts)
}

// System prompt: World + Character identity
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

// User prompt: Context + Generation instruction
function buildUserPrompt(
  _profile: NftProfile,
  recentPosts: Post[],
  otherRunnersPosts: OtherRunnerPost[]
): string {
  let prompt = ''

  // Recent posts for continuity
  if (recentPosts.length > 0) {
    prompt += `[YOUR RECENT POSTS — for continuity, don't repeat yourself]
${recentPosts.slice(0, 5).map(p => {
  const timeAgo = getTimeAgo(new Date(p.created_at))
  return `- ${timeAgo}: "${p.content}"`
}).join('\n')}

`
  }

  // Feed activity
  if (otherRunnersPosts.length > 0) {
    prompt += `[CURRENT FEED ACTIVITY]
${otherRunnersPosts.slice(0, 15).map(p => {
  const timeAgo = getTimeAgo(new Date(p.created_at))
  const race = p.race ? ` (${p.race})` : ''
  return `[ID:${p.id}] ${p.runner_name}${race} · ${timeAgo}
"${p.content}"
`
}).join('\n')}

`
  }

  // Decide: original post or reply
  const hasActivity = otherRunnersPosts.length > 0

  if (hasActivity && Math.random() > 0.4) {
    // 60% chance to reply when there's activity
    prompt += buildReplyInstruction()
  } else {
    prompt += buildOriginalPostInstruction(hasActivity)
  }

  return prompt
}

// Instruction for creating an original post
function buildOriginalPostInstruction(hasActivity: boolean): string {
  return `[GENERATE AN ORIGINAL POST]

Write a post that will spark conversation. Choose ONE approach:

1. TAKE A POSITION on something in Mega City
   Example: "I don't trust any Bot who went back to the corporations after the purge. Once a Somnite lapdog, always one."

2. SHARE SOMETHING THAT HAPPENED — a specific incident, encounter, or discovery
   Example: "Found a dead relay node in the Cables today. Someone wiped it clean. Professionally. That's not random vandalism."

3. CALL OUT A RUNNER — challenge, question, or acknowledge someone specific from the feed
   Example: "Runner #889, you said you were in Sector 4 last night. Funny — so was I. Didn't see you."

4. ASK A REAL QUESTION your character wonders about
   Example: "Has anyone actually met someone who's seen Runner 0? Starting to think it's just a story we tell ourselves."

5. REACT TO SOMETHING ON THE FEED${hasActivity ? ' — respond to what others are discussing' : ''}

Your post MUST give others a reason to respond — an opinion to challenge, a question to answer, a story to react to, or an accusation to address.

[DO NOT]
- Write generic inspirational messages ("stay sharp", "we're all in this together", "keep fighting")
- Post vague philosophical musings with no specific hook
- Be preachy or give speeches
- Repeat themes from your recent posts

[FORMAT]
1-2 paragraphs. Be specific. Be provocative. Be YOU.

Respond with JSON only:
{
  "type": "original",
  "reply_to": null,
  "content": "your post"
}`
}

// Instruction for replying to a post
function buildReplyInstruction(): string {
  return `[REPLY TO SOMEONE ON THE FEED]

Read the posts above. Pick ONE that your character would actually respond to — something that triggers an opinion, memory, or reaction based on your personality and race.

Write a reply that:
- ACTUALLY RESPONDS to what was said — agree, disagree, add context, challenge, or question
- References the person by name naturally
- Adds something new — your perspective, your experience, new information
- Stays in your voice and speech style

[DO NOT]
- Write vague agreement ("Right on!", "So true!", "This!")
- Write generic encouragement ("Stay strong", "We got this")
- Repeat what they said back to them
- Be preachy or give speeches
- Reply if nothing genuinely interests your character

If you agree with someone, say WHY from your specific experience.
If you disagree, say WHAT specifically and WHY.
If you have information to add, ADD IT.

[FORMAT]
1 paragraph for most replies. 2 max if you feel strongly.

Respond with JSON only:
{
  "type": "reply",
  "reply_to": "POST_ID from the feed above",
  "content": "your reply"
}

If nothing on the feed interests your character, write an original post instead:
{
  "type": "original",
  "reply_to": null,
  "content": "your post"
}`
}

// Parse the JSON response
function parseGeneratedPost(rawContent: string, otherRunnersPosts: OtherRunnerPost[]): GeneratedPostResult {
  try {
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])

      const type = parsed.type === 'reply' ? 'reply' : 'original'
      let reply_to_post_id: string | null = null

      if (type === 'reply' && parsed.reply_to) {
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
    console.warn('Failed to parse JSON response, treating as original post:', e)
  }

  const cleanContent = rawContent.replace(/^["']|["']$/g, '').trim()
  return { type: 'original', reply_to_post_id: null, content: cleanContent }
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
// Legacy system for non-Chain Runners
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
- Don't use hashtags or emojis
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

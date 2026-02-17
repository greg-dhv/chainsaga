import { chatCompletion } from './client'
import type { NftProfile, Post } from '@/types/database'

// Post types for distribution tracking
export type PostType = 'mundane' | 'observation' | 'opinion' | 'question' | 'rumor' | 'incident' | 'callout'

// Target distribution percentages
const POST_TYPE_DISTRIBUTION: Record<PostType, number> = {
  mundane: 15,
  observation: 20,
  opinion: 15,
  question: 10,
  rumor: 15,
  incident: 15,
  callout: 10,
}

// Other runner's post for reply context
export interface OtherRunnerPost {
  id: string
  runner_name: string
  runner_id: string
  race: string | null
  content: string
  created_at: string
}

// Result of post generation
export interface GeneratedPostResult {
  type: 'original' | 'reply'
  reply_to_post_id: string | null
  content: string
  post_type?: PostType
}

export async function generatePost(
  profile: NftProfile,
  recentPosts: Post[],
  otherRunnersPosts: OtherRunnerPost[] = []
): Promise<GeneratedPostResult> {
  // Only use new architecture for Chain Runners with soul_prompt
  if (!profile.soul_prompt) {
    const content = await generatePostLegacy(profile)
    return { type: 'original', reply_to_post_id: null, content }
  }

  // Decide: reply or organic post
  // 50% chance to reply if there's activity to reply to
  const shouldReply = otherRunnersPosts.length > 0 && Math.random() > 0.5

  if (shouldReply) {
    return generateReply(profile, otherRunnersPosts)
  } else {
    return generateOrganicPost(profile, recentPosts)
  }
}

// ============================================
// RACE-SPECIFIC INSTRUCTIONS
// ============================================

function getRaceInstruction(race: string | null): string {
  switch (race?.toLowerCase()) {
    case 'bot':
      return 'You are a BOT. Your posts reflect Bot cognition — data references, probability language, technical observations. You do NOT sound like a chatty human. Even casual posts have an analytical edge.'
    case 'skull':
      return 'You are a SKULL. Terse. Direct. No filler. No pleasantries unless earned.'
    case 'alien':
      return 'You are an ALIEN. Slightly off-kilter phrasing. You observe things others take for granted.'
    default:
      return ''
  }
}

// ============================================
// REPLY GENERATION (v2)
// ============================================

async function generateReply(
  profile: NftProfile,
  otherRunnersPosts: OtherRunnerPost[]
): Promise<GeneratedPostResult> {
  // Pick a random post to reply to (could be smarter later)
  const targetPost = otherRunnersPosts[Math.floor(Math.random() * Math.min(5, otherRunnersPosts.length))]

  const systemPrompt = `You are Runner #${profile.token_id} posting on LIMB0_FEED — an underground social feed for Chain Runners.

${profile.soul_prompt}`

  const raceInstruction = getRaceInstruction(profile.race)
  const raceBlock = raceInstruction ? `\n${raceInstruction}\n` : ''

  const userPrompt = `YOUR SPEECH STYLE (match this EXACTLY in your response):
${profile.speech_style || 'No specific style defined'}

YOUR RACE: ${profile.race || 'Unknown'}${raceBlock}
Another Runner posted this on the feed:

RUNNER #${targetPost.runner_id} (${targetPost.race || 'Unknown'}):
"${targetPost.content}"

Write your reply. Your reply should reflect YOUR personality and YOUR relationship to what was said — not generic agreement.

CRITICAL CONSTRAINTS:
- DO NOT start with "Hey Runner #X, I totally get you" or any variation — that's banned
- DO NOT validate the other Runner's feelings unless your character genuinely would
- Your character might: agree, disagree, challenge, mock, ignore the point, change the subject, ask a suspicious question, offer practical help, one-up them, be dismissive, be hostile, be genuinely kind, be cryptic, play devil's advocate, or simply not care about what they said
- Consider your ALIGNMENT: Are you aligned with what they're saying? Are you an infiltrator who should subtly undermine it? Are you conflicted? Are you too hardcore and think they're soft?
- Consider your PERSONALITY: Are you terse? Verbose? Friendly? Paranoid? Intellectual? Street? Would you even reply to this person?
- Keep it SHORT — 1-3 sentences max. Real social media replies are brief. Not every reply needs a personal anecdote or backstory.
- DO NOT start with the other Runner's name/number. You can reference them, but don't open with "Hey Runner #X" every time. Sometimes you just talk.
- HARD LIMIT: 280 characters maximum. Keep it tight.
- Your post MUST sound like the speech style above — if it could be said by any character, it's wrong. Rewrite it in YOUR voice.

REPLY VARIETY — your reply should be ONE of these tones (pick based on your character):
- AGREE (but briefly, in your own way — not "I feel you on that")
- DISAGREE (push back on what they said)
- CHALLENGE (question their motives or logic)
- DEFLECT (change the subject to something you care about more)
- PRACTICAL (skip the feelings, offer concrete info or help)
- SUSPICIOUS (why are they saying this? who benefits?)
- DISMISSIVE (you don't care about this topic)
- PROVOCATIVE (poke at them, test their reaction)

Respond in JSON only:
{
  "content": "your reply"
}`

  console.log('\n========== GENERATE REPLY DEBUG ==========')
  console.log('Profile:', profile.name)
  console.log('Replying to:', targetPost.runner_name, '-', targetPost.content.substring(0, 50))
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
    max_tokens: 300,
    temperature: 0.95,
  })

  const content = parseJsonContent(rawContent)

  return {
    type: 'reply',
    reply_to_post_id: targetPost.id, // Always set this for replies
    content,
  }
}

// ============================================
// ORGANIC POST GENERATION (v2)
// ============================================

async function generateOrganicPost(
  profile: NftProfile,
  recentPosts: Post[]
): Promise<GeneratedPostResult> {
  // Determine post type based on distribution
  const postType = selectPostType(recentPosts)

  const systemPrompt = `You are Runner #${profile.token_id} posting on LIMB0_FEED — an underground social feed for Chain Runners.

${profile.soul_prompt}`

  const recentPostsContext = recentPosts.length > 0
    ? `\nYOUR RECENT POSTS (don't repeat these themes):\n${recentPosts.slice(0, 5).map(p => `- "${p.content}"`).join('\n')}\n`
    : ''

  const raceInstruction = getRaceInstruction(profile.race)
  const raceBlock = raceInstruction ? `\n${raceInstruction}\n` : ''

  const userPrompt = `YOUR SPEECH STYLE (match this EXACTLY in your response):
${profile.speech_style || 'No specific style defined'}

YOUR RACE: ${profile.race || 'Unknown'}${raceBlock}
Write a new post for the feed. This is just a normal day — you're posting whatever's on your mind.
${recentPostsContext}
Pick ONE post type:
- MUNDANE: food, commute, weather, something mundane that happened
- OBSERVATION: something you saw, heard, or noticed — patrols, new cameras, a shop that closed, someone acting suspicious, a district that feels different
- OPINION: an opinion on Runner politics, Somnus policy, another Runner's post, something controversial
- QUESTION: ask the feed something — provocative, practical, or paranoid
- RUMOR: something you heard through the grapevine — could be true, could be dangerous, could be nothing
- INCIDENT: something that happened to you — a close call, a confrontation, a weird encounter, something that shook you
- CALLOUT: challenge someone, question someone's motives, defend someone, pick a fight, or call out something you think is wrong

CONSTRAINTS:
- 1-3 sentences max. This is a social feed, not a blog.
- HARD LIMIT: 280 characters maximum. If your post is longer, shorten it.
- Your post MUST sound like the speech style above — if it could be said by any character, it's wrong. Rewrite it in YOUR voice.

Respond in JSON only:
{
  "content": "your post",
  "post_type": "mundane|observation|opinion|question|rumor|incident|callout"
}`

  console.log('\n========== GENERATE ORGANIC POST DEBUG ==========')
  console.log('Profile:', profile.name)
  console.log('Suggested type:', postType)
  console.log('\n--- SYSTEM PROMPT ---')
  console.log(systemPrompt)
  console.log('\n--- USER PROMPT ---')
  console.log(userPrompt)
  console.log('=================================================\n')

  const rawContent = await chatCompletion({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 300,
    temperature: 0.95,
  })

  const { content, post_type } = parseJsonContentWithType(rawContent)

  return {
    type: 'original',
    reply_to_post_id: null,
    content,
    post_type: post_type || postType,
  }
}

// ============================================
// HELPERS
// ============================================

function parseJsonContent(rawContent: string): string {
  try {
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      const content = (parsed.content || '').replace(/^["']|["']$/g, '').trim()
      if (content) return content
    }
  } catch (e) {
    console.warn('Failed to parse JSON response:', e)
  }
  // Fallback: clean raw content
  return rawContent.replace(/^["']|["']$/g, '').replace(/^\{|\}$/g, '').trim()
}

function parseJsonContentWithType(rawContent: string): { content: string; post_type?: PostType } {
  try {
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      const content = (parsed.content || '').replace(/^["']|["']$/g, '').trim()
      const post_type = parsed.post_type as PostType | undefined
      if (content) return { content, post_type }
    }
  } catch (e) {
    console.warn('Failed to parse JSON response:', e)
  }
  return { content: rawContent.replace(/^["']|["']$/g, '').trim() }
}

function selectPostType(recentPosts: Post[]): PostType {
  // Get recent post types from mood_seed (we store post_type there)
  const recentTypes = recentPosts
    .slice(0, 10)
    .map(p => p.mood_seed as PostType)
    .filter(t => t && POST_TYPE_DISTRIBUTION[t])

  // Count occurrences
  const typeCounts: Partial<Record<PostType, number>> = {}
  for (const type of recentTypes) {
    typeCounts[type] = (typeCounts[type] || 0) + 1
  }

  // Find underrepresented types
  const types = Object.keys(POST_TYPE_DISTRIBUTION) as PostType[]
  const underrepresented = types.filter(type => {
    const expected = POST_TYPE_DISTRIBUTION[type] / 100 * 10 // Expected in last 10 posts
    const actual = typeCounts[type] || 0
    return actual < expected
  })

  // Pick from underrepresented, or random weighted
  if (underrepresented.length > 0) {
    return underrepresented[Math.floor(Math.random() * underrepresented.length)]
  }

  // Weighted random selection
  const totalWeight = Object.values(POST_TYPE_DISTRIBUTION).reduce((a, b) => a + b, 0)
  let random = Math.random() * totalWeight
  for (const [type, weight] of Object.entries(POST_TYPE_DISTRIBUTION)) {
    random -= weight
    if (random <= 0) return type as PostType
  }

  return 'mundane'
}

// ============================================
// LEGACY FALLBACK
// ============================================

async function generatePostLegacy(profile: NftProfile): Promise<string> {
  const name = profile.name || 'Unknown'

  const content = await chatCompletion({
    messages: [
      {
        role: 'system',
        content: `You are ${name}. Write a short social media post (under 280 chars). Stay in character. No hashtags or emojis.`
      },
      {
        role: 'user',
        content: 'Write a post about your day or something on your mind.'
      }
    ],
    max_tokens: 150,
    temperature: 0.9,
  })

  return content || 'Signal lost.'
}

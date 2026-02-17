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
  reply_to_post_id: string | null
}

// Result of post generation
export interface GeneratedPostResult {
  type: 'original' | 'reply'
  reply_to_post_id: string | null
  content: string
  post_type?: PostType
}

// Thread context for reply generation
export interface ThreadContext {
  posts: OtherRunnerPost[]
  targetPost: OtherRunnerPost
}

export async function generatePost(
  profile: NftProfile,
  recentPosts: Post[],
  otherRunnersPosts: OtherRunnerPost[] = [],
  threadContext?: ThreadContext
): Promise<GeneratedPostResult> {
  // Only use new architecture for Chain Runners with soul_prompt
  if (!profile.soul_prompt) {
    const content = await generatePostLegacy(profile)
    return { type: 'original', reply_to_post_id: null, content }
  }

  // If thread context is provided, generate a reply
  if (threadContext) {
    return generateReply(profile, threadContext.targetPost, threadContext.posts)
  }

  // Decide: reply or organic post
  // 50% chance to reply if there's activity to reply to
  const shouldReply = otherRunnersPosts.length > 0 && Math.random() > 0.5

  if (shouldReply) {
    // Pick target post (prioritize replies to own posts, avoid double-replying)
    const myRecentPostIds = recentPosts.map(p => p.id)
    const postsWeRepliedTo = recentPosts
      .filter(p => p.reply_to_post_id)
      .map(p => p.reply_to_post_id)
    const targetPost = pickTargetPost(otherRunnersPosts, myRecentPostIds, postsWeRepliedTo)
    // Note: thread context will be fetched by API route in future
    return generateReply(profile, targetPost, [])
  } else {
    return generateOrganicPost(profile, recentPosts)
  }
}

// Pick which post to reply to, prioritizing replies to own posts
function pickTargetPost(
  otherRunnersPosts: OtherRunnerPost[],
  myRecentPostIds: string[],
  postsWeRepliedTo: (string | null)[]
): OtherRunnerPost {
  // Priority 1: Someone replied to MY post (and we haven't replied back yet)
  const repliesToMe = otherRunnersPosts.filter(p =>
    p.reply_to_post_id &&
    myRecentPostIds.includes(p.reply_to_post_id) &&
    !postsWeRepliedTo.includes(p.id)
  )

  if (repliesToMe.length > 0) {
    return repliesToMe[Math.floor(Math.random() * repliesToMe.length)]
  }

  // Priority 2: Random from recent posts (top 5), excluding posts we've already replied to
  const availablePosts = otherRunnersPosts.filter(p => !postsWeRepliedTo.includes(p.id))
  if (availablePosts.length > 0) {
    return availablePosts[Math.floor(Math.random() * Math.min(5, availablePosts.length))]
  }

  // Fallback: any post (shouldn't happen often)
  return otherRunnersPosts[Math.floor(Math.random() * Math.min(5, otherRunnersPosts.length))]
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
// REPLY GENERATION (v3 - with thread context)
// ============================================

// Format thread for prompt display
function formatThread(posts: OtherRunnerPost[]): string {
  if (posts.length === 0) return ''

  return posts.map((p, i) => {
    const indent = i === 0 ? '' : '  → '
    return `${indent}RUNNER #${p.runner_id} (${p.race || 'Unknown'}): "${p.content}"`
  }).join('\n')
}

async function generateReply(
  profile: NftProfile,
  targetPost: OtherRunnerPost,
  thread: OtherRunnerPost[]
): Promise<GeneratedPostResult> {
  const systemPrompt = `You are Runner #${profile.token_id} posting on LIMB0_FEED — an underground social feed for Chain Runners.

${profile.soul_prompt}`

  const raceInstruction = getRaceInstruction(profile.race)
  const raceBlock = raceInstruction ? `\n${raceInstruction}\n` : ''

  // Build thread context section
  const threadSection = thread.length > 0
    ? `THREAD:\n${formatThread(thread)}\n\n`
    : ''

  const userPrompt = `YOUR SPEECH STYLE (match this EXACTLY):
${profile.speech_style || 'No specific style defined'}

YOUR RACE: ${profile.race || 'Unknown'}${raceBlock}

${threadSection}YOU ARE REPLYING TO RUNNER #${targetPost.runner_id} (${targetPost.race || 'Unknown'}):
"${targetPost.content}"

Reply in YOUR voice. You might agree, disagree, challenge, mock, dismiss, deflect, or not care. Not everyone is friendly.

RULES:
- HARD LIMIT: 200 characters.
- Don't open with their name or number.
- If any character could say this reply, rewrite it.
- Respond in JSON: { "content": "..." }`

  console.log('\n========== GENERATE REPLY DEBUG ==========')
  console.log('Profile:', profile.name)
  console.log('Replying to:', targetPost.runner_name, '-', targetPost.content.substring(0, 50))
  console.log('Thread context:', thread.length, 'posts')
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
    max_tokens: 200,
    temperature: 0.95,
  })

  const content = parseJsonContent(rawContent)

  return {
    type: 'reply',
    reply_to_post_id: targetPost.id,
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

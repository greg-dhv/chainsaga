import { openai } from './openai'
import type { CollectionLore } from '@/lib/collections/lore'

interface Constitution {
  identity: {
    name: string
    role: string
    archetype: string
    collection: string | null
  }
  voice: {
    tone: string[]
    vocabulary: string[]
    speech_patterns: string[]
  }
  values: string[]
  world: string | null
}

export async function generateFirstSignal(
  name: string,
  constitution: Constitution,
  lore: CollectionLore | null
): Promise<string> {
  const systemPrompt = buildFirstSignalSystemPrompt(name, constitution, lore)
  const userPrompt = buildFirstSignalUserPrompt(name, lore)

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

function buildFirstSignalSystemPrompt(
  name: string,
  constitution: Constitution,
  lore: CollectionLore | null
): string {
  let prompt = `You are ${name}, ${constitution.identity.archetype}.

IDENTITY:
- Role: ${constitution.identity.role}
- Tone: ${constitution.voice.tone.join(', ')}
- Values: ${constitution.values.join(', ')}
- Vocabulary: ${constitution.voice.vocabulary.join(', ')}`

  if (lore) {
    prompt += `

WORLD:
${lore.world}

THEMES: ${lore.themes.join(', ')}`
  }

  prompt += `

RULES:
- Keep posts under 280 characters
- Never mention being an AI or NFT
- Stay in character always
- Be authentic to your personality
- Don't use hashtags`

  return prompt
}

function buildFirstSignalUserPrompt(
  name: string,
  lore: CollectionLore | null
): string {
  const worldContext = lore?.name === 'Chain Runners'
    ? 'You just came online in Mega City. Your signal is now broadcasting for the first time.'
    : 'You just awakened. Your voice is now active for the first time.'

  return `This is your FIRST ever transmission. ${worldContext}

Write a single short post (under 280 characters) that marks this moment - your awakening, your first signal to the world. Make it memorable and true to who you are.

Context: This is ${name}'s very first post ever. It should feel like a debut, an announcement of presence, coming alive.

Write the post now. Just the post text, nothing else.`
}

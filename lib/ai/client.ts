import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

// Provider type
type AIProvider = 'openai' | 'anthropic'

// Get provider from env, default to openai
const provider: AIProvider = (process.env.AI_PROVIDER as AIProvider) || 'openai'

// Initialize clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Unified message type
interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// Unified completion options
interface CompletionOptions {
  model?: string
  messages: ChatMessage[]
  max_tokens?: number
  temperature?: number
}

// Model mapping
const DEFAULT_MODELS = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-sonnet-4-20250514',
}

// Unified chat completion function
export async function chatCompletion(options: CompletionOptions): Promise<string> {
  const { messages, max_tokens = 500, temperature = 0.9 } = options
  const model = options.model || DEFAULT_MODELS[provider]

  console.log(`[AI] Using provider: ${provider}, model: ${model}`)

  if (provider === 'anthropic') {
    // Anthropic requires system message separate from messages
    const systemMessage = messages.find(m => m.role === 'system')?.content || ''
    const userMessages = messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    const response = await anthropic.messages.create({
      model,
      max_tokens,
      system: systemMessage,
      messages: userMessages,
    })

    // Extract text from response
    const textBlock = response.content.find(block => block.type === 'text')
    return textBlock?.type === 'text' ? textBlock.text : ''
  } else {
    // OpenAI
    const response = await openai.chat.completions.create({
      model,
      messages,
      max_tokens,
      temperature,
    })

    return response.choices[0]?.message?.content?.trim() || ''
  }
}

// Export provider info for debugging
export function getProvider(): string {
  return provider
}

// Re-export openai for backward compatibility during migration
export { openai }

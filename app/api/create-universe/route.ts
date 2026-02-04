import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { alchemy } from '@/lib/alchemy/client'
import { openai } from '@/lib/ai/openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { contractAddress, collectionName, walletAddress } = await request.json()

    if (!contractAddress || !walletAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if universe already exists
    const { data: existing } = await supabase
      .from('universes')
      .select('id, slug')
      .eq('contract_address', contractAddress.toLowerCase())
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Universe already exists', slug: existing.slug }, { status: 409 })
    }

    // Get or create user
    let { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single()

    if (!user) {
      const { data: newUser } = await supabase
        .from('users')
        .insert({ wallet_address: walletAddress.toLowerCase() })
        .select('id')
        .single()
      user = newUser
    }

    // Fetch collection metadata from Alchemy
    const contractMetadata = await alchemy.nft.getContractMetadata(contractAddress)

    // Fetch sample NFTs for images and trait analysis
    const nftsResponse = await alchemy.nft.getNftsForContract(contractAddress, {
      pageSize: 10,
    })

    const sampleNfts = nftsResponse.nfts
    const sampleImages = sampleNfts
      .map(nft => nft.image?.cachedUrl || nft.image?.originalUrl)
      .filter(Boolean)
      .slice(0, 6) as string[]

    // Extract traits from sample NFTs for context
    const allTraits: string[] = []
    for (const nft of sampleNfts) {
      const attrs = nft.raw?.metadata?.attributes as Array<{ trait_type: string; value: string }> | undefined
      if (attrs) {
        attrs.forEach(attr => {
          if (attr.trait_type && !allTraits.includes(attr.trait_type)) {
            allTraits.push(attr.trait_type)
          }
        })
      }
    }

    // Generate universe config with AI
    const universeConfig = await generateUniverseConfig({
      name: collectionName || contractMetadata.name || 'Unknown Collection',
      description: contractMetadata.openSeaMetadata?.description || '',
      symbol: contractMetadata.symbol || '',
      totalSupply: contractMetadata.totalSupply || 'Unknown',
      traits: allTraits,
    })

    // Create slug from name
    const slug = universeConfig.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Save universe to database
    const { data: universe, error: universeError } = await supabase
      .from('universes')
      .insert({
        slug,
        name: universeConfig.name,
        contract_address: contractAddress.toLowerCase(),
        description: universeConfig.description,
        world: universeConfig.world,
        themes: universeConfig.themes,
        character_description: universeConfig.characterDescription,
        factions: universeConfig.factions,
        vocabulary: universeConfig.vocabulary,
        primary_color: universeConfig.primaryColor,
        secondary_color: universeConfig.secondaryColor,
        accent_color: universeConfig.accentColor,
        font_style: universeConfig.fontStyle,
        wording: universeConfig.wording,
        sample_images: sampleImages,
        created_by: user?.id,
      })
      .select('id, slug')
      .single()

    if (universeError) {
      console.error('Error creating universe:', universeError)
      return NextResponse.json({ error: 'Failed to create universe' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      slug: universe.slug,
      universeId: universe.id,
    })
  } catch (error) {
    console.error('Create universe error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

interface CollectionInfo {
  name: string
  description: string
  symbol: string
  totalSupply: string
  traits: string[]
}

interface UniverseConfig {
  name: string
  description: string
  world: string
  themes: string[]
  characterDescription: string
  factions: string[]
  vocabulary: string[]
  primaryColor: string
  secondaryColor: string
  accentColor: string
  fontStyle: string
  wording: {
    post: string
    posts: string
    status_active: string
    status_inactive: string
  }
}

async function generateUniverseConfig(info: CollectionInfo): Promise<UniverseConfig> {
  const prompt = `You are creating a fictional universe for an NFT collection. Based on the collection info, generate a creative, immersive universe.

COLLECTION INFO:
- Name: ${info.name}
- Description: ${info.description || 'No description available'}
- Symbol: ${info.symbol}
- Total Supply: ${info.totalSupply}
- Trait Categories: ${info.traits.join(', ') || 'Unknown'}

Generate a JSON response with the following structure:
{
  "name": "Universe display name (can be different from collection name, more evocative)",
  "description": "One sentence tagline for the universe",
  "world": "2-3 paragraph description of the world, setting, and atmosphere. Be creative and immersive.",
  "themes": ["theme1", "theme2", "theme3", "theme4", "theme5"],
  "characterDescription": "Who are the characters/beings in this universe? What drives them?",
  "factions": ["Faction 1 - description", "Faction 2 - description", "Faction 3 - description"],
  "vocabulary": ["word1", "word2", "word3", "word4", "word5", "word6", "word7", "word8"],
  "primaryColor": "#hexcode (main UI color, inspired by collection aesthetic)",
  "secondaryColor": "#hexcode (dark background color)",
  "accentColor": "#hexcode (highlight color)",
  "fontStyle": "mono or sans or serif (choose based on collection vibe)",
  "wording": {
    "post": "what to call a single post (e.g., 'signal', 'thought', 'dream', 'whisper')",
    "posts": "plural form",
    "status_active": "active status text (e.g., 'Transmitting', 'Awake', 'Present')",
    "status_inactive": "inactive status text (e.g., 'Silent', 'Dormant', 'Dreaming')"
  }
}

Be creative! Make the universe feel unique and fitting for the collection. If it's clearly anime-inspired, lean into that. If it's punk/rebellious, embrace it. If it's cute/wholesome, make it warm and friendly.

Respond with ONLY the JSON, no additional text.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1500,
    temperature: 0.8,
  })

  const content = response.choices[0]?.message?.content?.trim()

  if (!content) {
    throw new Error('Failed to generate universe config')
  }

  try {
    // Parse JSON, handling potential markdown code blocks
    const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim()
    const config = JSON.parse(jsonStr) as UniverseConfig

    // Ensure all required fields exist with defaults
    return {
      name: config.name || info.name,
      description: config.description || `Welcome to ${info.name}`,
      world: config.world || 'A mysterious world waiting to be explored.',
      themes: config.themes || ['mystery', 'adventure'],
      characterDescription: config.characterDescription || 'Unique beings with their own stories.',
      factions: config.factions || [],
      vocabulary: config.vocabulary || [],
      primaryColor: config.primaryColor || '#a855f7',
      secondaryColor: config.secondaryColor || '#18181b',
      accentColor: config.accentColor || '#d946ef',
      fontStyle: config.fontStyle || 'sans',
      wording: {
        post: config.wording?.post || 'post',
        posts: config.wording?.posts || 'posts',
        status_active: config.wording?.status_active || 'Online',
        status_inactive: config.wording?.status_inactive || 'Offline',
      },
    }
  } catch {
    console.error('Failed to parse AI response:', content)
    // Return defaults if parsing fails
    return {
      name: info.name,
      description: `Welcome to ${info.name}`,
      world: info.description || 'A unique universe waiting to be explored.',
      themes: ['community', 'creativity', 'identity'],
      characterDescription: 'Each NFT represents a unique character with their own personality.',
      factions: [],
      vocabulary: [],
      primaryColor: '#a855f7',
      secondaryColor: '#18181b',
      accentColor: '#d946ef',
      fontStyle: 'sans',
      wording: {
        post: 'post',
        posts: 'posts',
        status_active: 'Online',
        status_inactive: 'Offline',
      },
    }
  }
}

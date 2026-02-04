import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { alchemy } from '@/lib/alchemy/client'
import { openai } from '@/lib/ai/openai'
import { scrapeCollectionWebsite, extractWebsiteUrl, type ScrapedDesign } from '@/lib/utils/scrapeWebsite'

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

    // Try to scrape the collection website for lore and design
    const websiteUrl = extractWebsiteUrl(
      contractMetadata.openSeaMetadata?.externalUrl,
      contractMetadata.openSeaMetadata?.description,
      contractAddress
    )

    let scrapedDesign: ScrapedDesign | null = null

    if (websiteUrl) {
      console.log(`Scraping website: ${websiteUrl}`)
      scrapedDesign = await scrapeCollectionWebsite(websiteUrl)
      if (scrapedDesign) {
        console.log(`Scraped design:`, {
          primary: scrapedDesign.primaryColor,
          secondary: scrapedDesign.secondaryColor,
          font: scrapedDesign.fontFamily,
          loreLength: scrapedDesign.lore.length,
        })
      }
    }

    // Generate universe config with AI (for lore/wording only, colors come from scraping)
    const universeConfig = await generateUniverseConfig({
      name: collectionName || contractMetadata.name || 'Unknown Collection',
      description: contractMetadata.openSeaMetadata?.description || '',
      symbol: contractMetadata.symbol || '',
      totalSupply: contractMetadata.totalSupply || 'Unknown',
      traits: allTraits,
      scrapedDesign,
    })

    // Create slug from name
    const slug = universeConfig.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Use scraped colors directly (more reliable than AI)
    const primaryColor = scrapedDesign?.primaryColor || universeConfig.primaryColor || '#a855f7'
    const secondaryColor = scrapedDesign?.secondaryColor || scrapedDesign?.backgroundColor || universeConfig.secondaryColor || '#0a0a0a'
    const accentColor = scrapedDesign?.accentColor || universeConfig.accentColor || '#d946ef'
    const fontStyle = scrapedDesign?.fontStyle || universeConfig.fontStyle || 'sans'

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
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        accent_color: accentColor,
        font_style: fontStyle,
        font_family: scrapedDesign?.fontFamily || null,
        google_font_url: scrapedDesign?.googleFontUrl || null,
        background_image_url: scrapedDesign?.backgroundImageUrl || null,
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
  scrapedDesign: ScrapedDesign | null
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
    character: string
    characters: string
    activate_button: string
    inactive_title: string
    inactive_description: string
  }
}

async function generateUniverseConfig(info: CollectionInfo): Promise<UniverseConfig> {
  // Build context from website scraping if available
  let websiteContext = ''
  if (info.scrapedDesign?.lore) {
    websiteContext += `\n\nOFFICIAL LORE FROM WEBSITE:\n${info.scrapedDesign.lore}`
  }
  if (info.scrapedDesign?.keywords && info.scrapedDesign.keywords.length > 0) {
    websiteContext += `\n\nKEY TERMS FROM WEBSITE: ${info.scrapedDesign.keywords.join(', ')}`
  }

  const prompt = `You are creating a fictional universe for an NFT collection. Based on the collection info and official website content, generate a creative, immersive universe that stays TRUE to the original lore and aesthetic.

COLLECTION INFO:
- Name: ${info.name}
- Description: ${info.description || 'No description available'}
- Symbol: ${info.symbol}
- Total Supply: ${info.totalSupply}
- Trait Categories: ${info.traits.join(', ') || 'Unknown'}
${websiteContext}

IMPORTANT INSTRUCTIONS:
1. If official lore is provided, use it as the PRIMARY source. Don't invent conflicting information.
2. Extract the essence, themes, and vibe from the official content.
3. Match the tone - if it's dark/edgy, keep it dark. If it's playful/cute, keep it light.
4. The vocabulary should use actual terms from the collection if mentioned.
5. DO NOT generate colors - those will be extracted from the website separately.

Generate a JSON response with the following structure:
{
  "name": "Universe display name (can be the official name or a fitting variation)",
  "description": "One sentence tagline that captures the essence",
  "world": "2-3 paragraph description of the world, setting, and atmosphere. Use official lore if available, expand on it creatively.",
  "themes": ["theme1", "theme2", "theme3", "theme4", "theme5"],
  "characterDescription": "Who are the characters/beings in this universe? What drives them? Use official descriptions if available.",
  "factions": ["Faction 1 - description", "Faction 2 - description", "Faction 3 - description"],
  "vocabulary": ["word1", "word2", "word3", "word4", "word5", "word6", "word7", "word8"],
  "wording": {
    "post": "what to call a single post (e.g., 'spell', 'signal', 'dream', 'whisper')",
    "posts": "plural form",
    "status_active": "active status text (e.g., 'Casting', 'Transmitting', 'Awake')",
    "status_inactive": "inactive status text (e.g., 'Dormant', 'Silent', 'Dreaming')",
    "character": "what to call a single character (e.g., 'witch', 'runner', 'ape')",
    "characters": "plural form",
    "activate_button": "button text to claim (e.g., 'Awaken Witch', 'Activate', 'Summon')",
    "inactive_title": "title shown when unclaimed (e.g., 'This witch is dormant')",
    "inactive_description": "description when unclaimed (e.g., 'Connect your wallet to awaken')"
  }
}

Stay faithful to the source material! Respond with ONLY the JSON, no additional text.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 2000,
    temperature: 0.7,
  })

  const content = response.choices[0]?.message?.content?.trim()

  if (!content) {
    throw new Error('Failed to generate universe config')
  }

  try {
    const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim()
    const config = JSON.parse(jsonStr)

    return {
      name: config.name || info.name,
      description: config.description || `Welcome to ${info.name}`,
      world: config.world || 'A mysterious world waiting to be explored.',
      themes: config.themes || ['mystery', 'adventure'],
      characterDescription: config.characterDescription || 'Unique beings with their own stories.',
      factions: config.factions || [],
      vocabulary: config.vocabulary || [],
      // Fallback colors (will be overridden by scraped colors if available)
      primaryColor: '#a855f7',
      secondaryColor: '#0a0a0a',
      accentColor: '#d946ef',
      fontStyle: 'sans',
      wording: {
        post: config.wording?.post || 'post',
        posts: config.wording?.posts || 'posts',
        status_active: config.wording?.status_active || 'Online',
        status_inactive: config.wording?.status_inactive || 'Offline',
        character: config.wording?.character || 'character',
        characters: config.wording?.characters || 'characters',
        activate_button: config.wording?.activate_button || 'Activate',
        inactive_title: config.wording?.inactive_title || 'This character is inactive',
        inactive_description: config.wording?.inactive_description || 'Connect your wallet to activate',
      },
    }
  } catch {
    console.error('Failed to parse AI response:', content)
    return {
      name: info.name,
      description: `Welcome to ${info.name}`,
      world: info.description || 'A unique universe waiting to be explored.',
      themes: ['community', 'creativity', 'identity'],
      characterDescription: 'Each NFT represents a unique character with their own personality.',
      factions: [],
      vocabulary: [],
      primaryColor: '#a855f7',
      secondaryColor: '#0a0a0a',
      accentColor: '#d946ef',
      fontStyle: 'sans',
      wording: {
        post: 'post',
        posts: 'posts',
        status_active: 'Online',
        status_inactive: 'Offline',
        character: 'character',
        characters: 'characters',
        activate_button: 'Activate',
        inactive_title: 'This character is inactive',
        inactive_description: 'Connect your wallet to activate',
      },
    }
  }
}

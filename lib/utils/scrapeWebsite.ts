/**
 * Website scraping utility for extracting lore and design information
 * from NFT collection websites.
 */

export interface ScrapedDesign {
  // Colors
  primaryColor: string | null
  secondaryColor: string | null
  accentColor: string | null
  backgroundColor: string | null

  // Typography
  fontFamily: string | null
  googleFontUrl: string | null
  fontStyle: 'mono' | 'sans' | 'serif'

  // Background
  backgroundImageUrl: string | null
  heroImageUrl: string | null

  // Content
  lore: string
  keywords: string[]
}

/**
 * Fetches and parses a website to extract design and content information.
 */
export async function scrapeCollectionWebsite(url: string): Promise<ScrapedDesign | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      console.log(`Failed to fetch ${url}: ${response.status}`)
      return null
    }

    const html = await response.text()
    const textContent = extractTextContent(html)

    // Extract all design elements
    const colors = extractBrandColors(html)
    const fonts = extractFonts(html)
    const images = extractImages(html, url)
    const lore = extractLoreContent(html, textContent)
    const keywords = extractKeywords(textContent)

    console.log(`Scraped ${url}:`, {
      colors,
      fonts,
      images: { hero: images.heroImageUrl?.slice(0, 50), bg: images.backgroundImageUrl?.slice(0, 50) },
    })

    return {
      primaryColor: colors.primary,
      secondaryColor: colors.secondary,
      accentColor: colors.accent,
      backgroundColor: colors.background,
      fontFamily: fonts.fontFamily,
      googleFontUrl: fonts.googleFontUrl,
      fontStyle: fonts.fontStyle,
      backgroundImageUrl: images.backgroundImageUrl,
      heroImageUrl: images.heroImageUrl,
      lore,
      keywords,
    }
  } catch (error) {
    console.error(`Error scraping ${url}:`, error)
    return null
  }
}

/**
 * Extract brand colors - simplified approach using frequency analysis.
 */
function extractBrandColors(html: string): {
  primary: string | null
  secondary: string | null
  accent: string | null
  background: string | null
} {
  const colorCounts = new Map<string, number>()

  // Count ALL hex colors
  const hexMatches = html.match(/#[0-9A-Fa-f]{6}\b/g) || []
  hexMatches.forEach(c => {
    const color = c.toLowerCase()
    colorCounts.set(color, (colorCounts.get(color) || 0) + 1)
  })

  // Also count RGB colors converted to hex
  const rgbMatches = html.match(/rgba?\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+/g) || []
  rgbMatches.forEach(c => {
    const nums = c.match(/\d+/g)
    if (nums && nums.length >= 3) {
      const hex = '#' + nums.slice(0, 3).map(n => parseInt(n).toString(16).padStart(2, '0')).join('')
      colorCounts.set(hex.toLowerCase(), (colorCounts.get(hex.toLowerCase()) || 0) + 1)
    }
  })

  // Sort by frequency and filter boring colors
  const sortedColors = Array.from(colorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([color]) => color)
    .filter(c => isInterestingColor(c))

  // Find dark colors for background
  const darkColors = sortedColors.filter(c => {
    const { l } = getHSL(c)
    return l < 0.15
  })

  // Find vibrant/saturated colors for primary/accent
  const vibrantColors = sortedColors.filter(c => {
    const { s, l } = getHSL(c)
    return s > 0.2 && l > 0.15 && l < 0.85
  })

  console.log('Color extraction results:', {
    topColors: sortedColors.slice(0, 5),
    vibrant: vibrantColors.slice(0, 3),
    dark: darkColors.slice(0, 2),
  })

  return {
    primary: vibrantColors[0] || sortedColors[0] || null,
    secondary: darkColors[0] || vibrantColors[1] || sortedColors[1] || null,
    accent: vibrantColors[1] || vibrantColors[0] || sortedColors[2] || null,
    background: darkColors[0] || '#0a0a0a',
  }
}

/**
 * Get HSL values from hex color.
 */
function getHSL(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2

  let h = 0
  let s = 0

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return { h, s, l }
}
/**
 * Check if a color is "interesting" (not boring black/white/gray).
 */
function isInterestingColor(hex: string): boolean {
  if (!hex || !hex.startsWith('#') || hex.length !== 7) return false

  // Skip exact black/white
  if (hex === '#000000' || hex === '#ffffff') return false

  const { s, l } = getHSL(hex)

  // Skip grays (low saturation) in the middle lightness range
  if (s < 0.08 && l > 0.1 && l < 0.9) {
    return false
  }

  return true
}
/**
 * Extract font information.
 */
function extractFonts(html: string): {
  fontFamily: string | null
  googleFontUrl: string | null
  fontStyle: 'mono' | 'sans' | 'serif'
} {
  // Look for Google Fonts
  const googleFontMatch = html.match(/https:\/\/fonts\.googleapis\.com\/css2?\?[^"'\s>]+/i)
  let googleFontUrl: string | null = null
  let fontFamily: string | null = null

  if (googleFontMatch) {
    googleFontUrl = googleFontMatch[0].replace(/&amp;/g, '&')
    // Extract font family from Google Fonts URL
    const familyMatch = googleFontUrl.match(/family=([^:&]+)/)
    if (familyMatch) {
      fontFamily = decodeURIComponent(familyMatch[1].replace(/\+/g, ' '))
    }
  }

  // Look for @font-face declarations
  if (!fontFamily) {
    const fontFaceMatch = html.match(/@font-face\s*\{[^}]*font-family:\s*["']?([^"';}]+)/i)
    if (fontFaceMatch) {
      fontFamily = fontFaceMatch[1].trim()
    }
  }

  // Look for primary font-family in body/html
  if (!fontFamily) {
    const bodyFontMatch = html.match(/(?:body|html)\s*\{[^}]*font-family:\s*["']?([^"',;}]+)/i)
    if (bodyFontMatch) {
      fontFamily = bodyFontMatch[1].trim()
    }
  }

  // Determine font style
  let fontStyle: 'mono' | 'sans' | 'serif' = 'sans'
  const fontLower = (fontFamily || '').toLowerCase()

  if (fontLower.includes('mono') || fontLower.includes('code') || fontLower.includes('courier') || fontLower.includes('consolas')) {
    fontStyle = 'mono'
  } else if (fontLower.includes('serif') && !fontLower.includes('sans')) {
    fontStyle = 'serif'
  } else if (fontLower.includes('gothic') || fontLower.includes('times') || fontLower.includes('georgia')) {
    fontStyle = 'serif'
  }

  // Also check CSS for font hints
  if (fontStyle === 'sans') {
    if (/font-family:[^;]*monospace/i.test(html)) {
      fontStyle = 'mono'
    } else if (/font-family:[^;]*(?<!sans-)serif/i.test(html)) {
      fontStyle = 'serif'
    }
  }

  return { fontFamily, googleFontUrl, fontStyle }
}

/**
 * Extract background and hero images.
 */
function extractImages(html: string, baseUrl: string): {
  backgroundImageUrl: string | null
  heroImageUrl: string | null
} {
  const resolveUrl = (url: string): string => {
    if (!url) return ''
    if (url.startsWith('http')) return url
    if (url.startsWith('//')) return 'https:' + url
    if (url.startsWith('/')) {
      const base = new URL(baseUrl)
      return base.origin + url
    }
    return new URL(url, baseUrl).href
  }

  let heroImageUrl: string | null = null
  let backgroundImageUrl: string | null = null

  // Look for OpenGraph image (usually the best hero image)
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i)

  if (ogImageMatch) {
    heroImageUrl = resolveUrl(ogImageMatch[1])
  }

  // Look for Twitter card image
  if (!heroImageUrl) {
    const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
    if (twitterImageMatch) {
      heroImageUrl = resolveUrl(twitterImageMatch[1])
    }
  }

  // Look for hero section images
  if (!heroImageUrl) {
    const heroImgMatch = html.match(/<(?:section|div)[^>]*(?:class|id)=["'][^"']*hero[^"']*["'][^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/i)
    if (heroImgMatch) {
      heroImageUrl = resolveUrl(heroImgMatch[1])
    }
  }

  // Look for background-image CSS
  const bgImageMatches = html.match(/background(?:-image)?:\s*url\s*\(\s*["']?([^"')]+)["']?\s*\)/gi) || []
  for (const match of bgImageMatches) {
    const urlMatch = match.match(/url\s*\(\s*["']?([^"')]+)["']?\s*\)/)
    if (urlMatch) {
      const url = resolveUrl(urlMatch[1])
      // Skip tiny images, icons, and data URIs
      if (!url.includes('data:') && !url.includes('.svg') && !url.includes('icon')) {
        backgroundImageUrl = url
        break
      }
    }
  }

  // If no background found, use hero as background
  if (!backgroundImageUrl && heroImageUrl) {
    backgroundImageUrl = heroImageUrl
  }

  return { backgroundImageUrl, heroImageUrl }
}

/**
 * Extracts readable text from HTML.
 */
function extractTextContent(html: string): string {
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
  text = text.replace(/<!--[\s\S]*?-->/g, '')
  text = text.replace(/<[^>]+>/g, ' ')
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&quot;/g, '"')
  text = text.replace(/&#39;/g, "'")
  text = text.replace(/\s+/g, ' ').trim()
  return text
}

/**
 * Extracts important keywords from text content.
 */
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
    'that', 'which', 'who', 'whom', 'this', 'these', 'those', 'it', 'its', 'they',
    'their', 'them', 'we', 'our', 'us', 'you', 'your', 'he', 'she', 'him', 'her',
    'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such',
    'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
    'can', 'now', 'new', 'one', 'two', 'also', 'any', 'here', 'there', 'where', 'when',
    'nfts', 'nft', 'mint', 'minting', 'ethereum', 'opensea', 'connect', 'wallet',
  ])

  const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || []
  const freq: Map<string, number> = new Map()

  words.forEach(word => {
    if (!stopWords.has(word)) {
      freq.set(word, (freq.get(word) || 0) + 1)
    }
  })

  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word)
}

/**
 * Extracts lore-like content.
 */
function extractLoreContent(html: string, textContent: string): string {
  const loreSections: string[] = []

  const sectionPatterns = [
    /<(?:section|div|article)[^>]*(?:class|id)=["'][^"']*(?:lore|story|about|world|universe|history|legend|narrative)[^"']*["'][^>]*>([\s\S]*?)<\/(?:section|div|article)>/gi,
  ]

  sectionPatterns.forEach(pattern => {
    const matches = html.matchAll(pattern)
    for (const match of matches) {
      if (match[1]) {
        const cleaned = extractTextContent(match[1])
        if (cleaned.length > 50 && cleaned.length < 3000) {
          loreSections.push(cleaned)
        }
      }
    }
  })

  const paragraphs = html.match(/<p[^>]*>([^<]{80,})<\/p>/gi) || []
  paragraphs.forEach(p => {
    const cleaned = extractTextContent(p)
    if (cleaned.length > 80 && cleaned.length < 1000) {
      if (/\b(world|story|legend|ancient|magic|power|realm|kingdom|battle|hero|journey|quest|witch|coven|spell|curse)\b/i.test(cleaned)) {
        loreSections.push(cleaned)
      }
    }
  })

  const combined = loreSections.join('\n\n')

  if (combined.length < 100) {
    const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 50)
    return sentences.slice(0, 10).join('. ').slice(0, 2000)
  }

  return combined.slice(0, 3000)
}

// Known collection websites (fallback when Alchemy doesn't provide URL)
const KNOWN_COLLECTION_WEBSITES: Record<string, string> = {
  '0x5180db8f5c931aae63c74266b211f580155ecac8': 'https://www.cryptocoven.xyz/',
  '0x97597002980134bea46250aa0510c9b90d87a587': 'https://chainrunners.xyz/',
  '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d': 'https://boredapeyachtclub.com/',
  '0x60e4d786628fea6478f785a6d7e704777c86a7c6': 'https://boredapeyachtclub.com/',
  '0xed5af388653567af2f388e6224dc7c4b3241c544': 'https://azuki.com/',
  '0x49cf6f5d44e70224e2e23fdcdd2c053f30ada28b': 'https://clonex.rtfkt.com/',
  '0x8a90cab2b38dba80c64b7734e58ee1db38b8992e': 'https://doodles.app/',
  '0x1a92f7381b9f03921564a437210bb9396471050c': 'https://coolcatsnft.com/',
  '0x7bd29408f11d2bfc23c34f18275bbf23bb716bc7': 'https://meebits.app/',
}

/**
 * Tries to find the official website for an NFT collection.
 */
export function extractWebsiteUrl(
  openSeaExternalUrl?: string,
  openSeaDescription?: string,
  contractAddress?: string
): string | null {
  // First try the external URL from OpenSea
  if (openSeaExternalUrl && isValidUrl(openSeaExternalUrl)) {
    return openSeaExternalUrl
  }

  // Check known collection websites
  if (contractAddress) {
    const knownUrl = KNOWN_COLLECTION_WEBSITES[contractAddress.toLowerCase()]
    if (knownUrl) {
      return knownUrl
    }
  }

  // Try to extract URL from description
  if (openSeaDescription) {
    const urlMatch = openSeaDescription.match(/https?:\/\/[^\s<>"{}|\\^`[\]]+/i)
    if (urlMatch && isValidUrl(urlMatch[0])) {
      const url = urlMatch[0].toLowerCase()
      if (!url.includes('opensea.io') &&
          !url.includes('twitter.com') &&
          !url.includes('discord.') &&
          !url.includes('etherscan.io')) {
        return urlMatch[0]
      }
    }
  }

  return null
}

function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

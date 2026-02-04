import { NextRequest, NextResponse } from 'next/server'
import { scrapeCollectionWebsite } from '@/lib/utils/scrapeWebsite'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url') || 'https://www.cryptocoven.xyz/'

  console.log('Debug scraping:', url)

  const result = await scrapeCollectionWebsite(url)

  return NextResponse.json({
    url,
    result,
  })
}

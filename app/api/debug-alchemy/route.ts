import { NextRequest, NextResponse } from 'next/server'
import { alchemy } from '@/lib/alchemy/client'
import { extractWebsiteUrl } from '@/lib/utils/scrapeWebsite'

export async function GET(request: NextRequest) {
  const contract = request.nextUrl.searchParams.get('contract') || '0x5180db8F5c931aaE63c74266b211F580155ecac8'

  const metadata = await alchemy.nft.getContractMetadata(contract)

  const websiteUrl = extractWebsiteUrl(
    metadata.openSeaMetadata?.externalUrl,
    metadata.openSeaMetadata?.description,
    contract
  )

  return NextResponse.json({
    contract,
    name: metadata.name,
    externalUrl: metadata.openSeaMetadata?.externalUrl,
    descriptionPreview: metadata.openSeaMetadata?.description?.slice(0, 200),
    extractedWebsiteUrl: websiteUrl,
  })
}

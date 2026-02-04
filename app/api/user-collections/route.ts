import { NextRequest, NextResponse } from 'next/server'
import { alchemy } from '@/lib/alchemy/client'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const wallet = searchParams.get('wallet')

  if (!wallet) {
    return NextResponse.json({ error: 'Missing wallet address' }, { status: 400 })
  }

  try {
    // Fetch all NFTs for this wallet
    const response = await alchemy.nft.getNftsForOwner(wallet, {
      pageSize: 100,
    })

    // Get existing universes to filter them out
    const { data: existingUniverses } = await supabase
      .from('universes')
      .select('contract_address')

    const existingContracts = new Set(
      (existingUniverses || []).map((u: { contract_address: string }) => u.contract_address.toLowerCase())
    )

    // Group NFTs by collection, excluding existing universes
    const collectionsMap = new Map<string, {
      contractAddress: string
      name: string
      nfts: Array<{ tokenId: string; name: string; imageUrl: string }>
    }>()

    for (const nft of response.ownedNfts) {
      const contractAddress = nft.contract.address.toLowerCase()

      // Skip if universe already exists
      if (existingContracts.has(contractAddress)) {
        continue
      }

      if (!collectionsMap.has(contractAddress)) {
        collectionsMap.set(contractAddress, {
          contractAddress,
          name: nft.contract.name || nft.contract.symbol || 'Unknown Collection',
          nfts: [],
        })
      }

      collectionsMap.get(contractAddress)!.nfts.push({
        tokenId: nft.tokenId,
        name: nft.name || `#${nft.tokenId}`,
        imageUrl: nft.image?.cachedUrl || nft.image?.originalUrl || '',
      })
    }

    // Convert to array and sort by NFT count
    const collections = Array.from(collectionsMap.values())
      .sort((a, b) => b.nfts.length - a.nfts.length)

    return NextResponse.json({ collections })
  } catch (error) {
    console.error('Error fetching collections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch collections' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getNftsForOwner } from '@/lib/alchemy/nfts'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const wallet = searchParams.get('wallet')
  const tokenId = searchParams.get('tokenId')
  const contract = searchParams.get('contract')

  if (!wallet || !tokenId || !contract) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    )
  }

  try {
    // Fetch NFTs owned by this wallet for this contract
    const nfts = await getNftsForOwner(wallet, [contract])

    // Check if the specific tokenId is in the list
    const isOwner = nfts.some(
      (nft) =>
        nft.contractAddress.toLowerCase() === contract.toLowerCase() &&
        nft.tokenId === tokenId
    )

    return NextResponse.json({ isOwner })
  } catch (error) {
    console.error('Verify ownership error:', error)
    return NextResponse.json(
      { error: 'Failed to verify ownership' },
      { status: 500 }
    )
  }
}

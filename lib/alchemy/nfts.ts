import { alchemy } from './client'
import type { OwnedNft } from 'alchemy-sdk'
import { getCollectionName } from '@/lib/collections/lore'

export interface NftData {
  contractAddress: string
  tokenId: string
  name: string | null
  collectionName: string
  description: string | null
  imageUrl: string | null
  traits: Array<{ trait_type: string; value: string }>
}

export async function getNftsForOwner(
  ownerAddress: string,
  contractAddress?: string
): Promise<NftData[]> {
  const options = contractAddress
    ? { contractAddresses: [contractAddress] }
    : {}

  const response = await alchemy.nft.getNftsForOwner(ownerAddress, options)

  return response.ownedNfts.map((nft: OwnedNft) => ({
    contractAddress: nft.contract.address,
    tokenId: nft.tokenId,
    name: nft.name || nft.raw?.metadata?.name || null,
    collectionName: getCollectionName(nft.contract.address, nft.contract.name || undefined),
    description: nft.description || nft.raw?.metadata?.description || null,
    imageUrl: nft.image?.cachedUrl || nft.image?.originalUrl || null,
    traits: (nft.raw?.metadata?.attributes || []).map((attr: { trait_type?: string; value?: string }) => ({
      trait_type: attr.trait_type || '',
      value: String(attr.value || ''),
    })),
  }))
}

export async function verifyNftOwnership(
  ownerAddress: string,
  contractAddress: string,
  tokenId: string
): Promise<boolean> {
  const owners = await alchemy.nft.getOwnersForNft(contractAddress, tokenId)
  return owners.owners.some(
    (owner) => owner.toLowerCase() === ownerAddress.toLowerCase()
  )
}

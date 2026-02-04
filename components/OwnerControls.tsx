'use client'

import { useAccount } from 'wagmi'
import { RegenerateButton } from './RegenerateButton'
import { GeneratePostButton } from './GeneratePostButton'

interface OwnerControlsProps {
  profileId: string
  ownerAddress: string | null
  type: 'bio' | 'post'
}

export function OwnerControls({ profileId, ownerAddress, type }: OwnerControlsProps) {
  const { address, isConnected } = useAccount()

  // Check if connected user is the owner
  const isOwner = isConnected &&
    address &&
    ownerAddress &&
    address.toLowerCase() === ownerAddress.toLowerCase()

  if (!isOwner) {
    return null
  }

  if (type === 'bio') {
    return <RegenerateButton profileId={profileId} />
  }

  if (type === 'post') {
    return <GeneratePostButton profileId={profileId} />
  }

  return null
}

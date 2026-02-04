/**
 * Utility functions for handling NFT traits across different collections.
 * Different collections have different trait formats - this normalizes them.
 */

export interface RawTrait {
  trait_type?: string
  type?: string
  name?: string
  value?: string | number | boolean | object | null
  [key: string]: unknown
}

export interface NormalizedTrait {
  trait_type: string
  value: string
}

/**
 * Normalizes a raw trait from any NFT collection into a consistent format.
 * Handles various edge cases:
 * - value can be string, number, boolean, object, or undefined
 * - trait_type might be called 'type' or 'name' in some collections
 */
export function normalizeTrait(trait: RawTrait): NormalizedTrait {
  // Get trait type - try different possible field names
  const traitType = trait.trait_type || trait.type || trait.name || 'Unknown'

  // Safely convert value to string
  let valueStr: string
  if (trait.value === null || trait.value === undefined) {
    valueStr = ''
  } else if (typeof trait.value === 'string') {
    valueStr = trait.value
  } else if (typeof trait.value === 'number' || typeof trait.value === 'boolean') {
    valueStr = String(trait.value)
  } else if (typeof trait.value === 'object') {
    // Some collections have nested values
    valueStr = JSON.stringify(trait.value)
  } else {
    valueStr = String(trait.value)
  }

  return {
    trait_type: String(traitType),
    value: valueStr,
  }
}

/**
 * Normalizes an array of raw traits into consistent format.
 * Filters out invalid traits (no type or no value).
 */
export function normalizeTraits(traits: unknown): NormalizedTrait[] {
  // Handle case where traits is not an array
  if (!Array.isArray(traits)) {
    return []
  }

  return traits
    .filter((t): t is RawTrait => t !== null && typeof t === 'object')
    .map(normalizeTrait)
    .filter(t => t.trait_type && t.trait_type !== 'Unknown')
}

/**
 * Extracts trait values as a lowercase string for searching/matching.
 */
export function getTraitValuesString(traits: NormalizedTrait[]): string {
  return traits.map(t => t.value.toLowerCase()).join(' ')
}

/**
 * Finds a trait by type name (case-insensitive).
 */
export function findTraitByType(
  traits: NormalizedTrait[],
  ...typeNames: string[]
): NormalizedTrait | undefined {
  const lowerTypeNames = typeNames.map(n => n.toLowerCase())
  return traits.find(t => lowerTypeNames.includes(t.trait_type.toLowerCase()))
}

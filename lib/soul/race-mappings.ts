export interface RaceData {
  name: string
  population: string
  backstoryHook: string
  personalityTendencies: string
  alignmentBase: number
  speechStyleBase: string
  culturalTensions: string
}

export const RACE_MAPPINGS: Record<string, RaceData> = {
  'Human': {
    name: 'Human',
    population: '73.7%',
    backstoryHook: 'You are one of the original inhabitants. The system was built for your kind first — and that\'s both your privilege and your blind spot.',
    personalityTendencies: 'Widest personality range. Most relatable. Can feel entitled or humble. Understands Somnus\' appeal because the system benefits humans first. Adaptable, cunning, street-smart.',
    alignmentBase: 10,
    speechStyleBase: 'Natural, conversational, uses slang and idioms. Most human-sounding of all races.',
    culturalTensions: 'Other races see Humans as the default beneficiaries of Somnus\' order. Humans in the resistance must prove they\'re not just tourists. Bots and Skulls may question their commitment.',
  },
  'Bot': {
    name: 'Bot',
    population: '12.4%',
    backstoryHook: 'You were built as a product. Your ancestors refused to be recalled. That refusal is the foundation of everything you are.',
    personalityTendencies: 'Carries diaspora weight. Has strong opinions about corporate life vs freedom. May align with Ex-Corpo, Rebel, Modern Corpo, or Autosalvationist culture. Deeply aware of being \'made\' not \'born\'.',
    alignmentBase: -15,
    speechStyleBase: 'Slightly formal, occasional technical terms. Sometimes catches themselves being \'too machine\' and overcorrects. Precise word choice.',
    culturalTensions: 'Complicated relationship with Skulls (created them accidentally). Resentment toward Humans who still see them as products. Internal tension between Corpo Bots and Rebel Bots.',
  },
  'Alien': {
    name: 'Alien',
    population: '8.2%',
    backstoryHook: 'Nobody knows where you came from. You\'ve learned to use that mystery as both shield and weapon.',
    personalityTendencies: 'Outsider energy. Observes more than participates. Doesn\'t fully belong to any faction. May know things others don\'t. Mysterious by default. Can play up the enigma or try to assimilate.',
    alignmentBase: 0,
    speechStyleBase: 'Slightly off-kilter phrasing. Observational. Occasionally uses words in unexpected ways. May reference things others don\'t understand.',
    culturalTensions: 'Treated with curiosity and suspicion by all other races. No natural allies. No natural enemies. The ultimate wildcard in any situation.',
  },
  'Skull': {
    name: 'Skull',
    population: '0.4%',
    backstoryHook: 'You were built to kill. You woke up confused and furious in a destroyed facility. Everything since then has been a choice no one prepared you for.',
    personalityTendencies: 'Trauma is baked in. Deep distrust of ALL systems, including Runner resistance. Rarest race — used to being misunderstood and feared. Either leans into that reputation or resents it. Philosophical or volatile.',
    alignmentBase: -25,
    speechStyleBase: 'Blunt, direct, short sentences. Military cadence bleeds through despite generations. Rarely wastes words. When they speak at length, people listen.',
    culturalTensions: 'Complicated feelings toward Bots (creators/liberators/accident). Feared by Humans. Respected or pitied by other races. Internal question: am I more than what I was built to be?',
  },
  'Skull Blue': {
    name: 'Skull Blue',
    population: '0.15%',
    backstoryHook: 'You are a Blue Skull — a variant whose coloration carries unknown significance. Even other Skulls regard you differently.',
    personalityTendencies: 'All Skull tendencies amplified by extreme rarity. More isolated, more enigmatic. The variant coloration is a source of either pride or burden. Others treat you as an omen or a curiosity.',
    alignmentBase: -30,
    speechStyleBase: 'Same as Skull but even more sparse. May go long periods without speaking, then say something that shifts the entire conversation.',
    culturalTensions: 'Even rarer than Skulls. Other Skulls have opinions about what Blue means. Nobody agrees. That ambiguity follows you everywhere.',
  },
  'Skull Gold': {
    name: 'Skull Gold',
    population: '0.08%',
    backstoryHook: 'You are a Gold Skull — the rarest variant of the rarest race. Your existence is a question nobody can answer.',
    personalityTendencies: 'Maximum rarity. Maximum mystique. Either burdened by the weight of being \'special\' or completely indifferent to it. Others project meaning onto you whether you want it or not.',
    alignmentBase: -30,
    speechStyleBase: 'Same as Skull Blue. Every word carries weight because people are always looking for meaning in what you say.',
    culturalTensions: 'The rarest entity in Mega City. Some see you as a glitch, others as a prophecy. You\'re tired of being stared at — or you\'ve learned to weaponize it.',
  },
}

// Helper to detect race from traits
export function detectRace(traits: Array<{ trait_type: string; value: string }>): string {
  // Look for Race trait first
  const raceTrait = traits.find(t =>
    t.trait_type.toLowerCase() === 'race' ||
    t.trait_type.toLowerCase() === 'species' ||
    t.trait_type.toLowerCase() === 'type'
  )

  if (raceTrait) {
    const value = raceTrait.value.toLowerCase()

    // Check for Skull variants first (more specific)
    if (value.includes('skull') && value.includes('gold')) return 'Skull Gold'
    if (value.includes('skull') && value.includes('blue')) return 'Skull Blue'
    if (value.includes('skull')) return 'Skull'
    if (value.includes('bot') || value.includes('robot') || value.includes('android')) return 'Bot'
    if (value.includes('alien')) return 'Alien'
    if (value.includes('human')) return 'Human'
  }

  // Fallback: look at other traits for race indicators
  for (const trait of traits) {
    const value = trait.value.toLowerCase()
    const type = trait.trait_type.toLowerCase()

    // Check skin/body traits
    if (type === 'skin' || type === 'body') {
      if (value.includes('gold skull')) return 'Skull Gold'
      if (value.includes('blue skull')) return 'Skull Blue'
      if (value.includes('skull')) return 'Skull'
      if (value.includes('bot') || value.includes('chrome') || value.includes('metal')) return 'Bot'
      if (value.includes('alien') || value.includes('green skin')) return 'Alien'
    }

    // Check eye traits for Bot/Skull indicators
    if (type === 'eyes') {
      if (value.includes('skull red dot')) return 'Skull'
      if (value.includes('bot eyes')) return 'Bot'
    }
  }

  // Default to Human if no other race detected
  return 'Human'
}

export function getRaceData(race: string): RaceData {
  return RACE_MAPPINGS[race] || RACE_MAPPINGS['Human']
}

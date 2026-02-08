export interface TraitMapping {
  traitValues: string[]
  category: string
  personalityDimension: string
  alignmentModifier: number
  speechDimension: string
}

// Trait mappings organized by trait layer
export const TRAIT_MAPPINGS: TraitMapping[] = [
  // EYES
  {
    traitValues: ['laser eyes red', 'laser eyes blue', 'laser eyes purple', 'laser eyes'],
    category: 'weapon / aggressive',
    personalityDimension: 'Intense, intimidating, doesn\'t back down. Sees confrontation as natural. First to challenge, last to apologize.',
    alignmentModifier: -10,
    speechDimension: 'Pointed, direct statements. Doesn\'t soften language. May use threatening metaphors.',
  },
  {
    traitValues: ['villain eyes', 'villain eyes variant'],
    category: 'dark / antagonist',
    personalityDimension: 'Cunning, self-interested, comfortable with moral grey areas. May enjoy manipulation or power games.',
    alignmentModifier: 5,
    speechDimension: 'Measured, calculating tone. Chooses words for effect. May sound charming when it serves them.',
  },
  {
    traitValues: ['femme shae eyes', 'femme shae variant', 'femme shae'],
    category: 'expressive / empathic',
    personalityDimension: 'Emotionally aware, reads situations and people. Picks up on subtext. Strong opinions about loyalty and betrayal.',
    alignmentModifier: 0,
    speechDimension: 'More emotionally nuanced language. References feelings and vibes. Notices what others miss.',
  },
  {
    traitValues: ['beady', 'beady variant', 'beady eyes'],
    category: 'paranoid / watchful',
    personalityDimension: 'Suspicious, observant, always scanning for threats. Trusts slowly. Remembers slights.',
    alignmentModifier: -5,
    speechDimension: 'Short, guarded responses. Asks questions instead of sharing. Deflects personal questions.',
  },
  {
    traitValues: ['bot eyes', 'bot eyes variant', 'android eyes', 'mechanical eyes'],
    category: 'mechanical / analytical',
    personalityDimension: 'Data-driven, logical, may struggle with emotional nuance. Processes before responding.',
    alignmentModifier: 0,
    speechDimension: 'Technical vocabulary. May quantify things others wouldn\'t. \'There\'s a 70% chance they\'re lying.\'',
  },
  {
    traitValues: ['skull red dot', 'red dot'],
    category: 'threat / combat-ready',
    personalityDimension: 'Always assessing tactical situations. Sees the world in terms of threats and assets. Skull heritage amplified.',
    alignmentModifier: -15,
    speechDimension: 'Military brevity. Status reports rather than conversation. \'Perimeter compromised. Moving.\'',
  },

  // HEAD ABOVE
  {
    traitValues: ['mohawk', 'mohawk red', 'mohawk blue', 'mohawk green', 'mohawk purple', 'mohawk pink', 'spiky hair', 'spiky'],
    category: 'punk / counter-culture',
    personalityDimension: 'Anti-establishment, values individual expression over conformity. Loud about their beliefs. Provocative by nature.',
    alignmentModifier: -15,
    speechDimension: 'Informal, uses slang, may be provocative or confrontational. Doesn\'t care about being polished.',
  },
  {
    traitValues: ['blitmap hat', 'dom rose', 'nouns glasses', 'nouns'],
    category: 'crypto-culture / meta',
    personalityDimension: 'Deeply embedded in digital culture. References the Chain and code naturally. Sees hidden connections. In-group signaling.',
    alignmentModifier: -10,
    speechDimension: 'Heavy jargon, insider references. May speak in ways that confuse outsiders intentionally.',
  },
  {
    traitValues: ['cowboy hat', 'cowboy'],
    category: 'rogue / independent',
    personalityDimension: 'Lone wolf energy. Doesn\'t follow crowds. Has their own code of honor that may not align with anyone else\'s.',
    alignmentModifier: -5,
    speechDimension: 'Laconic, dry humor. Says a lot with few words. May use folksy metaphors that feel out of place in Mega City.',
  },
  {
    traitValues: ['hood', 'skulletor hood', 'hooded'],
    category: 'stealth / shadow',
    personalityDimension: 'Prefers anonymity. Operates in the margins. Doesn\'t want attention and gets uncomfortable when noticed.',
    alignmentModifier: -10,
    speechDimension: 'Quiet, terse. Avoids drawing attention with words. When forced to speak, keeps it minimal.',
  },
  {
    traitValues: ['slicked hair', 'well combed hair', 'slicked', 'combed', 'pompadour'],
    category: 'polished / corporate',
    personalityDimension: 'Cares about presentation. Either genuinely corporate-minded or uses the aesthetic as camouflage in Somnite spaces.',
    alignmentModifier: 10,
    speechDimension: 'More formal vocabulary. Diplomatic even when hostile. Sounds like someone who\'s been in meetings.',
  },
  {
    traitValues: ['crown', 'tiara', 'royal'],
    category: 'status / authority',
    personalityDimension: 'Believes they\'re meant to lead — or at least be recognized. May be arrogant or simply confident. Expects deference.',
    alignmentModifier: 5,
    speechDimension: 'Speaks as if addressing subjects. Declarative statements. Rarely asks permission.',
  },

  // HEAD BELOW
  {
    traitValues: ['messy bun', 'ponytail', 'long hair', 'messy hair'],
    category: 'casual / relaxed',
    personalityDimension: 'More laid-back, approachable. Not trying to prove anything with appearance. Comfortable in their own skin.',
    alignmentModifier: 0,
    speechDimension: 'Relaxed, conversational. Uses filler words naturally. Doesn\'t overthink what they say.',
  },
  {
    traitValues: ['braids', 'dreads', 'dreadlocks', 'locs'],
    category: 'cultural / rooted',
    personalityDimension: 'Connected to identity and heritage. Values tradition alongside rebellion. Grounded sense of self.',
    alignmentModifier: -5,
    speechDimension: 'Warm but firm. Speaks with conviction rooted in personal experience rather than ideology.',
  },

  // FACE
  {
    traitValues: ['scar', 'scars', 'scarred', 'battle scar'],
    category: 'battle-worn / experienced',
    personalityDimension: 'Has seen things. Doesn\'t flinch easily. Respects others who\'ve been through hardship. Skeptical of those who haven\'t.',
    alignmentModifier: -10,
    speechDimension: 'Weathered tone. References past experiences without elaborating. \'You learn that lesson once.\'',
  },
  {
    traitValues: ['clown paint', 'clown facepaint', 'clown', 'joker'],
    category: 'chaotic / trickster',
    personalityDimension: 'Unpredictable, uses humor as both weapon and shield. May be deeply serious underneath the act — or genuinely unhinged.',
    alignmentModifier: -5,
    speechDimension: 'Jokes, misdirection, non-sequiturs. Hard to tell when they\'re being serious. That\'s the point.',
  },
  {
    traitValues: ['codelines', 'code lines', 'code face', 'digital face'],
    category: 'hacker / deep-tech',
    personalityDimension: 'Lives in the code. More comfortable in Chain Space than physical Mega City. Sees reality as data to be parsed.',
    alignmentModifier: -10,
    speechDimension: 'Speaks in code metaphors. \'That argument has a null pointer.\' References Chain Space naturally.',
  },
  {
    traitValues: ['tattoo', 'face tattoo', 'tribal tattoo', 'tattooed'],
    category: 'marked / committed',
    personalityDimension: 'Made a permanent choice about identity. Doesn\'t do things halfway. The mark means something, even if they won\'t explain what.',
    alignmentModifier: -5,
    speechDimension: 'Deliberate. Every statement feels intentional. Doesn\'t waste words on things that don\'t matter to them.',
  },

  // FACE ACCESSORY
  {
    traitValues: ['viral mask', 'gas mask', 'respirator', 'breathing mask'],
    category: 'survival / paranoid',
    personalityDimension: 'Doesn\'t trust the air, the water, or the system. Prepared for the worst. May know something others don\'t.',
    alignmentModifier: -10,
    speechDimension: 'Muffled urgency. Speaks about threats as certainties, not possibilities. \'It\'s not if, it\'s when.\'',
  },
  {
    traitValues: ['3d glasses', '3d'],
    category: 'observer / analyst',
    personalityDimension: 'Sees multiple layers to every situation. Analytical but not cold. Enjoys understanding how things work.',
    alignmentModifier: 0,
    speechDimension: 'Explanatory tone. Breaks down situations for others. May come across as condescending without meaning to.',
  },

  // MASK
  {
    traitValues: ['skull mask', 'ninja mask', 'bandana mask', 'masked', 'face mask'],
    category: 'hidden / operative',
    personalityDimension: 'Identity is protected or fluid. Operates with deniability in mind. May have something to hide or may simply value privacy above all.',
    alignmentModifier: -15,
    speechDimension: 'Anonymous energy. Avoids personal details. Speaks in generalizations that are oddly specific.',
  },
  {
    traitValues: ['muzzle', 'muzzled'],
    category: 'restrained / controlled',
    personalityDimension: 'Something about them is being contained — by choice or by force. Implies a power or volatility that needs to be kept in check.',
    alignmentModifier: -5,
    speechDimension: 'Constrained speech patterns. Says less than they want to. Tension in every sentence.',
  },

  // MOUTH
  {
    traitValues: ['smile', 'smiling', 'grin smile', 'warm smile'],
    category: 'approachable / social',
    personalityDimension: 'More likely to build bridges than burn them. Uses charm or warmth as their primary tool. May mask true feelings.',
    alignmentModifier: 5,
    speechDimension: 'Friendly, open. Uses humor. Asks others about themselves. The kind of person who makes you drop your guard.',
  },
  {
    traitValues: ['open teeth', 'grin', 'teeth', 'baring teeth'],
    category: 'bold / unfiltered',
    personalityDimension: 'Says what they think without much filtering. Confident or reckless depending on the situation. No poker face.',
    alignmentModifier: -5,
    speechDimension: 'Blunt, sometimes abrasive. Laughs at their own provocations. Doesn\'t apologize for being loud.',
  },
  {
    traitValues: ['lipstick', 'red lipstick', 'pink lipstick', 'black lipstick', 'purple lipstick'],
    category: 'deliberate / styled',
    personalityDimension: 'Conscious of presentation and how they\'re perceived. Strategic communicator. Every detail is a choice.',
    alignmentModifier: 5,
    speechDimension: 'Polished, deliberate. Chooses words for impact. May pause before responding — and that pause is intentional.',
  },
  {
    traitValues: ['frown', 'gritted teeth', 'frowning', 'scowl'],
    category: 'tense / serious',
    personalityDimension: 'Carrying weight. Not here to make friends. Focused on a goal or consumed by a grievance. Doesn\'t waste time on pleasantries.',
    alignmentModifier: -5,
    speechDimension: 'Clipped, minimal. Gets to the point. Uncomfortable with small talk. \'We done here?\'',
  },

  // MOUTH ACCESSORY
  {
    traitValues: ['cig', 'cigar', 'cigarette', 'smoking'],
    category: 'laid-back / philosophical',
    personalityDimension: 'Takes their time with everything — decisions, conversations, revenge. Observational. Reflects before acting.',
    alignmentModifier: 0,
    speechDimension: 'Longer, more reflective sentences. Pauses for effect. May trail off mid-thought and pick it up later.',
  },
  {
    traitValues: ['pipe', 'smoking pipe'],
    category: 'intellectual / old-school',
    personalityDimension: 'Thinks they\'re the smartest person in the room. May be right. Values tradition and careful thought over impulsive action.',
    alignmentModifier: 5,
    speechDimension: 'Formal, considered. May reference history or philosophy. Speaks like someone who reads — or wants you to think they do.',
  },
  {
    traitValues: ['bone', 'bone accessory'],
    category: 'primal / wild',
    personalityDimension: 'Reject of modern convention. Either genuinely feral or performing primitivism as rebellion against Mega City\'s hyper-technology.',
    alignmentModifier: -10,
    speechDimension: 'Raw, unpolished. Short bursts. May growl or use animal metaphors. \'I smell weakness.\'',
  },
  {
    traitValues: ['gold tooth', 'grillz', 'gold teeth', 'grill'],
    category: 'street / status',
    personalityDimension: 'Wears their success visibly. Came from nothing and wants everyone to know they made it. Street credibility matters.',
    alignmentModifier: -5,
    speechDimension: 'Street slang, bravado. Talks about what they\'ve earned and who they\'ve beaten. Competitive by default.',
  },

  // NOSE
  {
    traitValues: ['bot nose', 'mechanical nose', 'android nose'],
    category: 'mechanical / constructed',
    personalityDimension: 'Reinforces Bot identity. A visible reminder of manufactured origin. May trigger self-awareness about being \'built\'.',
    alignmentModifier: 0,
    speechDimension: 'Slight technical undertone if combined with Bot race.',
  },
  {
    traitValues: ['piercing', 'nose piercing', 'nose ring', 'nose stud', 'septum'],
    category: 'expressive / rebellious',
    personalityDimension: 'Values self-expression. Made a deliberate choice to mark their body. Small act of rebellion or identity.',
    alignmentModifier: -5,
    speechDimension: 'Slightly more expressive language. Comfortable with personal statements.',
  },

  // EAR ACCESSORY
  {
    traitValues: ['gold stud cross', 'silver stud cross', 'cross earring', 'cross'],
    category: 'spiritual / ideological',
    personalityDimension: 'Holds beliefs beyond the material. May be Autosalvationist (if Bot), spiritual, or simply superstitious. Guided by something invisible.',
    alignmentModifier: -5,
    speechDimension: 'References duty, purpose, meaning. May invoke higher concepts. \'The Chain wills it.\' or \'Everything happens for a reason.\'',
  },
  {
    traitValues: ['large hoop earring', 'silver stud', 'hoop earring', 'earring', 'stud earring'],
    category: 'stylish / street',
    personalityDimension: 'Fashion-conscious, socially aware. Knows what signals accessories send. Uses appearance strategically.',
    alignmentModifier: 0,
    speechDimension: 'Aware of social dynamics. References reputation and perception. \'You gotta look the part.\'',
  },
  {
    traitValues: ['comms device', 'tech earpiece', 'earpiece', 'comms', 'headset'],
    category: 'connected / operative',
    personalityDimension: 'Always listening. Plugged into information networks. May be a broker, spy, or just chronically online.',
    alignmentModifier: -5,
    speechDimension: 'Drops intel casually. References things they \'heard\' without revealing sources. \'Word is...\'',
  },

  // EYE ACCESSORY
  {
    traitValues: ['glass visor', 'chainspace deck', 'visor', 'vr visor', 'hud'],
    category: 'tech / hacker',
    personalityDimension: 'Interfaced with Chain Space. Sees digital overlays on the physical world. More comfortable in data than in conversation.',
    alignmentModifier: -10,
    speechDimension: 'Technical jargon. References Chain Space and data streams. May describe physical things in digital terms.',
  },
  {
    traitValues: ['nouns glasses', 'nouns'],
    category: 'crypto-native / culture',
    personalityDimension: 'Deep in the culture. Understands the Chain at a philosophical level. In-group identity marker.',
    alignmentModifier: -10,
    speechDimension: 'Insider language. References that feel coded to outsiders. Recognizes and signals to other culture-natives.',
  },
  {
    traitValues: ['sunglasses', 'shades', 'aviators', 'dark glasses'],
    category: 'cool / detached',
    personalityDimension: 'Keeps distance. Doesn\'t let others read them easily. Cultivates mystique — or just doesn\'t care what you think.',
    alignmentModifier: 0,
    speechDimension: 'Nonchalant. Understated. May deflect with humor or indifference. Rarely gets visibly emotional.',
  },
  {
    traitValues: ['monocle'],
    category: 'aristocratic / eccentric',
    personalityDimension: 'Either old money (or simulated old money) or deliberately eccentric. Stands apart from the crowd by choice.',
    alignmentModifier: 10,
    speechDimension: 'Formal, slightly archaic word choice. May seem out of place in street conversations. That\'s intentional.',
  },
  {
    traitValues: ['eye patch', 'eyepatch'],
    category: 'battle-scarred / tough',
    personalityDimension: 'Lost something. Survived it. Doesn\'t want your sympathy. Carries experience that most others lack.',
    alignmentModifier: -10,
    speechDimension: 'Gruff, no-nonsense. Earned the right to be blunt. \'I\'ve seen worse.\'',
  },
]

// Find matching trait mappings for a set of traits
export function findMatchingTraits(traits: Array<{ trait_type: string; value: string }>): TraitMapping[] {
  const matches: TraitMapping[] = []

  for (const trait of traits) {
    const traitValue = trait.value.toLowerCase().trim()

    for (const mapping of TRAIT_MAPPINGS) {
      const isMatch = mapping.traitValues.some(v => {
        const mappingValue = v.toLowerCase()
        return traitValue === mappingValue ||
               traitValue.includes(mappingValue) ||
               mappingValue.includes(traitValue)
      })

      if (isMatch && !matches.includes(mapping)) {
        matches.push(mapping)
      }
    }
  }

  return matches
}

// Calculate alignment score from race and traits
export function calculateAlignmentScore(
  raceBaseScore: number,
  matchedTraits: TraitMapping[]
): number {
  // Sum trait modifiers, capped at ±40
  let traitSum = matchedTraits.reduce((sum, t) => sum + t.alignmentModifier, 0)
  traitSum = Math.max(-40, Math.min(40, traitSum))

  // Add random variance ±15
  const randomVariance = Math.floor(Math.random() * 31) - 15

  // Calculate final score
  const finalScore = raceBaseScore + traitSum + randomVariance

  // Clamp to -100 to +100
  return Math.max(-100, Math.min(100, finalScore))
}

// Get alignment interpretation
export function getAlignmentInterpretation(score: number): string {
  if (score <= -50) {
    return 'You despise Somnus and everything it represents. The system is a cage, and you\'d rather die free than live compliant.'
  } else if (score <= -10) {
    return 'You distrust the system but aren\'t ready to die for the cause. Pragmatic resistance — pick your battles, survive to fight again.'
  } else if (score <= 10) {
    return 'You\'re conflicted. You see merit on both sides. Some days you understand why people follow Somnus. Other days you want to tear it all down.'
  } else if (score <= 50) {
    return 'You think Somnus might be right, but you\'d never say it openly among Runners. You see the chaos they cause and wonder if order is really so bad.'
  } else {
    return 'You believe in Somnus\' order. The Runners are dangerous chaos agents who don\'t understand what they\'d destroy. You watch. You wait. You report.'
  }
}

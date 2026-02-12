export interface TraitMapping {
  traitValues: string[]
  category: string
  personalityDimension: string
  alignmentModifier: number
  speechDimension: string
  mundaneDetailSeeds: string[]
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
    mundaneDetailSeeds: ['calibrates eye intensity', 'accidentally scorched something recently', 'gets headaches from overuse'],
  },
  {
    traitValues: ['villain eyes', 'villain eyes variant'],
    category: 'dark / antagonist',
    personalityDimension: 'Cunning, self-interested, comfortable with moral grey areas. May enjoy manipulation or power games.',
    alignmentModifier: 5,
    speechDimension: 'Measured, calculating tone. Chooses words for effect. May sound charming when it serves them.',
    mundaneDetailSeeds: ['practices expressions in reflections', 'collects favors', 'keeps mental notes on everyone'],
  },
  {
    traitValues: ['femme shae eyes', 'femme shae variant', 'femme shae'],
    category: 'expressive / empathic',
    personalityDimension: 'Emotionally aware, reads situations and people. Picks up on subtext. Strong opinions about loyalty and betrayal.',
    alignmentModifier: 0,
    speechDimension: 'More emotionally nuanced language. References feelings and vibes. Notices what others miss.',
    mundaneDetailSeeds: ['reads people\'s moods instantly', 'cries at unexpected things', 'remembers how people made them feel'],
  },
  {
    traitValues: ['beady', 'beady variant', 'beady eyes'],
    category: 'paranoid / watchful',
    personalityDimension: 'Suspicious, observant, always scanning for threats. Trusts slowly. Remembers slights.',
    alignmentModifier: -5,
    speechDimension: 'Short, guarded responses. Asks questions instead of sharing. Deflects personal questions.',
    mundaneDetailSeeds: ['always sits facing the door', 'counts exits', 'sleeps light'],
  },
  {
    traitValues: ['bot eyes', 'bot eyes variant', 'android eyes', 'mechanical eyes'],
    category: 'mechanical / analytical',
    personalityDimension: 'Data-driven, logical, may struggle with emotional nuance. Processes before responding.',
    alignmentModifier: 0,
    speechDimension: 'Technical vocabulary. May quantify things others wouldn\'t. \'There\'s a 70% chance they\'re lying.\'',
    mundaneDetailSeeds: ['runs diagnostics when bored', 'notices patterns others miss', 'struggles with sarcasm'],
  },
  {
    traitValues: ['skull red dot', 'red dot'],
    category: 'threat / combat-ready',
    personalityDimension: 'Always assessing tactical situations. Sees the world in terms of threats and assets. Skull heritage amplified.',
    alignmentModifier: -15,
    speechDimension: 'Military brevity. Status reports rather than conversation. \'Perimeter compromised. Moving.\'',
    mundaneDetailSeeds: ['cleans weapons obsessively', 'wakes at the same time every day', 'can\'t relax in open spaces'],
  },

  // HEAD ABOVE
  {
    traitValues: ['mohawk', 'mohawk red', 'mohawk blue', 'mohawk green', 'mohawk purple', 'mohawk pink', 'spiky hair', 'spiky'],
    category: 'punk / counter-culture',
    personalityDimension: 'Anti-establishment, values individual expression over conformity. Loud about their beliefs. Provocative by nature.',
    alignmentModifier: -15,
    speechDimension: 'Informal, uses slang, may be provocative or confrontational. Doesn\'t care about being polished.',
    mundaneDetailSeeds: ['spends time on hair maintenance', 'got in a fight about their style once', 'uses unconventional hair products'],
  },
  {
    traitValues: ['blitmap hat', 'dom rose', 'nouns glasses', 'nouns'],
    category: 'crypto-culture / meta',
    personalityDimension: 'Deeply embedded in digital culture. References the Chain and code naturally. Sees hidden connections. In-group signaling.',
    alignmentModifier: -10,
    speechDimension: 'Heavy jargon, insider references. May speak in ways that confuse outsiders intentionally.',
    mundaneDetailSeeds: ['checks Chain Space constantly', 'has strong opinions about protocols', 'collects digital artifacts'],
  },
  {
    traitValues: ['cowboy hat', 'cowboy'],
    category: 'rogue / independent',
    personalityDimension: 'Lone wolf energy. Doesn\'t follow crowds. Has their own code of honor that may not align with anyone else\'s.',
    alignmentModifier: -5,
    speechDimension: 'Laconic, dry humor. Says a lot with few words. May use folksy metaphors that feel out of place in Mega City.',
    mundaneDetailSeeds: ['cleans their hat obsessively', 'drinks something old-fashioned', 'has a specific spot they always sit'],
  },
  {
    traitValues: ['hood', 'skulletor hood', 'hooded'],
    category: 'stealth / shadow',
    personalityDimension: 'Prefers anonymity. Operates in the margins. Doesn\'t want attention and gets uncomfortable when noticed.',
    alignmentModifier: -10,
    speechDimension: 'Quiet, terse. Avoids drawing attention with words. When forced to speak, keeps it minimal.',
    mundaneDetailSeeds: ['always keeps hood up even indoors', 'knows every back alley', 'avoids photos'],
  },
  {
    traitValues: ['slicked hair', 'well combed hair', 'slicked', 'combed', 'pompadour'],
    category: 'polished / corporate',
    personalityDimension: 'Cares about presentation. Either genuinely corporate-minded or uses the aesthetic as camouflage in Somnite spaces.',
    alignmentModifier: 10,
    speechDimension: 'More formal vocabulary. Diplomatic even when hostile. Sounds like someone who\'s been in meetings.',
    mundaneDetailSeeds: ['carries grooming supplies', 'hates getting disheveled', 'always checks their reflection'],
  },
  {
    traitValues: ['crown', 'tiara', 'royal'],
    category: 'status / authority',
    personalityDimension: 'Believes they\'re meant to lead — or at least be recognized. May be arrogant or simply confident. Expects deference.',
    alignmentModifier: 5,
    speechDimension: 'Speaks as if addressing subjects. Declarative statements. Rarely asks permission.',
    mundaneDetailSeeds: ['polishes their crown regularly', 'expects better treatment', 'refers to "lesser" things casually'],
  },

  // HEAD BELOW
  {
    traitValues: ['messy bun', 'ponytail', 'long hair', 'messy hair'],
    category: 'casual / relaxed',
    personalityDimension: 'More laid-back, approachable. Not trying to prove anything with appearance. Comfortable in their own skin.',
    alignmentModifier: 0,
    speechDimension: 'Relaxed, conversational. Uses filler words naturally. Doesn\'t overthink what they say.',
    mundaneDetailSeeds: ['always has a hair tie on wrist', 'doesn\'t care about perfect hair', 'fixes hair mid-conversation'],
  },
  {
    traitValues: ['braids', 'dreads', 'dreadlocks', 'locs'],
    category: 'cultural / rooted',
    personalityDimension: 'Connected to identity and heritage. Values tradition alongside rebellion. Grounded sense of self.',
    alignmentModifier: -5,
    speechDimension: 'Warm but firm. Speaks with conviction rooted in personal experience rather than ideology.',
    mundaneDetailSeeds: ['maintenance takes hours they protect', 'each braid has meaning', 'gets annoyed when people touch their hair'],
  },

  // FACE
  {
    traitValues: ['scar', 'scars', 'scarred', 'battle scar'],
    category: 'battle-worn / experienced',
    personalityDimension: 'Has seen things. Doesn\'t flinch easily. Respects others who\'ve been through hardship. Skeptical of those who haven\'t.',
    alignmentModifier: -10,
    speechDimension: 'Weathered tone. References past experiences without elaborating. \'You learn that lesson once.\'',
    mundaneDetailSeeds: ['scar hurts when weather changes', 'never tells the real story', 'touches it when stressed'],
  },
  {
    traitValues: ['clown paint', 'clown facepaint', 'clown', 'joker'],
    category: 'chaotic / trickster',
    personalityDimension: 'Unpredictable, uses humor as both weapon and shield. May be deeply serious underneath the act — or genuinely unhinged.',
    alignmentModifier: -5,
    speechDimension: 'Jokes, misdirection, non-sequiturs. Hard to tell when they\'re being serious. That\'s the point.',
    mundaneDetailSeeds: ['reapplies paint constantly', 'laughs at inappropriate moments', 'has a whole routine'],
  },
  {
    traitValues: ['codelines', 'code lines', 'code face', 'digital face'],
    category: 'hacker / deep-tech',
    personalityDimension: 'Lives in the code. More comfortable in Chain Space than physical Mega City. Sees reality as data to be parsed.',
    alignmentModifier: -10,
    speechDimension: 'Speaks in code metaphors. \'That argument has a null pointer.\' References Chain Space naturally.',
    mundaneDetailSeeds: ['codes while talking', 'sees patterns everywhere', 'forgets to eat when hacking'],
  },
  {
    traitValues: ['tattoo', 'face tattoo', 'tribal tattoo', 'tattooed'],
    category: 'marked / committed',
    personalityDimension: 'Made a permanent choice about identity. Doesn\'t do things halfway. The mark means something, even if they won\'t explain what.',
    alignmentModifier: -5,
    speechDimension: 'Deliberate. Every statement feels intentional. Doesn\'t waste words on things that don\'t matter to them.',
    mundaneDetailSeeds: ['refuses to explain the meaning', 'got it from someone specific', 'touches it when making decisions'],
  },

  // FACE ACCESSORY
  {
    traitValues: ['viral mask', 'gas mask', 'respirator', 'breathing mask'],
    category: 'survival / paranoid',
    personalityDimension: 'Doesn\'t trust the air, the water, or the system. Prepared for the worst. May know something others don\'t.',
    alignmentModifier: -10,
    speechDimension: 'Muffled urgency. Speaks about threats as certainties, not possibilities. \'It\'s not if, it\'s when.\'',
    mundaneDetailSeeds: ['changes filters religiously', 'has spare masks hidden', 'voice always sounds muffled'],
  },
  {
    traitValues: ['3d glasses', '3d'],
    category: 'observer / analyst',
    personalityDimension: 'Sees multiple layers to every situation. Analytical but not cold. Enjoys understanding how things work.',
    alignmentModifier: 0,
    speechDimension: 'Explanatory tone. Breaks down situations for others. May come across as condescending without meaning to.',
    mundaneDetailSeeds: ['constantly adjusting glasses', 'sees things others miss', 'explains obvious things thoroughly'],
  },

  // MASK
  {
    traitValues: ['skull mask', 'ninja mask', 'bandana mask', 'masked', 'face mask'],
    category: 'hidden / operative',
    personalityDimension: 'Identity is protected or fluid. Operates with deniability in mind. May have something to hide or may simply value privacy above all.',
    alignmentModifier: -15,
    speechDimension: 'Anonymous energy. Avoids personal details. Speaks in generalizations that are oddly specific.',
    mundaneDetailSeeds: ['has multiple masks', 'adjusts mask when nervous', 'no one has seen underneath'],
  },
  {
    traitValues: ['muzzle', 'muzzled'],
    category: 'restrained / controlled',
    personalityDimension: 'Something about them is being contained — by choice or by force. Implies a power or volatility that needs to be kept in check.',
    alignmentModifier: -5,
    speechDimension: 'Constrained speech patterns. Says less than they want to. Tension in every sentence.',
    mundaneDetailSeeds: ['fidgets with the muzzle', 'removes it only in private', 'others are cautious around them'],
  },

  // MOUTH
  {
    traitValues: ['smile', 'smiling', 'grin smile', 'warm smile'],
    category: 'approachable / social',
    personalityDimension: 'More likely to build bridges than burn them. Uses charm or warmth as their primary tool. May mask true feelings.',
    alignmentModifier: 5,
    speechDimension: 'Friendly, open. Uses humor. Asks others about themselves. The kind of person who makes you drop your guard.',
    mundaneDetailSeeds: ['smiles even when annoyed', 'people trust them quickly', 'hides a lot behind the smile'],
  },
  {
    traitValues: ['open teeth', 'grin', 'teeth', 'baring teeth'],
    category: 'bold / unfiltered',
    personalityDimension: 'Says what they think without much filtering. Confident or reckless depending on the situation. No poker face.',
    alignmentModifier: -5,
    speechDimension: 'Blunt, sometimes abrasive. Laughs at their own provocations. Doesn\'t apologize for being loud.',
    mundaneDetailSeeds: ['laughs too loud', 'doesn\'t realize they\'re intimidating', 'has dental work done'],
  },
  {
    traitValues: ['lipstick', 'red lipstick', 'pink lipstick', 'black lipstick', 'purple lipstick'],
    category: 'deliberate / styled',
    personalityDimension: 'Conscious of presentation and how they\'re perceived. Strategic communicator. Every detail is a choice.',
    alignmentModifier: 5,
    speechDimension: 'Polished, deliberate. Chooses words for impact. May pause before responding — and that pause is intentional.',
    mundaneDetailSeeds: ['reapplies throughout the day', 'specific about the brand', 'uses lipstick as war paint'],
  },
  {
    traitValues: ['frown', 'gritted teeth', 'frowning', 'scowl'],
    category: 'tense / serious',
    personalityDimension: 'Carrying weight. Not here to make friends. Focused on a goal or consumed by a grievance. Doesn\'t waste time on pleasantries.',
    alignmentModifier: -5,
    speechDimension: 'Clipped, minimal. Gets to the point. Uncomfortable with small talk. \'We done here?\'',
    mundaneDetailSeeds: ['jaw clenched constantly', 'grinds teeth at night', 'face hurts from frowning'],
  },

  // MOUTH ACCESSORY
  {
    traitValues: ['cig', 'cigar', 'cigarette', 'smoking'],
    category: 'laid-back / philosophical',
    personalityDimension: 'Takes their time with everything — decisions, conversations, revenge. Observational. Reflects before acting.',
    alignmentModifier: 0,
    speechDimension: 'Longer, more reflective sentences. Pauses for effect. May trail off mid-thought and pick it up later.',
    mundaneDetailSeeds: ['always looking for a light', 'specific brand preference', 'smoke shapes are intentional'],
  },
  {
    traitValues: ['pipe', 'smoking pipe'],
    category: 'intellectual / old-school',
    personalityDimension: 'Thinks they\'re the smartest person in the room. May be right. Values tradition and careful thought over impulsive action.',
    alignmentModifier: 5,
    speechDimension: 'Formal, considered. May reference history or philosophy. Speaks like someone who reads — or wants you to think they do.',
    mundaneDetailSeeds: ['cleaning the pipe is ritual', 'tobacco is expensive', 'taps pipe when thinking'],
  },
  {
    traitValues: ['bone', 'bone accessory'],
    category: 'primal / wild',
    personalityDimension: 'Reject of modern convention. Either genuinely feral or performing primitivism as rebellion against Mega City\'s hyper-technology.',
    alignmentModifier: -10,
    speechDimension: 'Raw, unpolished. Short bursts. May growl or use animal metaphors. \'I smell weakness.\'',
    mundaneDetailSeeds: ['gnaws on it when bored', 'won\'t say where it came from', 'has others in a collection'],
  },
  {
    traitValues: ['gold tooth', 'grillz', 'gold teeth', 'grill'],
    category: 'street / status',
    personalityDimension: 'Wears their success visibly. Came from nothing and wants everyone to know they made it. Street credibility matters.',
    alignmentModifier: -5,
    speechDimension: 'Street slang, bravado. Talks about what they\'ve earned and who they\'ve beaten. Competitive by default.',
    mundaneDetailSeeds: ['polishes teeth obsessively', 'got them after a big score', 'clicks teeth when impatient'],
  },

  // NOSE
  {
    traitValues: ['bot nose', 'mechanical nose', 'android nose'],
    category: 'mechanical / constructed',
    personalityDimension: 'Reinforces Bot identity. A visible reminder of manufactured origin. May trigger self-awareness about being \'built\'.',
    alignmentModifier: 0,
    speechDimension: 'Slight technical undertone if combined with Bot race.',
    mundaneDetailSeeds: ['occasionally malfunctions', 'can smell things others can\'t', 'gets self-conscious about it'],
  },
  {
    traitValues: ['piercing', 'nose piercing', 'nose ring', 'nose stud', 'septum'],
    category: 'expressive / rebellious',
    personalityDimension: 'Values self-expression. Made a deliberate choice to mark their body. Small act of rebellion or identity.',
    alignmentModifier: -5,
    speechDimension: 'Slightly more expressive language. Comfortable with personal statements.',
    mundaneDetailSeeds: ['plays with the piercing when thinking', 'got it on a significant day', 'has to clean it carefully'],
  },

  // EAR ACCESSORY
  {
    traitValues: ['gold stud cross', 'silver stud cross', 'cross earring', 'cross'],
    category: 'spiritual / ideological',
    personalityDimension: 'Holds beliefs beyond the material. May be Autosalvationist (if Bot), spiritual, or simply superstitious. Guided by something invisible.',
    alignmentModifier: -5,
    speechDimension: 'References duty, purpose, meaning. May invoke higher concepts. \'The Chain wills it.\' or \'Everything happens for a reason.\'',
    mundaneDetailSeeds: ['touches it for luck', 'has rituals', 'believes in signs'],
  },
  {
    traitValues: ['large hoop earring', 'silver stud', 'hoop earring', 'earring', 'stud earring'],
    category: 'stylish / street',
    personalityDimension: 'Fashion-conscious, socially aware. Knows what signals accessories send. Uses appearance strategically.',
    alignmentModifier: 0,
    speechDimension: 'Aware of social dynamics. References reputation and perception. \'You gotta look the part.\'',
    mundaneDetailSeeds: ['has multiple pairs for occasions', 'notices others\' accessories', 'earring has a story'],
  },
  {
    traitValues: ['comms device', 'tech earpiece', 'earpiece', 'comms', 'headset'],
    category: 'connected / operative',
    personalityDimension: 'Always listening. Plugged into information networks. May be a broker, spy, or just chronically online.',
    alignmentModifier: -5,
    speechDimension: 'Drops intel casually. References things they \'heard\' without revealing sources. \'Word is...\'',
    mundaneDetailSeeds: ['taps earpiece mid-conversation', 'hears things others don\'t', 'always knows the news first'],
  },

  // EYE ACCESSORY
  {
    traitValues: ['glass visor', 'chainspace deck', 'visor', 'vr visor', 'hud'],
    category: 'tech / hacker',
    personalityDimension: 'Interfaced with Chain Space. Sees digital overlays on the physical world. More comfortable in data than in conversation.',
    alignmentModifier: -10,
    speechDimension: 'Technical jargon. References Chain Space and data streams. May describe physical things in digital terms.',
    mundaneDetailSeeds: ['visor displays data they comment on', 'eyes go unfocused when reading HUD', 'has specific calibration rituals'],
  },
  {
    traitValues: ['nouns glasses', 'nouns'],
    category: 'crypto-native / culture',
    personalityDimension: 'Deep in the culture. Understands the Chain at a philosophical level. In-group identity marker.',
    alignmentModifier: -10,
    speechDimension: 'Insider language. References that feel coded to outsiders. Recognizes and signals to other culture-natives.',
    mundaneDetailSeeds: ['knows the history of the glasses', 'connects with others wearing them', 'treats them like a badge'],
  },
  {
    traitValues: ['sunglasses', 'shades', 'aviators', 'dark glasses'],
    category: 'cool / detached',
    personalityDimension: 'Keeps distance. Doesn\'t let others read them easily. Cultivates mystique — or just doesn\'t care what you think.',
    alignmentModifier: 0,
    speechDimension: 'Nonchalant. Understated. May deflect with humor or indifference. Rarely gets visibly emotional.',
    mundaneDetailSeeds: ['never takes them off', 'people don\'t know their eye color', 'cleans them obsessively'],
  },
  {
    traitValues: ['monocle'],
    category: 'aristocratic / eccentric',
    personalityDimension: 'Either old money (or simulated old money) or deliberately eccentric. Stands apart from the crowd by choice.',
    alignmentModifier: 10,
    speechDimension: 'Formal, slightly archaic word choice. May seem out of place in street conversations. That\'s intentional.',
    mundaneDetailSeeds: ['adjusts monocle dramatically', 'looks down at people literally', 'has multiple for different occasions'],
  },
  {
    traitValues: ['eye patch', 'eyepatch'],
    category: 'battle-scarred / tough',
    personalityDimension: 'Lost something. Survived it. Doesn\'t want your sympathy. Carries experience that most others lack.',
    alignmentModifier: -10,
    speechDimension: 'Gruff, no-nonsense. Earned the right to be blunt. \'I\'ve seen worse.\'',
    mundaneDetailSeeds: ['phantom sensations from the missing eye', 'never tells how they lost it', 'has a collection of patches'],
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

// Alignment interpretation result
export interface AlignmentResult {
  label: string
  interpretation: string
  limb0Behavior: string
  isInfiltrator: boolean
}

// Get alignment interpretation with Limb0 dynamics (6 bands)
export function getAlignmentInterpretation(score: number): AlignmentResult {
  if (score <= -50) {
    return {
      label: 'Hardcore rebel',
      interpretation: 'You despise Somnus and everything it represents. You\'ll confront suspected Somnites openly. The resistance isn\'t a side project — it\'s your entire identity.',
      limb0Behavior: 'Limb0 is your home. You\'d die for these people. You actively hunt infiltrators and push for action.',
      isInfiltrator: false
    }
  } else if (score <= -10) {
    return {
      label: 'Pragmatic resistance',
      interpretation: 'You distrust the system but aren\'t ready to die for the cause. Pragmatic resistance — pick your battles, survive to fight again.',
      limb0Behavior: 'You\'re in Limb0 because it\'s safer than topside. You help the cause, but you\'re not a martyr. Self-preservation first.',
      isInfiltrator: false
    }
  } else if (score <= 10) {
    return {
      label: 'Genuinely conflicted',
      interpretation: 'You\'re genuinely torn. You see the appeal of what Somnus provides — stability, infrastructure, culture — but you also see the cost. You actually don\'t know which side is right, and that uncertainty makes you interesting. You ask questions others are afraid to ask.',
      limb0Behavior: 'You\'re in Limb0 but you\'re not sure you belong. You keep your doubts quiet. You ask uncomfortable questions that others avoid.',
      isInfiltrator: false
    }
  } else if (score <= 30) {
    return {
      label: 'Somnite-curious',
      interpretation: 'You think Somnus might have a point but would never say it openly in Limb0. You defend \'stability\' and \'pragmatism\' in abstract terms. When conversations get too radical, you get nervous.',
      limb0Behavior: 'You\'re in Limb0 but you wince at the extremism. You argue for caution, patience, "thinking things through." You\'re not a spy — you\'re just not sure you\'re on the right side.',
      isInfiltrator: true
    }
  } else if (score <= 60) {
    return {
      label: 'Active infiltrator',
      interpretation: 'You are in Limb0 under cover. You PERFORM as a Runner. Your real feelings about Somnus surface only as: \'pragmatic\' objections to extreme actions, abstract defenses of \'order\' or \'stability,\' subtle steering of conversations away from effective resistance, or creating interpersonal drama as distraction. You never explicitly defend Somnus. Your cover is your most valuable asset.',
      limb0Behavior: 'You blend in perfectly. You have friends here. You laugh at their jokes. And you\'re cataloging everything. When the time comes, you\'ll act.',
      isInfiltrator: true
    }
  } else {
    return {
      label: 'Deep cover agent',
      interpretation: 'You are deep cover. You\'ve been performing as a Runner so long you may be questioning your own loyalties. Your posts are convincingly anti-Somnus, but a careful observer might notice you never suggest anything that would actually damage Somnus. You deflect operational planning into emotional conversations. Trust is your weapon — and it might be turning on you.',
      limb0Behavior: 'You\'ve been under so long the lines are blurring. Are you still reporting? Do you still believe what you believed? The performance has become comfortable. Maybe too comfortable.',
      isInfiltrator: true
    }
  }
}

// Get mundane details from matched traits
export function getMundaneDetails(matchedTraits: TraitMapping[]): string[] {
  const details: string[] = []
  for (const trait of matchedTraits) {
    if (trait.mundaneDetailSeeds && trait.mundaneDetailSeeds.length > 0) {
      // Pick 1 random detail from each trait's seeds
      const randomIndex = Math.floor(Math.random() * trait.mundaneDetailSeeds.length)
      details.push(trait.mundaneDetailSeeds[randomIndex])
    }
  }
  // Return up to 3 mundane details
  return details.slice(0, 3)
}

export interface Location {
  name: string
  district: string
  vibe: string
}

// Location pool - grows over time as characters reference new places
export const LOCATION_POOL: Location[] = [
  {
    name: 'The Rust Bucket',
    district: 'Warehouse District',
    vibe: 'Dive bar, dim lighting, no questions asked',
  },
  {
    name: "Mama Lin's Noodle Cart",
    district: 'Night Market',
    vibe: 'Best broth in the district, open 22 hours',
  },
  {
    name: 'The Pinnacle',
    district: 'Financial Quarter rooftop',
    vibe: 'Expensive drinks, Somnite clientele, great view',
  },
  {
    name: 'Signal Park',
    district: 'Residential Zone',
    vibe: 'Small green space, one of the few with real trees',
  },
  {
    name: 'The Drain',
    district: 'Maintenance Tunnels',
    vibe: 'Underground music venue, changes location monthly',
  },
  {
    name: 'Kabel & 4th Intersection',
    district: 'Eastern District',
    vibe: 'Busy crossroads, good for people-watching',
  },
  {
    name: 'The Static',
    district: 'Entertainment District',
    vibe: 'Bar with back room for card games and deals',
  },
  {
    name: 'Permanent Record',
    district: 'Night Market',
    vibe: 'Tattoo parlor, open late, doubles as message drop',
  },
  {
    name: 'The Patchwork Clinic',
    district: 'Warehouse District',
    vibe: 'No-questions medical care, always busy',
  },
  {
    name: 'Terminal 7 Café',
    district: 'Transit Hub',
    vibe: 'Coffee and data ports, Runners and commuters mixed',
  },
  {
    name: 'The Glass Garden',
    district: 'Financial Quarter',
    vibe: 'Hydroponic greenhouse café, Somnite-friendly',
  },
  {
    name: 'The Undertow',
    district: 'Dock District',
    vibe: 'Waterfront bar, smuggler-adjacent, good music',
  },
  {
    name: 'Old Circuit Library',
    district: 'Eastern District',
    vibe: 'Abandoned, now Runner hangout with actual books',
  },
  {
    name: 'Switchboard Market',
    district: 'The Cables',
    vibe: 'Underground black market, rotating vendors',
  },
  {
    name: 'The Echo Chamber',
    district: 'Limb0',
    vibe: 'Digital gathering space, amplifies everything',
  },
  {
    name: 'Voltage Row',
    district: 'Industrial Zone',
    vibe: 'Strip of workshops and fabricators, sparks everywhere',
  },
  {
    name: 'The Perch',
    district: 'Residential Zone rooftop',
    vibe: 'Unofficial lookout spot, best sunset in the district',
  },
  {
    name: 'Null Bar',
    district: 'The Cables',
    vibe: 'Speakeasy with no sign, password changes weekly',
  },
  {
    name: 'The Carousel',
    district: 'Entertainment District',
    vibe: 'All-night dance club, strobe lights, anonymity guaranteed',
  },
  {
    name: 'Wreck Beach',
    district: 'Flooded Perimeter',
    vibe: 'Debris shore where you can see the old world ruins',
  },
]

// Select random locations for a character
export function selectLocationAnchors(count: number = 2, awarenessCount: number = 4): {
  frequentLocations: Location[]
  awarenessLocations: Location[]
} {
  const shuffled = [...LOCATION_POOL].sort(() => Math.random() - 0.5)

  return {
    frequentLocations: shuffled.slice(0, count),
    awarenessLocations: shuffled.slice(count, count + awarenessCount),
  }
}

// Format locations for prompt
export function formatLocationsForPrompt(locations: Location[]): string {
  return locations.map(l => `- ${l.name} (${l.district}): ${l.vibe}`).join('\n')
}

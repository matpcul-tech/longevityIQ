export type Protocol = {
  slug: string
  name: string
  category: 'recovery' | 'performance' | 'longevity' | 'clinical'
  shortDescription: string
  longDescription: string
  priceMin: number
  priceMax: number
  durationMinutes: number
}

export const PHASE_1_PROTOCOLS: Protocol[] = [
  {
    slug: 'cryotherapy',
    name: 'Whole-Body Cryotherapy',
    category: 'recovery',
    shortDescription: 'Three minutes at minus 110C to reduce inflammation and reset the nervous system.',
    longDescription:
      'A short cold exposure session designed to lower systemic inflammation, boost norepinephrine, and accelerate recovery between training blocks.',
    priceMin: 65,
    priceMax: 95,
    durationMinutes: 15,
  },
  {
    slug: 'red-light',
    name: 'Photobiomodulation Bed',
    category: 'recovery',
    shortDescription: 'Full-body red and near-infrared light for mitochondrial output.',
    longDescription:
      'Twenty minutes on a full-spectrum red light bed to upregulate mitochondrial ATP, skin collagen, and tissue repair.',
    priceMin: 55,
    priceMax: 85,
    durationMinutes: 25,
  },
  {
    slug: 'iv-nad',
    name: 'NAD+ IV Therapy',
    category: 'longevity',
    shortDescription: 'Direct NAD+ infusion for cellular energy and DNA repair pathways.',
    longDescription:
      'A clinically supervised infusion of NAD+ targeting sirtuin activity, mitochondrial function, and neurological clarity.',
    priceMin: 350,
    priceMax: 750,
    durationMinutes: 180,
  },
  {
    slug: 'hbot',
    name: 'Hyperbaric Oxygen',
    category: 'longevity',
    shortDescription: 'Mild hyperbaric session at 1.5 ATA for tissue oxygenation and recovery.',
    longDescription:
      'Sixty minutes in a mild hyperbaric environment to elevate dissolved oxygen, support cognitive recovery, and modulate stem cell mobilization.',
    priceMin: 125,
    priceMax: 195,
    durationMinutes: 75,
  },
  {
    slug: 'iv-myers',
    name: 'Myers Cocktail IV',
    category: 'clinical',
    shortDescription: 'Magnesium, B-complex, vitamin C and calcium for baseline replenishment.',
    longDescription:
      'A classic IV blend administered by a clinical partner to replenish micronutrients in athletes and high-output professionals.',
    priceMin: 175,
    priceMax: 285,
    durationMinutes: 60,
  },
  {
    slug: 'contrast-therapy',
    name: 'Contrast Therapy Suite',
    category: 'recovery',
    shortDescription: 'Hot sauna and cold plunge protocol guided by a recovery coach.',
    longDescription:
      'Alternating heat and cold exposure to drive vagal tone, vascular conditioning, and parasympathetic recovery.',
    priceMin: 75,
    priceMax: 125,
    durationMinutes: 60,
  },
  {
    slug: 'peptide-consult',
    name: 'Peptide Therapy Consult',
    category: 'clinical',
    shortDescription: 'Clinical intake for BPC-157, TB-500, and longevity peptide protocols.',
    longDescription:
      'A 45 minute consult with a licensed clinical partner to evaluate peptide protocol fit, dosing, and monitoring plan.',
    priceMin: 225,
    priceMax: 375,
    durationMinutes: 45,
  },
  {
    slug: 'vo2-baseline',
    name: 'VO2 Max Baseline',
    category: 'performance',
    shortDescription: 'Lab-grade VO2 max and metabolic threshold test with a written report.',
    longDescription:
      'A treadmill or bike ramp test to capture VO2 max, RER, and lactate threshold, scored against age and sex norms.',
    priceMin: 195,
    priceMax: 295,
    durationMinutes: 60,
  },
]

export function getProtocol(slug: string): Protocol | undefined {
  return PHASE_1_PROTOCOLS.find((p) => p.slug === slug)
}

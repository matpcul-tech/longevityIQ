export type BioAgeQuestion = {
  key: string
  prompt: string
  helper: string
  options: { label: string; score: number }[]
}

export const BIO_AGE_QUESTIONS: BioAgeQuestion[] = [
  {
    key: 'sleep',
    prompt: 'On a typical week, how many nights do you sleep at least 7 hours?',
    helper: 'Sleep regularity is the strongest single predictor of biological aging.',
    options: [
      { label: '6 or 7 nights', score: 5 },
      { label: '4 or 5 nights', score: 4 },
      { label: '2 or 3 nights', score: 2 },
      { label: '0 or 1 night', score: 1 },
    ],
  },
  {
    key: 'cardio',
    prompt: 'How many Zone 2 cardio sessions of 30 minutes or more did you complete last week?',
    helper: 'Aerobic base directly drives VO2 max trajectory.',
    options: [
      { label: '4 or more', score: 5 },
      { label: '2 or 3', score: 4 },
      { label: '1 session', score: 2 },
      { label: 'None', score: 1 },
    ],
  },
  {
    key: 'strength',
    prompt: 'How many resistance training sessions did you complete last week?',
    helper: 'Muscle mass predicts mortality more strongly than BMI in adults 40 plus.',
    options: [
      { label: '3 or more', score: 5 },
      { label: '2 sessions', score: 4 },
      { label: '1 session', score: 3 },
      { label: 'None', score: 1 },
    ],
  },
  {
    key: 'nutrition',
    prompt: 'On a typical day, do you eat at least 30 grams of protein at breakfast?',
    helper: 'Front-loading protein supports lean mass and satiety.',
    options: [
      { label: 'Always', score: 5 },
      { label: 'Most days', score: 4 },
      { label: 'Occasionally', score: 3 },
      { label: 'Rarely or never', score: 1 },
    ],
  },
  {
    key: 'stress',
    prompt: 'How would you rate your perceived stress over the last 30 days?',
    helper: 'Chronic stress accelerates inflammatory aging.',
    options: [
      { label: 'Low and recovered', score: 5 },
      { label: 'Moderate but managed', score: 4 },
      { label: 'High but intermittent', score: 2 },
      { label: 'High and persistent', score: 1 },
    ],
  },
]

export function computeBioAge(scores: Record<string, number>, chronologicalAge: number): number {
  const values = Object.values(scores)
  if (values.length === 0) return chronologicalAge
  const total = values.reduce((sum, v) => sum + v, 0)
  const maxTotal = values.length * 5
  const ratio = total / maxTotal
  const delta = (ratio - 0.6) * 18
  return Math.max(18, Math.round(chronologicalAge - delta))
}

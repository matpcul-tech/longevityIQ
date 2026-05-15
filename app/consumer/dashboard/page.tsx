import BioAgeAssessment from '@/components/BioAgeAssessment'
import { requireConsumer } from '@/lib/consumer'

export default async function BioAgeTab() {
  const { profile } = await requireConsumer()
  return (
    <div className="space-y-8">
      <header>
        <p className="heading-ui text-gold">Bio Age</p>
        <h1 className="heading-display mt-2 text-3xl text-bone">
          Score your biological age in five questions.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-mist">
          Each input is weighted against published longevity literature. Retake the
          assessment every 30 days to track movement against your chronological baseline.
        </p>
      </header>
      <BioAgeAssessment
        chronologicalAge={profile.chronological_age}
        bioAge={profile.bio_age}
        existingScores={profile.assessment_scores}
      />
    </div>
  )
}

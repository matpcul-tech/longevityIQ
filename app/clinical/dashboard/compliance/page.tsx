import ComplianceForm from '@/components/clinical/ComplianceForm'
import { requireClinicalPartner } from '@/lib/clinical'

export default async function ClinicalCompliance() {
  const { partner } = await requireClinicalPartner()
  return (
    <div className="space-y-8">
      <header>
        <p className="heading-ui text-teal">Compliance</p>
        <h1 className="heading-display mt-2 text-3xl text-bone">
          License, DEA, and malpractice on file.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-mist">
          Keep this record current to remain in good standing on the LongevityIQ network.
          The platform will alert you 30 days before any document lapses.
        </p>
      </header>
      <ComplianceForm
        partnerId={partner.id}
        initial={{
          name: partner.name,
          license_type: partner.license_type,
          license_number_masked: partner.license_number_masked,
          state: partner.state,
          dea_masked: partner.dea_masked,
          malpractice_expiry: partner.malpractice_expiry,
          revenue_share_pct: partner.revenue_share_pct,
        }}
      />
    </div>
  )
}

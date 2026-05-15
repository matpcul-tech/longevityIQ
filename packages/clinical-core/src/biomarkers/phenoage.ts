// PhenoAge from Levine et al. 2018, "An epigenetic biomarker of aging for
// lifespan and healthspan" (Aging, 10:573-591). Computes biological age in
// years from nine validated blood biomarkers plus chronological age.
//
// Inputs accepted in US conventional units; converted to SI internally.

import type { PhenoAgeInputs } from './panel'

const GAMMA = 0.0076927
const T_MONTHS = 120

export function computePhenoAge(inputs: PhenoAgeInputs): number | null {
  const required: Array<keyof PhenoAgeInputs> = [
    'albumin_g_dL',
    'creatinine_mg_dL',
    'glucose_mg_dL',
    'crp_mg_L',
    'lymphocyte_pct',
    'mcv_fL',
    'rdw_pct',
    'alk_phos_U_L',
    'wbc_10e3_uL',
    'age_years',
  ]
  for (const key of required) {
    const v = inputs[key]
    if (typeof v !== 'number' || !Number.isFinite(v)) return null
  }

  // Convert US conventional to SI / Levine units.
  const albumin_g_L = inputs.albumin_g_dL * 10
  const creatinine_umol_L = inputs.creatinine_mg_dL * 88.4
  const glucose_mmol_L = inputs.glucose_mg_dL / 18.0182
  const crp_mg_L = Math.max(inputs.crp_mg_L, 0.01)

  const xb =
    -19.9067 +
    -0.0336 * albumin_g_L +
    0.0095 * creatinine_umol_L +
    0.1953 * glucose_mmol_L +
    0.0954 * Math.log(crp_mg_L) +
    -0.012 * inputs.lymphocyte_pct +
    0.0268 * inputs.mcv_fL +
    0.3306 * inputs.rdw_pct +
    0.00188 * inputs.alk_phos_U_L +
    0.0554 * inputs.wbc_10e3_uL +
    0.0804 * inputs.age_years

  const mortalityScore =
    1 - Math.exp((-Math.exp(xb) * (Math.exp(T_MONTHS * GAMMA) - 1)) / GAMMA)

  // Guard against log(0) when mortality_score equals 1 (numerical edge).
  const safeScore = Math.min(0.9999999, Math.max(0.0000001, mortalityScore))

  const phenoAge =
    141.50225 + Math.log(-0.00553 * Math.log(1 - safeScore)) / 0.090165

  return Math.round(phenoAge * 100) / 100
}

export type PhenoAgeBreakdown = {
  phenoAge: number
  mortalityScore: number
  delta: number
}

export function phenoAgeBreakdown(
  inputs: PhenoAgeInputs,
): PhenoAgeBreakdown | null {
  const phenoAge = computePhenoAge(inputs)
  if (phenoAge === null) return null
  const albumin_g_L = inputs.albumin_g_dL * 10
  const creatinine_umol_L = inputs.creatinine_mg_dL * 88.4
  const glucose_mmol_L = inputs.glucose_mg_dL / 18.0182
  const crp_mg_L = Math.max(inputs.crp_mg_L, 0.01)
  const xb =
    -19.9067 +
    -0.0336 * albumin_g_L +
    0.0095 * creatinine_umol_L +
    0.1953 * glucose_mmol_L +
    0.0954 * Math.log(crp_mg_L) +
    -0.012 * inputs.lymphocyte_pct +
    0.0268 * inputs.mcv_fL +
    0.3306 * inputs.rdw_pct +
    0.00188 * inputs.alk_phos_U_L +
    0.0554 * inputs.wbc_10e3_uL +
    0.0804 * inputs.age_years
  const mortalityScore =
    1 - Math.exp((-Math.exp(xb) * (Math.exp(T_MONTHS * GAMMA) - 1)) / GAMMA)
  return {
    phenoAge,
    mortalityScore,
    delta: phenoAge - inputs.age_years,
  }
}

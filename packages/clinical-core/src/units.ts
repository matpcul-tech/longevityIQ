// Unit converters between US conventional and SI for clinical biomarkers.
// Used by PhenoAge and any cross-lab normalization upstream of training.

export const UNITS = {
  glucose_mgdl_to_mmoll: (v: number) => v / 18.0182,
  creatinine_mgdl_to_umoll: (v: number) => v * 88.4,
  albumin_gdl_to_gl: (v: number) => v * 10,
  cholesterol_mgdl_to_mmoll: (v: number) => v / 38.67,
  triglycerides_mgdl_to_mmoll: (v: number) => v / 88.57,
  vitamin_d_ngml_to_nmoll: (v: number) => v * 2.5,
  testosterone_ngdl_to_nmoll: (v: number) => v / 28.84,
  estradiol_pgml_to_pmoll: (v: number) => v * 3.671,
  cortisol_ugdl_to_nmoll: (v: number) => v * 27.59,
  homocysteine_umoll_passthrough: (v: number) => v,
} as const

export type UnitConverter = keyof typeof UNITS

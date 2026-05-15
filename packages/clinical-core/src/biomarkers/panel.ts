// LongevityIQ Forty-Six clinical panel.
// Optimal ranges reflect longevity-optimization targets (Attia, Topol, Levine, ISOM)
// not standard lab "in range" thresholds.

export type BiomarkerCategory =
  | 'metabolic'
  | 'lipids'
  | 'inflammation'
  | 'hormones'
  | 'vitamins'
  | 'hematology'
  | 'organ'

export type BiomarkerSpec = {
  slug: string
  name: string
  category: BiomarkerCategory
  unit: string
  refLow: number | null
  refHigh: number | null
  optimalLow: number | null
  optimalHigh: number | null
  rationale: string
  phenoageInput?: keyof PhenoAgeInputs
}

export type PhenoAgeInputs = {
  albumin_g_dL: number
  creatinine_mg_dL: number
  glucose_mg_dL: number
  crp_mg_L: number
  lymphocyte_pct: number
  mcv_fL: number
  rdw_pct: number
  alk_phos_U_L: number
  wbc_10e3_uL: number
  age_years: number
}

export const PANEL: BiomarkerSpec[] = [
  // Hematology (10)
  { slug: 'wbc', name: 'White Blood Cell Count', category: 'hematology', unit: '10^3/µL',
    refLow: 4.0, refHigh: 11.0, optimalLow: 4.5, optimalHigh: 6.5,
    rationale: 'Lower WBC within range correlates with reduced all-cause mortality (Ruggiero 2007).',
    phenoageInput: 'wbc_10e3_uL' },
  { slug: 'rbc', name: 'Red Blood Cell Count', category: 'hematology', unit: '10^6/µL',
    refLow: 4.2, refHigh: 5.9, optimalLow: 4.4, optimalHigh: 5.5,
    rationale: 'Reflects oxygen carrying capacity and erythropoietic health.' },
  { slug: 'hemoglobin', name: 'Hemoglobin', category: 'hematology', unit: 'g/dL',
    refLow: 12.0, refHigh: 17.5, optimalLow: 13.5, optimalHigh: 15.5,
    rationale: 'Tracks iron status, oxygen delivery and erythropoiesis.' },
  { slug: 'hematocrit', name: 'Hematocrit', category: 'hematology', unit: '%',
    refLow: 36, refHigh: 52, optimalLow: 40, optimalHigh: 46,
    rationale: 'Volume share of red cells. Excess raises stroke risk.' },
  { slug: 'platelets', name: 'Platelets', category: 'hematology', unit: '10^3/µL',
    refLow: 150, refHigh: 450, optimalLow: 175, optimalHigh: 275,
    rationale: 'Elevated counts correlate with chronic inflammation and venous thrombosis.' },
  { slug: 'mcv', name: 'Mean Corpuscular Volume', category: 'hematology', unit: 'fL',
    refLow: 80, refHigh: 100, optimalLow: 88, optimalHigh: 94,
    rationale: 'Cell size flags B12, folate or alcohol stress on erythropoiesis.',
    phenoageInput: 'mcv_fL' },
  { slug: 'rdw', name: 'Red Cell Distribution Width', category: 'hematology', unit: '%',
    refLow: 11.5, refHigh: 14.5, optimalLow: 11.5, optimalHigh: 13.0,
    rationale: 'Higher RDW is an independent predictor of all-cause mortality (Patel 2009).',
    phenoageInput: 'rdw_pct' },
  { slug: 'neutrophils_pct', name: 'Neutrophils %', category: 'hematology', unit: '%',
    refLow: 40, refHigh: 75, optimalLow: 45, optimalHigh: 60,
    rationale: 'High neutrophil-to-lymphocyte ratio is a frailty and mortality signal.' },
  { slug: 'lymphocytes_pct', name: 'Lymphocytes %', category: 'hematology', unit: '%',
    refLow: 20, refHigh: 45, optimalLow: 30, optimalHigh: 42,
    rationale: 'Tracks immune reserve; low lymphocytes carry mortality risk in PhenoAge.',
    phenoageInput: 'lymphocyte_pct' },
  { slug: 'monocytes_pct', name: 'Monocytes %', category: 'hematology', unit: '%',
    refLow: 2, refHigh: 12, optimalLow: 4, optimalHigh: 8,
    rationale: 'Macrophage precursors. Elevations signal subclinical inflammation.' },

  // Metabolic (5)
  { slug: 'glucose', name: 'Fasting Glucose', category: 'metabolic', unit: 'mg/dL',
    refLow: 70, refHigh: 99, optimalLow: 75, optimalHigh: 90,
    rationale: 'Even high-normal fasting glucose accelerates aging (Pradhan 2007).',
    phenoageInput: 'glucose_mg_dL' },
  { slug: 'hba1c', name: 'Hemoglobin A1c', category: 'metabolic', unit: '%',
    refLow: 4.0, refHigh: 5.6, optimalLow: 4.6, optimalHigh: 5.2,
    rationale: 'Three-month glycation average. Below 5.4 reduces CV mortality (DiNicolantonio).' },
  { slug: 'insulin', name: 'Fasting Insulin', category: 'metabolic', unit: 'µIU/mL',
    refLow: 2, refHigh: 25, optimalLow: 2, optimalHigh: 6,
    rationale: 'Hyperinsulinemia precedes type two diabetes by a decade.' },
  { slug: 'homa_ir', name: 'HOMA-IR', category: 'metabolic', unit: 'index',
    refLow: 0, refHigh: 2.5, optimalLow: 0.5, optimalHigh: 1.4,
    rationale: 'Calculated insulin sensitivity. Below 1.5 protects metabolic flexibility.' },
  { slug: 'fructosamine', name: 'Fructosamine', category: 'metabolic', unit: 'µmol/L',
    refLow: 200, refHigh: 285, optimalLow: 200, optimalHigh: 240,
    rationale: 'Two to three week glycation marker; complements A1c.' },

  // Lipids (7)
  { slug: 'total_chol', name: 'Total Cholesterol', category: 'lipids', unit: 'mg/dL',
    refLow: 100, refHigh: 199, optimalLow: 150, optimalHigh: 200,
    rationale: 'Less informative than ApoB but tracked for compliance.' },
  { slug: 'ldl_c', name: 'LDL Cholesterol', category: 'lipids', unit: 'mg/dL',
    refLow: 0, refHigh: 100, optimalLow: 40, optimalHigh: 80,
    rationale: 'ASCVD prevention targets near 70 mg/dL in optimization frameworks.' },
  { slug: 'hdl_c', name: 'HDL Cholesterol', category: 'lipids', unit: 'mg/dL',
    refLow: 40, refHigh: 90, optimalLow: 55, optimalHigh: 90,
    rationale: 'Functional HDL is protective; very high HDL needs separate scrutiny.' },
  { slug: 'triglycerides', name: 'Triglycerides', category: 'lipids', unit: 'mg/dL',
    refLow: 0, refHigh: 149, optimalLow: 40, optimalHigh: 80,
    rationale: 'Below 80 mg/dL reflects insulin sensitivity.' },
  { slug: 'apob', name: 'ApoB', category: 'lipids', unit: 'mg/dL',
    refLow: 0, refHigh: 100, optimalLow: 40, optimalHigh: 70,
    rationale: 'Causal driver of atherosclerosis (Sniderman 2019). Target sub-80.' },
  { slug: 'lpa', name: 'Lipoprotein(a)', category: 'lipids', unit: 'nmol/L',
    refLow: 0, refHigh: 75, optimalLow: 0, optimalHigh: 50,
    rationale: 'Genetic ASCVD multiplier. Measured once per lifetime baseline.' },
  { slug: 'non_hdl', name: 'Non-HDL Cholesterol', category: 'lipids', unit: 'mg/dL',
    refLow: 0, refHigh: 130, optimalLow: 60, optimalHigh: 100,
    rationale: 'Sum of atherogenic cholesterol fractions.' },

  // Inflammation (4)
  { slug: 'hs_crp', name: 'hs-CRP', category: 'inflammation', unit: 'mg/L',
    refLow: 0, refHigh: 3, optimalLow: 0, optimalHigh: 0.8,
    rationale: 'High sensitivity inflammation marker; below 1.0 reduces CV risk.',
    phenoageInput: 'crp_mg_L' },
  { slug: 'homocysteine', name: 'Homocysteine', category: 'inflammation', unit: 'µmol/L',
    refLow: 4, refHigh: 15, optimalLow: 4, optimalHigh: 7,
    rationale: 'Below 8 µmol/L protects vascular endothelium and cognition.' },
  { slug: 'ferritin', name: 'Ferritin', category: 'inflammation', unit: 'ng/mL',
    refLow: 20, refHigh: 400, optimalLow: 40, optimalHigh: 150,
    rationale: 'Above 150 raises oxidative stress; below 40 starves iron-dependent tissues.' },
  { slug: 'glyca', name: 'GlycA', category: 'inflammation', unit: 'µmol/L',
    refLow: 250, refHigh: 450, optimalLow: 250, optimalHigh: 350,
    rationale: 'NMR-based inflammation; more stable than CRP, predicts all-cause mortality.' },

  // Hormones (8)
  { slug: 'tsh', name: 'TSH', category: 'hormones', unit: 'µIU/mL',
    refLow: 0.4, refHigh: 4.5, optimalLow: 0.5, optimalHigh: 2.0,
    rationale: 'Sub-2.0 reflects optimal thyroid axis.' },
  { slug: 'free_t3', name: 'Free T3', category: 'hormones', unit: 'pg/mL',
    refLow: 2.3, refHigh: 4.2, optimalLow: 3.2, optimalHigh: 4.2,
    rationale: 'Active thyroid hormone. Drives metabolic rate.' },
  { slug: 'free_t4', name: 'Free T4', category: 'hormones', unit: 'ng/dL',
    refLow: 0.8, refHigh: 1.8, optimalLow: 1.1, optimalHigh: 1.6,
    rationale: 'Thyroid reserve.' },
  { slug: 'testosterone_total', name: 'Total Testosterone', category: 'hormones', unit: 'ng/dL',
    refLow: 264, refHigh: 916, optimalLow: 600, optimalHigh: 900,
    rationale: 'Male reference. Female optimal differs; use sex-specific overrides.' },
  { slug: 'testosterone_free', name: 'Free Testosterone', category: 'hormones', unit: 'pg/mL',
    refLow: 8, refHigh: 25, optimalLow: 15, optimalHigh: 25,
    rationale: 'Bioavailable hormone driving lean mass and libido.' },
  { slug: 'estradiol', name: 'Estradiol', category: 'hormones', unit: 'pg/mL',
    refLow: 10, refHigh: 50, optimalLow: 20, optimalHigh: 30,
    rationale: 'Male reference. Bone and vascular health.' },
  { slug: 'dhea_s', name: 'DHEA-S', category: 'hormones', unit: 'µg/dL',
    refLow: 80, refHigh: 560, optimalLow: 250, optimalHigh: 450,
    rationale: 'Adrenal reserve and longevity hormone precursor.' },
  { slug: 'cortisol_am', name: 'Cortisol (AM)', category: 'hormones', unit: 'µg/dL',
    refLow: 5, refHigh: 23, optimalLow: 8, optimalHigh: 16,
    rationale: 'Morning peak indicates HPA axis health.' },

  // Vitamins / Nutrients (5)
  { slug: 'vitamin_d', name: '25-OH Vitamin D', category: 'vitamins', unit: 'ng/mL',
    refLow: 30, refHigh: 100, optimalLow: 50, optimalHigh: 80,
    rationale: 'Above 50 supports bone, immune and cardiovascular outcomes.' },
  { slug: 'b12', name: 'Vitamin B12', category: 'vitamins', unit: 'pg/mL',
    refLow: 200, refHigh: 1100, optimalLow: 500, optimalHigh: 900,
    rationale: 'Cognitive and erythropoietic cofactor.' },
  { slug: 'folate_rbc', name: 'RBC Folate', category: 'vitamins', unit: 'ng/mL',
    refLow: 280, refHigh: 800, optimalLow: 400, optimalHigh: 750,
    rationale: 'Methylation cycle integrity.' },
  { slug: 'magnesium_rbc', name: 'RBC Magnesium', category: 'vitamins', unit: 'mg/dL',
    refLow: 4.0, refHigh: 6.4, optimalLow: 5.0, optimalHigh: 6.4,
    rationale: 'Intracellular pool; serum magnesium misses deficits.' },
  { slug: 'omega3_index', name: 'Omega-3 Index', category: 'vitamins', unit: '%',
    refLow: 4, refHigh: 12, optimalLow: 8, optimalHigh: 12,
    rationale: 'EPA+DHA share of RBC fatty acids. Above 8 reduces sudden cardiac death.' },

  // Organ (7) — kidney, liver and key enzymes
  { slug: 'creatinine', name: 'Creatinine', category: 'organ', unit: 'mg/dL',
    refLow: 0.6, refHigh: 1.3, optimalLow: 0.7, optimalHigh: 1.0,
    rationale: 'Kidney filtration marker.',
    phenoageInput: 'creatinine_mg_dL' },
  { slug: 'egfr', name: 'eGFR', category: 'organ', unit: 'mL/min/1.73m^2',
    refLow: 60, refHigh: 120, optimalLow: 90, optimalHigh: 120,
    rationale: 'Glomerular filtration rate. Below 60 indicates CKD.' },
  { slug: 'alt', name: 'ALT', category: 'organ', unit: 'U/L',
    refLow: 7, refHigh: 56, optimalLow: 10, optimalHigh: 22,
    rationale: 'Liver enzyme. Elevated ALT is the earliest sign of MASLD.' },
  { slug: 'ast', name: 'AST', category: 'organ', unit: 'U/L',
    refLow: 10, refHigh: 40, optimalLow: 10, optimalHigh: 22,
    rationale: 'Liver and muscle marker.' },
  { slug: 'albumin', name: 'Albumin', category: 'organ', unit: 'g/dL',
    refLow: 3.5, refHigh: 5.0, optimalLow: 4.4, optimalHigh: 5.0,
    rationale: 'Liver synthesis and nutritional status.',
    phenoageInput: 'albumin_g_dL' },
  { slug: 'alk_phos', name: 'Alkaline Phosphatase', category: 'organ', unit: 'U/L',
    refLow: 44, refHigh: 147, optimalLow: 50, optimalHigh: 75,
    rationale: 'Bone and liver isoforms. High values track frailty.',
    phenoageInput: 'alk_phos_U_L' },
  { slug: 'ggt', name: 'GGT', category: 'organ', unit: 'U/L',
    refLow: 9, refHigh: 48, optimalLow: 10, optimalHigh: 18,
    rationale: 'Hepatic stress marker and surrogate for visceral adiposity.' },
]

export const PANEL_COUNT = PANEL.length

export function panelBySlug(slug: string) {
  return PANEL.find((m) => m.slug === slug)
}

export function categorize(): Record<BiomarkerCategory, BiomarkerSpec[]> {
  const grouped: Record<BiomarkerCategory, BiomarkerSpec[]> = {
    hematology: [],
    metabolic: [],
    lipids: [],
    inflammation: [],
    hormones: [],
    vitamins: [],
    organ: [],
  }
  for (const m of PANEL) grouped[m.category].push(m)
  return grouped
}

export function categoryLabel(cat: BiomarkerCategory): string {
  switch (cat) {
    case 'hematology':
      return 'Hematology'
    case 'metabolic':
      return 'Metabolic and Glycation'
    case 'lipids':
      return 'Lipoproteins and ApoB'
    case 'inflammation':
      return 'Inflammation'
    case 'hormones':
      return 'Endocrine'
    case 'vitamins':
      return 'Nutrient Status'
    case 'organ':
      return 'Liver and Kidney'
  }
}

export function statusFor(
  spec: BiomarkerSpec,
  value: number,
): 'low' | 'optimal' | 'normal' | 'high' | 'critical' {
  const { refLow, refHigh, optimalLow, optimalHigh } = spec
  if (refLow !== null && value < refLow) return 'critical'
  if (refHigh !== null && value > refHigh * 1.25) return 'critical'
  if (refHigh !== null && value > refHigh) return 'high'
  if (
    optimalLow !== null &&
    optimalHigh !== null &&
    value >= optimalLow &&
    value <= optimalHigh
  ) {
    return 'optimal'
  }
  if (refLow !== null && value < (optimalLow ?? refLow)) return 'low'
  return 'normal'
}

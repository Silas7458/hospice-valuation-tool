/**
 * sensitivity.js — Five valuation engines (SDE, $/ADC, EBITDA, Revenue,
 * Normalized EBITDA) with factor-based sensitivity adjustments, enterprise
 * value rollup, and CAP-adjusted final valuation.
 */

import { getStartingMultiples } from './tiers.js';

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Run all five engines and produce the full valuation summary.
 *
 * @param {object} inputs   — raw user inputs (same shape as calculatePL expects)
 * @param {object} pl       — output of calculatePL(inputs)
 * @param {object} derived  — output of derivedMetrics(pl, inputs)
 * @param {object} overrides — optional user-provided multiples keyed by method
 *                             name (sde, ebitda, revenue, normEbitda, perAdc)
 * @returns {object}
 */
export function calculateAllSensitivities(inputs, pl, derived, overrides = {}) {
  const starting = getStartingMultiples(inputs.yearlyAdc);

  // --- Run each engine ---
  const sdeResult        = sdeEngine(starting.sde, inputs, derived);
  const perAdcResult     = perAdcEngine(starting.perAdc, inputs, derived);
  const ebitdaResult     = ebitdaEngine(starting.ebitda, inputs, derived);
  const revenueResult    = revenueEngine(starting.revenue, inputs, derived);
  const normEbitdaResult = normEbitdaEngine(starting.normEbitda, inputs, derived);

  // --- Apply overrides (F60-F64) ---
  const sdeMultiple        = overrides.sde        ?? sdeResult.total;
  const ebitdaMultiple     = overrides.ebitda      ?? ebitdaResult.total;
  const revenueMultiple    = overrides.revenue     ?? revenueResult.total;
  const normEbitdaMultiple = overrides.normEbitda  ?? normEbitdaResult.total;

  // --- Enterprise values ---
  const evSde        = sdeMultiple * pl.sde;
  const evEbitda     = ebitdaMultiple * pl.ebitda;
  const evRevenue    = revenueMultiple * pl.netRevenue;
  const normEbitdaBasis = pl.ebitda + (inputs.normAdjustment || 0);
  const evNormEbitda = normEbitdaMultiple * normEbitdaBasis;

  // --- Consensus (4-method average) ---
  const consensus = (evSde + evEbitda + evRevenue + evNormEbitda) / 4;

  // --- $/ADC is back-calculated from consensus ---
  const perAdcBackCalculated =
    inputs.yearlyAdc !== 0 ? consensus / inputs.yearlyAdc : 0;

  // --- Range ---
  const low  = Math.min(evSde, evEbitda, evRevenue, evNormEbitda);
  const mid  = consensus;
  const high = Math.max(evSde, evEbitda, evRevenue, evNormEbitda);

  // --- CAP adjustment (H75) ---
  const capAdj = (pl.acdriV2 + pl.acdriV4) / 2;

  // --- Trailing CAP liability deduction (only when a dollar amount is entered) ---
  const trailingCapLiability = (inputs.priorCapLiabilities === 'yes' && inputs.capLiabilityAmount > 0) ? inputs.capLiabilityAmount : 0;

  // --- Final adjusted values ---
  const lowAdj   = low + capAdj - trailingCapLiability;
  const midAdj   = mid + capAdj - trailingCapLiability;
  const highAdj  = high + capAdj - trailingCapLiability;
  const finalEv  = mid + capAdj - trailingCapLiability;

  // --- Harmonization gap ---
  const harmonizationGap    = Math.abs(evEbitda - evRevenue);
  const harmonizationAvg    = (evEbitda + evRevenue) / 2;
  const harmonizationGapPct =
    harmonizationAvg !== 0 ? harmonizationGap / harmonizationAvg : 0;

  return {
    // Engine detail (for UI sensitivity tables)
    engines: {
      sde:        sdeResult,
      perAdc:     perAdcResult,
      ebitda:     ebitdaResult,
      revenue:    revenueResult,
      normEbitda: normEbitdaResult,
    },

    // Final multiples used (after overrides)
    multiples: {
      sde:        sdeMultiple,
      ebitda:     ebitdaMultiple,
      revenue:    revenueMultiple,
      normEbitda: normEbitdaMultiple,
      perAdc:     perAdcBackCalculated,
    },

    // Enterprise values by method
    ev: {
      sde:        evSde,
      ebitda:     evEbitda,
      revenue:    evRevenue,
      normEbitda: evNormEbitda,
      perAdc:     consensus, // $/ADC EV = consensus
    },

    // Range & consensus
    low,
    mid,
    high,
    consensus,
    perAdcBackCalculated,

    // CAP adjustment
    capAdj,
    trailingCapLiability,

    // CAP-adjusted range
    lowAdj,
    midAdj,
    highAdj,
    finalEv,

    // Norm EBITDA adjusted basis
    normEbitdaBasis,

    // Harmonization
    harmonizationGap,
    harmonizationGapPct,
  };
}

// ---------------------------------------------------------------------------
// Engine helpers
// ---------------------------------------------------------------------------

/**
 * Build the result object for an engine: starting multiple, factor breakdown,
 * and total.
 */
function engineResult(starting, factors) {
  const adjustmentSum = factors.reduce((s, f) => s + f.value, 0);
  return {
    starting,
    factors,
    adjustmentSum,
    total: starting + adjustmentSum,
  };
}

// ---------------------------------------------------------------------------
// SDE Engine  (J3-J17)
// ---------------------------------------------------------------------------

function sdeEngine(starting, inputs, d) {
  const factors = [
    { key: 'capRisk',        label: 'CAP Risk',         value: d.recurringCap ? -0.375 : 0 },
    { key: 'cleanSurvey',    label: 'Clean Survey',     value: inputs.cleanSurvey === 'yes' ? 0.375 : 0 },
    { key: 'mcrMcd',         label: 'R&B + Medicaid',   value: d.hasMcrMcd ? 0.375 : 0 },
    { key: 'pureMedicare',   label: '100% Medicare',    value: inputs.pureMedicare === 'yes' ? -0.175 : 0 },
    { key: 'highTurnover',   label: 'High Turnover',    value: inputs.staffTurnoverHigh === 'yes' ? -0.375 : 0 },
    { key: 'ads',            label: 'ADS',              value: (inputs.viableAds ?? 0) * 0.375 },
    { key: 'esop',           label: 'ESOP',             value: inputs.esop === 'yes' ? -0.175 : 0 },
    { key: 'strongRcm',      label: 'Strong RCM',       value: inputs.strongRcm === 'yes' ? 0.375 : 0 },
    { key: 'highGip',        label: 'High GIP',         value: inputs.highGip === 'yes' ? 0.2 : 0 },
    { key: 'nonReplicable',  label: 'Non-Replicable',   value: inputs.nonReplicable === 'yes' ? -0.5 : 0 },
    { key: 'auditRisk',      label: 'Audit Risk',       value: inputs.auditRisk === 'yes' ? -0.375 : 0 },
    { key: 'other',          label: 'Other',            value: inputs.sdeOther ?? 0 },
  ];
  return engineResult(starting, factors);
}

// ---------------------------------------------------------------------------
// $/ADC Engine  (J21-J36)
// ---------------------------------------------------------------------------

function perAdcEngine(starting, inputs, d) {
  const factors = [
    { key: 'con',            label: 'CON State',             value: inputs.conState === 'yes' ? 40000 : 0 },
    { key: 'cap',            label: 'CAP Risk',              value: d.recurringCap ? -27500 : 0 },
    { key: 'auditRisk',      label: 'Audit Risk',            value: inputs.auditRisk === 'yes' ? -20000 : 0 },
    { key: 'noMedicaid',     label: 'No Medicaid',           value: !d.hasMcrMcd ? -17500 : 0 },
    { key: 'hospitalRels',   label: 'Hospital Relationships',value: inputs.hospitalRels === 'yes' ? 12000 : 0 },
    { key: 'ads',            label: 'ADS',                   value: (inputs.viableAds ?? 0) * 17500 },
    { key: 'rcm',            label: 'Strong RCM',            value: inputs.strongRcm === 'yes' ? 10000 : 0 },
    { key: 'capSurplus',     label: 'CAP Surplus',           value: d.capSurplus8k ? 10000 : 0 },
    { key: 'turnover',       label: 'High Turnover',         value: inputs.staffTurnoverHigh === 'yes' ? -17500 : 0 },
    { key: 'alos',           label: 'High ALOS',             value: inputs.highAlos === 'yes' ? -15000 : 0 },
    { key: 'esop',           label: 'ESOP',                  value: inputs.esop === 'yes' ? -10000 : 0 },
    { key: 'other',          label: 'Other',                 value: inputs.perAdcOther ?? 0 },
  ];
  return engineResult(starting, factors);
}

// ---------------------------------------------------------------------------
// EBITDA Engine  (J39-J59)
// ---------------------------------------------------------------------------

function ebitdaEngine(starting, inputs, d) {
  const factors = [
    { key: 'cleanSurvey',   label: 'Clean Survey',       value: inputs.cleanSurvey === 'yes' ? 0.375 : 0 },
    { key: 'ebitdaAbove20',  label: 'EBITDA > 20%',       value: d.ebitdaAbove20 ? 0.75 : 0 },
    { key: 'strongRcm',     label: 'Strong RCM',          value: inputs.strongRcm === 'yes' ? 0.5 : 0 },
    { key: 'noMedicaid',    label: 'No Medicaid',          value: !d.hasMcrMcd ? -0.75 : 0 },
    { key: 'staffRetention',label: 'Staff Retention',      value: d.staffRetention ? 0.375 : 0 },
    { key: 'capRisk',       label: 'CAP Risk',             value: d.recurringCap ? -0.375 : 0 },
    { key: 'capSurplus',    label: 'CAP Surplus > $8k',    value: d.capSurplus8k ? 0.2 : 0 },
    { key: 'auditHighDc',   label: 'Audit / High Live DC', value: (d.auditExposure || inputs.highLiveDc === 'yes') ? -0.375 : 0 },
    { key: 'weakRcmLarge',  label: 'Weak RCM (ADC>25)',    value: (inputs.strongRcm !== 'yes' && inputs.yearlyAdc > 25) ? -0.375 : 0 },
    { key: 'highTurnover',  label: 'High Turnover',        value: inputs.staffTurnoverHigh === 'yes' ? -0.375 : 0 },
    { key: 'highAlos',      label: 'High ALOS',            value: inputs.highAlos === 'yes' ? -0.225 : 0 },
    { key: 'pureMedicare',  label: '100% Medicare',        value: inputs.pureMedicare === 'yes' ? -0.175 : 0 },
    { key: 'ads',           label: 'ADS',                  value: (inputs.viableAds ?? 0) * 0.5 },
    { key: 'con',           label: 'CON State',            value: inputs.conState === 'yes' ? 1.25 : 0 },
    { key: 'ebitdaBelow12', label: 'EBITDA < 12%',         value: d.ebitdaBelow12 ? -0.375 : 0 },
    { key: 'ebitdaBelow8',  label: 'EBITDA < 8%',          value: d.ebitdaBelow8 ? -0.75 : 0 },
    { key: 'auditRisk',     label: 'Audit Risk',           value: inputs.auditRisk === 'yes' ? -0.375 : 0 },
    { key: 'other',         label: 'Other',                value: inputs.ebitdaOther ?? 0 },
  ];
  return engineResult(starting, factors);
}

// ---------------------------------------------------------------------------
// Revenue Engine  (J62-J79)
// ---------------------------------------------------------------------------

function revenueEngine(starting, inputs, d) {
  const factors = [
    { key: 'cleanSurvey',   label: 'Clean Survey',    value: inputs.cleanSurvey === 'yes' ? 0.075 : 0 },
    { key: 'noMedicaid',    label: 'No Medicaid',      value: !d.hasMcrMcd ? -0.15 : 0 },
    { key: 'capRisk',       label: 'CAP Risk',         value: d.recurringCap ? -0.115 : 0 },
    { key: 'highLiveDc',    label: 'High Live DC',     value: inputs.highLiveDc === 'yes' ? -0.115 : 0 },
    { key: 'highGip',       label: 'High GIP',         value: inputs.highGip === 'yes' ? 0.1 : 0 },
    { key: 'strongRcm',     label: 'Strong RCM',       value: inputs.strongRcm === 'yes' ? 0.075 : 0 },
    { key: 'ads',           label: 'ADS',              value: (inputs.viableAds ?? 0) * 0.085 },
    { key: 'pureMedicare',  label: '100% Medicare',    value: inputs.pureMedicare === 'yes' ? -0.055 : 0 },
    { key: 'highTurnover',  label: 'High Turnover',    value: inputs.staffTurnoverHigh === 'yes' ? -0.075 : 0 },
    { key: 'highAlos',      label: 'High ALOS',        value: inputs.highAlos === 'yes' ? -0.075 : 0 },
    { key: 'con',           label: 'CON State',        value: inputs.conState === 'yes' ? 0.175 : 0 },
    { key: 'ebitdaBelow10', label: 'EBITDA < 10%',     value: d.ebitdaBelow10 ? -0.1 : 0 },
    { key: 'ebitdaAbove18', label: 'EBITDA > 18%',     value: d.ebitdaAbove18 ? 0.1 : 0 },
    { key: 'auditRisk',     label: 'Audit Risk',       value: inputs.auditRisk === 'yes' ? -0.075 : 0 },
    { key: 'other',         label: 'Other',            value: inputs.revenueOther ?? 0 },
  ];
  return engineResult(starting, factors);
}

// ---------------------------------------------------------------------------
// Normalized EBITDA Engine  (J81-J97)
// ---------------------------------------------------------------------------

function normEbitdaEngine(starting, inputs, d) {
  const factors = [
    { key: 'ebitdaAbove20',  label: 'EBITDA > 20%',           value: d.ebitdaAbove20 ? 1.25 : 0 },
    { key: 'cleanNoCap',     label: 'Clean Survey + No CAP',  value: (inputs.cleanSurvey === 'yes' && !d.recurringCap) ? 0.75 : 0 },
    { key: 'ads1',           label: 'ADS (primary)',           value: (inputs.viableAds ?? 0) * 0.75 },
    { key: 'adcBelow30',     label: 'ADC < 30',               value: d.adcBelow30 ? -1.0 : 0 },
    { key: 'capOrAudit',     label: 'CAP / Audit Exposure',   value: (d.recurringCap || d.auditExposure) ? -1.5 : 0 },
    { key: 'weakRcmLarge',   label: 'Weak RCM (ADC>25)',      value: (inputs.strongRcm !== 'yes' && inputs.yearlyAdc > 25) ? -0.75 : 0 },
    { key: 'auditExposure',  label: 'Audit Exposure',         value: d.auditExposure ? -0.375 : 0 },
    { key: 'pureMedicare',   label: '100% Medicare',          value: inputs.pureMedicare === 'yes' ? -0.175 : 0 },
    { key: 'highTurnover',   label: 'High Turnover',          value: inputs.staffTurnoverHigh === 'yes' ? -0.375 : 0 },
    { key: 'highAlos',       label: 'High ALOS',              value: inputs.highAlos === 'yes' ? -0.225 : 0 },
    { key: 'con',            label: 'CON State',              value: inputs.conState === 'yes' ? 1.25 : 0 },
    { key: 'ads2',           label: 'ADS (secondary)',         value: (inputs.viableAds ?? 0) * 0.5 },
    { key: 'auditRisk',      label: 'Audit Risk',             value: inputs.auditRisk === 'yes' ? -0.375 : 0 },
    { key: 'other',          label: 'Other',                  value: inputs.normEbitdaOther ?? 0 },
  ];
  return engineResult(starting, factors);
}

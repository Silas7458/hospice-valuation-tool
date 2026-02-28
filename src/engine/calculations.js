/**
 * calculations.js — P&L pipeline, patient quality factor, ACDRI / CAP risk,
 * and derived metric flags used by the sensitivity engines.
 */

/**
 * Build the full P&L from raw inputs.
 * Returns every intermediate line item so the UI can display them.
 */
export function calculatePL(inputs) {
  const avgDaysPerMonth = 30.44;

  // --- Revenue ---
  const monthlyPatientDays = inputs.yearlyAdc * avgDaysPerMonth;
  const annualPatientDays  = monthlyPatientDays * 12;

  const weightedAvgDailyRate =
    inputs.pctHighRate * inputs.rhcHighRate +
    (1 - inputs.pctHighRate) * inputs.rhcLowRate;

  const grossRevenue   = annualPatientDays * weightedAvgDailyRate;
  const hqrpReduction  = inputs.hqrpPenalty === 'yes' ? -(grossRevenue * 0.02) : 0;
  const sequestration  = -(grossRevenue * inputs.sequestrationRate);
  const netRevenue     = grossRevenue + hqrpReduction + sequestration;

  // --- Expenses (expressed as negatives) ---
  const staffCosts   = -(netRevenue * inputs.staffCostPct);
  const patientCosts = -(netRevenue * inputs.patientCostPct);
  const opsCosts     = -(netRevenue * inputs.opsCostPct);

  // --- Earnings ---
  const ebitda       = netRevenue + staffCosts + patientCosts + opsCosts;
  const ebitdaMargin = netRevenue !== 0 ? ebitda / netRevenue : 0;

  // --- Below-the-line ---
  const btl = netRevenue * inputs.btlPct;
  const noi = ebitda - btl;
  const sde = noi + btl; // equals ebitda, kept separate for clarity

  // --- Patient Quality Factor (C18) ---
  const patientQualityFactor = calcPatientQualityFactor(inputs);

  // --- ACDRI / CAP risk ---
  const acdriV2 =
    (inputs.deathRateToAdc * 100 - 13.8) * inputs.yearlyAdc * 3567;

  const acdriV4 =
    (inputs.deathRateToAdc * 100 - 13.8) *
    patientQualityFactor *
    inputs.yearlyAdc *
    3567;

  const capPerPatient =
    inputs.yearlyAdc !== 0
      ? (acdriV2 + acdriV4) / 2 / inputs.yearlyAdc
      : 0;

  return {
    avgDaysPerMonth,
    monthlyPatientDays,
    annualPatientDays,
    weightedAvgDailyRate,
    grossRevenue,
    hqrpReduction,
    sequestration,
    netRevenue,
    staffCosts,
    patientCosts,
    opsCosts,
    ebitda,
    ebitdaMargin,
    btl,
    noi,
    sde,
    patientQualityFactor,
    acdriV2,
    acdriV4,
    capPerPatient,
  };
}

/**
 * Patient Quality Factor (C18).
 */
function calcPatientQualityFactor(inputs) {
  const { dcRateToAdc, yearlyAdc, deathRateToAdc, endAdc, startAdc } = inputs;

  if (dcRateToAdc === 0 || yearlyAdc === 0) return 1;

  return (
    (1 + (deathRateToAdc / dcRateToAdc - 0.5) * 0.6) *
    (1 -
      ((endAdc - startAdc) / yearlyAdc) * 0.3 -
      ((yearlyAdc - (startAdc + endAdc) / 2) / yearlyAdc) * 0.3)
  );
}

/**
 * Derived boolean / threshold flags consumed by the sensitivity engines.
 */
export function derivedMetrics(pl, inputs) {
  return {
    ebitdaAbove20:  pl.ebitdaMargin > 0.20,
    ebitdaAbove18:  pl.ebitdaMargin > 0.18,
    ebitdaBelow12:  pl.ebitdaMargin < 0.12,
    ebitdaBelow10:  pl.ebitdaMargin < 0.10,
    ebitdaBelow8:   pl.ebitdaMargin < 0.08,
    capSurplus8k:   pl.capPerPatient > 8000,
    hasMcrMcd:      inputs.mcrMcdLicense === 'yes',
    recurringCap:   inputs.priorCapLiabilities === 'yes',
    auditExposure:  inputs.auditExposure === 'yes',
    adcBelow30:     inputs.yearlyAdc < 30,
    staffRetention: inputs.staffTurnoverHigh === 'no',
  };
}

/**
 * tiers.js — Starting multiple lookup by ADC tier for each valuation method.
 *
 * Each method has its own tier breakpoints. The function returns an object
 * with the starting (base) multiple for every method given a census (ADC).
 */

/**
 * Market $/ADC range for the "within model" indicator.
 * Returns { low, high } for the given ADC tier.
 */
export function getMarketAdcRange(adc) {
  if (adc < 10)  return { low: 15000,  high: 40000 };
  if (adc < 30)  return { low: 40000,  high: 90000 };
  if (adc < 60)  return { low: 55000,  high: 110000 };
  if (adc < 150) return { low: 100000, high: 200000 };
  return { low: 150000, high: 280000 };
}

export function getStartingMultiples(adc) {
  return {
    sde:        sdeTier(adc),
    perAdc:     perAdcTier(adc),
    ebitda:     ebitdaTier(adc),
    revenue:    revenueTier(adc),
    normEbitda: normEbitdaTier(adc),
  };
}

// --- individual tier lookups ---

function sdeTier(adc) {
  if (adc < 20)  return 3;
  if (adc < 50)  return 4;
  if (adc < 100) return 5.25;
  return 6.5;
}

function perAdcTier(adc) {
  if (adc < 10)  return 27500;
  if (adc < 30)  return 65000;
  if (adc < 60)  return 80000;
  if (adc < 150) return 150000;
  return 215000;
}

function ebitdaTier(adc) {
  if (adc < 25)  return 4.75;
  if (adc < 60)  return 6.25;
  if (adc < 100) return 7.75;
  return 9.25;
}

function revenueTier(adc) {
  if (adc < 20)  return 0.55;
  if (adc < 50)  return 0.9;
  if (adc < 100) return 1.5;
  return 2.1;
}

function normEbitdaTier(adc) {
  if (adc < 25)  return 3.25;
  if (adc < 50)  return 5;
  if (adc < 100) return 7;
  return 9;
}

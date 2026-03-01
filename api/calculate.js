import { calculatePL, derivedMetrics } from '../src/engine/calculations.js';
import { calculateAllSensitivities } from '../src/engine/sensitivity.js';
import { getMarketAdcRange } from '../src/engine/tiers.js';
import { verifyAuth } from './lib/verifyAuth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!verifyAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { inputs, factorOverrides = {} } = req.body;
  if (!inputs) {
    return res.status(400).json({ error: 'Missing inputs' });
  }

  try {
    // Map UI key to engine key
    const engineInputs = { ...inputs, staffTurnoverHigh: inputs.highTurnover };

    const pl = calculatePL(engineInputs);
    const derived = derivedMetrics(pl, engineInputs);

    // Parse override strings to numbers
    const overrides = {};
    const tryParse = (str) => { const n = parseFloat(str); return isNaN(n) ? undefined : n; };
    if (inputs.overrideSde !== '') { const v = tryParse(inputs.overrideSde); if (v !== undefined) overrides.sde = v; }
    if (inputs.overrideEbitda !== '') { const v = tryParse(inputs.overrideEbitda); if (v !== undefined) overrides.ebitda = v; }
    if (inputs.overrideRevenue !== '') { const v = tryParse(inputs.overrideRevenue); if (v !== undefined) overrides.revenue = v; }
    if (inputs.overrideNormEbitda !== '') { const v = tryParse(inputs.overrideNormEbitda); if (v !== undefined) overrides.normEbitda = v; }

    const sensitivities = calculateAllSensitivities(engineInputs, pl, derived, overrides, factorOverrides);
    const marketAdcRange = getMarketAdcRange(inputs.yearlyAdc || 0);

    return res.status(200).json({
      pl,
      derived,
      sensitivities,
      consensus: sensitivities.consensus,
      finalValuation: sensitivities.finalEv,
      marketAdcRange,
    });
  } catch (err) {
    console.error('Calculation error:', err);
    return res.status(500).json({ error: 'Calculation failed' });
  }
}

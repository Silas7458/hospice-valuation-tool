/**
 * useValuation.js — Central state hook for the hospice valuation tool.
 * Uses useReducer for all user inputs, useMemo chains for derived calculations.
 */
import { useReducer, useMemo, useEffect } from 'react';
import { calculatePL, derivedMetrics } from '../engine/calculations.js';
import { calculateAllSensitivities } from '../engine/sensitivity.js';
import { getStateFromUrl } from '../utils/urlState.js';

const DEFAULT_INPUTS = {
  mcrMcdLicense: 'yes', auditExposure: 'no', priorCapLiabilities: 'no',
  capLiabilityCount: 0, hqrpPenalty: 'no',
  startAdc: 41.5, endAdc: 35.8, yearlyAdc: 40,
  admitRateToAdc: 0.23, dcRateToAdc: 0.23, deathRateToAdc: 0.15,
  cleanSurvey: 'yes', pureMedicare: 'no', highTurnover: 'no', highAlos: 'no',
  viableAds: 0, conState: 'no', esop: 'no', strongRcm: 'no', highGip: 'no',
  nonReplicable: 'no', hospitalRels: 'no', highLiveDc: 'no', auditRisk: 'no', otherFactor: 'no',
  rhcHighRate: 225.33, rhcLowRate: 177.61, pctHighRate: 0.14,
  staffCostPct: 0.65, patientCostPct: 0.10, opsCostPct: 0.10,
  btlPct: 0.10, sequestrationRate: 0.02, pctCollected30Days: 0.98,
  overrideSde: '', overrideEbitda: '', overrideRevenue: '', overrideNormEbitda: '', overridePerAdc: '',
  sdeOther: 0, perAdcOther: 0, ebitdaOther: 0, revenueOther: 0, normEbitdaOther: 0,
};

function inputReducer(state, action) {
  switch (action.type) {
    case 'UPDATE_FIELD':
      return { ...state, [action.field]: action.value };
    case 'HYDRATE':
      return { ...DEFAULT_INPUTS, ...action.payload };
    default:
      return state;
  }
}

/**
 * Map UI input keys to the engine-expected keys.
 * The sensitivity engines expect `staffTurnoverHigh` but the UI uses `highTurnover`.
 */
function toEngineInputs(inputs) {
  return {
    ...inputs,
    staffTurnoverHigh: inputs.highTurnover,
  };
}

export default function useValuation() {
  const [inputs, dispatch] = useReducer(inputReducer, DEFAULT_INPUTS);

  // Hydrate from URL on mount
  useEffect(() => {
    const fromUrl = getStateFromUrl(DEFAULT_INPUTS);
    if (fromUrl) {
      dispatch({ type: 'HYDRATE', payload: fromUrl });
    }
  }, []);

  const updateInput = (field, value) => {
    dispatch({ type: 'UPDATE_FIELD', field, value });
  };

  const engineInputs = useMemo(() => toEngineInputs(inputs), [inputs]);

  // Step 1: P&L
  const pl = useMemo(() => calculatePL(engineInputs), [engineInputs]);

  // Step 2: Derived metrics
  const derived = useMemo(() => derivedMetrics(pl, engineInputs), [pl, engineInputs]);

  // Step 3: Build overrides from string inputs
  const overrides = useMemo(() => {
    const o = {};
    const tryParse = (str) => { const n = parseFloat(str); return isNaN(n) ? undefined : n; };
    if (inputs.overrideSde !== '')        { const v = tryParse(inputs.overrideSde);        if (v !== undefined) o.sde = v; }
    if (inputs.overrideEbitda !== '')      { const v = tryParse(inputs.overrideEbitda);      if (v !== undefined) o.ebitda = v; }
    if (inputs.overrideRevenue !== '')     { const v = tryParse(inputs.overrideRevenue);     if (v !== undefined) o.revenue = v; }
    if (inputs.overrideNormEbitda !== '')  { const v = tryParse(inputs.overrideNormEbitda);  if (v !== undefined) o.normEbitda = v; }
    return o;
  }, [inputs.overrideSde, inputs.overrideEbitda, inputs.overrideRevenue, inputs.overrideNormEbitda]);

  // Step 4: All sensitivities, EVs, consensus
  const sensitivities = useMemo(
    () => calculateAllSensitivities(engineInputs, pl, derived, overrides),
    [engineInputs, pl, derived, overrides],
  );

  const consensus = sensitivities.consensus;
  const finalValuation = sensitivities.finalEv;

  return {
    inputs,
    updateInput,
    pl,
    derived,
    sensitivities,
    consensus,
    finalValuation,
  };
}

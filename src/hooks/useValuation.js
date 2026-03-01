/**
 * useValuation.js — Central state hook for the hospice valuation tool.
 * Sends inputs to the server-side calculation API and returns results.
 * Engine code never ships to the browser.
 */
import { useReducer, useEffect, useState, useCallback, useRef } from 'react';
import { getStateFromUrl } from '../utils/urlState.js';

const DEFAULT_INPUTS = {
  mcrMcdLicense: 'yes', auditExposure: 'no', priorCapLiabilities: 'no',
  capLiabilityAmount: 0, recurringCapLiability: 'no', hqrpPenalty: 'no',
  startAdc: 36, endAdc: 42, yearlyAdc: 40,
  admitRateToAdc: 0.1375, dcRateToAdc: 0.125, deathRateToAdc: 0.1125,
  cleanSurvey: 'yes', pureMedicare: 'no', highTurnover: 'no', highAlos: 'no',
  viableAds: 0, conState: 'no', esop: 'no', strongRcm: 'no', highGip: 'no',
  nonReplicable: 'no', hospitalRels: 'no', highLiveDc: 'no', auditRisk: 'no', highEbitdaMargin: 'no', otherFactor: 'no',
  rhcHighRate: 225.33, rhcLowRate: 177.61, pctHighRate: 0.14,
  staffCostPct: 0.65, patientCostPct: 0.10, opsCostPct: 0.10,
  btlPct: 0, sequestrationRate: 0.02, pctCollected30Days: 0.98,
  overrideSde: '', overrideEbitda: '', overrideRevenue: '', overrideNormEbitda: '', overridePerAdc: '',
  normAdjustment: 0,
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

// Empty engine result shape for initial render
const EMPTY_ENGINE = { starting: 0, factors: [], adjustmentSum: 0, total: 0 };

const EMPTY_PL = {
  avgDaysPerMonth: 0, monthlyPatientDays: 0, annualPatientDays: 0,
  weightedAvgDailyRate: 0, grossRevenue: 0, hqrpReduction: 0,
  sequestration: 0, netRevenue: 0,
  staffCosts: 0, patientCosts: 0, opsCosts: 0,
  ebitda: 0, ebitdaMargin: 0, btl: 0, noi: 0, sde: 0,
  patientQualityFactor: 1, acdriV2: 0, acdriV4: 0, capPerPatient: 0,
};

const EMPTY_DERIVED = {
  ebitdaAbove18: false, ebitdaBelow12: false, ebitdaBelow10: false, ebitdaBelow8: false,
  capSurplus8k: false, hasMcrMcd: false, recurringCap: false, auditExposure: false,
  adcBelow30: false, staffRetention: false, highEbitdaMargin: false,
};

const EMPTY_SENSITIVITIES = {
  engines: { sde: EMPTY_ENGINE, perAdc: EMPTY_ENGINE, ebitda: EMPTY_ENGINE, revenue: EMPTY_ENGINE, normEbitda: EMPTY_ENGINE },
  multiples: { sde: 0, ebitda: 0, revenue: 0, normEbitda: 0, perAdc: 0 },
  ev: { sde: 0, ebitda: 0, revenue: 0, normEbitda: 0, perAdc: 0 },
  low: 0, mid: 0, high: 0, consensus: 0, perAdcBackCalculated: 0,
  capAdj: 0, trailingCapLiability: 0, capPctOfRevenue: 0,
  capSensitivityTier: 'none', ebitdaAutoTriggered: false, liveDcAutoTriggered: false,
  lowAdj: 0, midAdj: 0, highAdj: 0, finalEv: 0,
  normEbitdaBasis: 0, harmonizationGap: 0, harmonizationGapPct: 0,
};

export default function useValuation() {
  const [inputs, dispatch] = useReducer(inputReducer, DEFAULT_INPUTS);
  const [factorOverrides, setFactorOverrides] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const updateFactorOverride = useCallback((engineKey, factorKey, value) => {
    setFactorOverrides(prev => {
      const engineOverrides = { ...prev[engineKey] };
      if (value === '' || value === null || value === undefined) {
        delete engineOverrides[factorKey];
      } else {
        engineOverrides[factorKey] = Number(value);
      }
      if (Object.keys(engineOverrides).length === 0) {
        const { [engineKey]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [engineKey]: engineOverrides };
    });
  }, []);

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

  // Debounced server calculation
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      // Abort any in-flight request
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setAuthError(false);

      try {
        const res = await fetch('/api/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inputs, factorOverrides }),
          signal: controller.signal,
        });

        if (res.status === 401) {
          setAuthError(true);
          return;
        }
        if (!res.ok) throw new Error(`Server error: ${res.status}`);

        const data = await res.json();
        setResult(data);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Calculation fetch failed:', err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 350);

    return () => clearTimeout(debounceRef.current);
  }, [inputs, factorOverrides]);

  return {
    inputs,
    updateInput,
    pl: result?.pl ?? EMPTY_PL,
    derived: result?.derived ?? EMPTY_DERIVED,
    sensitivities: result?.sensitivities ?? EMPTY_SENSITIVITIES,
    consensus: result?.consensus ?? 0,
    finalValuation: result?.finalValuation ?? 0,
    marketAdcRange: result?.marketAdcRange ?? { low: 0, high: 0 },
    factorOverrides,
    updateFactorOverride,
    loading,
    authError,
  };
}

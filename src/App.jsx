/**
 * App.jsx — Main layout for the Hospice Valuation Tool
 */
import { useState, useEffect } from 'react';
import { HeartPulse, Shield, Eye, Settings } from 'lucide-react';
import useValuation from './hooks/useValuation.js';
import { getAccessLevelFromUrl } from './utils/urlState.js';
import HospiceKPIs from './components/HospiceKPIs.jsx';
import QualifyingFactors from './components/QualifyingFactors.jsx';
import RateAssumptions from './components/RateAssumptions.jsx';
import ProfitLoss from './components/ProfitLoss.jsx';
import ValuationMultiples from './components/ValuationMultiples.jsx';
import ValuationSummary from './components/ValuationSummary.jsx';
import SensitivityBreakdown from './components/SensitivityBreakdown.jsx';
import ValuationNarrative from './components/ValuationNarrative.jsx';
import MonthlyDetail from './components/MonthlyDetail.jsx';
import ShareButton from './components/ShareButton.jsx';
import { formatCurrency, formatNumber } from './engine/formatting.js';

function getQualityLevel(pqf) {
  if (pqf >= 1.30) return 'Exceptional';
  if (pqf >= 1.18) return 'Strong';
  if (pqf >= 0.95) return 'Standard';
  if (pqf >= 0.82) return 'Below Standard';
  return 'Accumulation Risk';
}

function HeroCard({ label, value, color = 'text-emerald-700' }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4">
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${color}`} style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

const ACCESS_LEVELS = [
  { key: 'client', label: 'Client', icon: Eye, color: 'bg-blue-500' },
  { key: 'enterprise', label: 'Enterprise', icon: Shield, color: 'bg-amber-500' },
  { key: 'master', label: 'Master', icon: Settings, color: 'bg-emerald-500' },
];

export default function App() {
  const [accessLevel, setAccessLevel] = useState('master');
  const [lockedAccess, setLockedAccess] = useState(false);
  const {
    inputs,
    updateInput,
    pl,
    derived,
    sensitivities,
    consensus,
    finalValuation,
    factorOverrides,
    updateFactorOverride,
  } = useValuation();

  // On mount, check URL for locked access level
  useEffect(() => {
    const urlAccess = getAccessLevelFromUrl();
    if (urlAccess && urlAccess !== 'master') {
      setAccessLevel(urlAccess);
      setLockedAccess(true);
    } else if (urlAccess === 'master') {
      setAccessLevel('master');
    }
  }, []);

  const qualityLabel = getQualityLevel(pl.patientQualityFactor);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-slate-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartPulse size={24} />
            <span className="text-lg font-bold">Hospice Valuation Tool</span>
          </div>
          <div className="flex items-center gap-3">
            {!lockedAccess && (
              <div className="hidden md:flex items-center gap-1">
                {ACCESS_LEVELS.map(({ key, label, icon: Icon, color }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setAccessLevel(key)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                      accessLevel === key
                        ? `${color} text-white`
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title={`${label} View`}
                  >
                    <Icon size={12} />
                    {label}
                  </button>
                ))}
              </div>
            )}
            {lockedAccess && (
              <span className="text-xs text-slate-400">
                {ACCESS_LEVELS.find(l => l.key === accessLevel)?.label} View
              </span>
            )}
            <ShareButton inputs={inputs} accessLevel={accessLevel} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="valuation-content" className="max-w-7xl mx-auto px-4 py-6">
        {/* Hero Metric Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <HeroCard label="Consensus EV (Pre-Adjustment)" value={formatCurrency(consensus)} />
          <HeroCard label="Final EV (Market-Adjusted)" value={formatCurrency(finalValuation)} />
          <HeroCard
            label="$/ADC"
            value={formatCurrency(sensitivities.perAdcBackCalculated)}
          />
          <HeroCard
            label="Patient Quality"
            value={
              <span>
                {formatNumber(pl.patientQualityFactor, 3)}
                <span className="text-sm font-medium text-slate-500 ml-2">{qualityLabel}</span>
              </span>
            }
          />
        </div>

        {/* Two-Column Layout */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-6">
          {/* Left column — Inputs */}
          <div>
            <HospiceKPIs inputs={inputs} updateInput={updateInput} pl={pl} />
            <QualifyingFactors inputs={inputs} updateInput={updateInput} capAutoTriggered={sensitivities.capSensitivityTier !== 'none'} ebitdaAutoTriggered={sensitivities.ebitdaAutoTriggered} liveDcAutoTriggered={sensitivities.liveDcAutoTriggered} />
            <RateAssumptions inputs={inputs} updateInput={updateInput} pl={pl} />
          </div>

          {/* Right column — Results (sticky) */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <ValuationSummary
              pl={pl}
              sensitivities={sensitivities}
              consensus={consensus}
              finalValuation={finalValuation}
              yearlyAdc={inputs.yearlyAdc}
            />
            <ProfitLoss pl={pl} />
            <ValuationMultiples
              sensitivities={sensitivities}
              inputs={inputs}
              updateInput={updateInput}
            />
          </div>
        </div>

        {/* Full-width sections */}
        <MonthlyDetail inputs={inputs} pl={pl} />
        {accessLevel !== 'client' && (
          <SensitivityBreakdown
            sensitivities={sensitivities}
            accessLevel={accessLevel}
            onFactorOverride={updateFactorOverride}
          />
        )}
        <ValuationNarrative
          pl={pl}
          sensitivities={sensitivities}
          consensus={consensus}
          finalValuation={finalValuation}
          inputs={inputs}
          derived={derived}
        />
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 py-8 border-t border-slate-200 mt-12">
        &copy; 2026 Amerix Medical Consulting, LLC &mdash; Powered by Amerix Intelligence
      </footer>
    </div>
  );
}

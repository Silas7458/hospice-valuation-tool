/**
 * App.jsx — Main layout for the Hospice Valuation Tool
 */
import { useState, useEffect } from 'react';
import { HeartPulse, Shield, Eye, Settings, Home, Info, Mail, ShoppingCart, LogOut, Loader2 } from 'lucide-react';
import useValuation from './hooks/useValuation.js';
import { getAccessLevelFromUrl, isLinkExpired } from './utils/urlState.js';
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
import LoginPage from './components/LoginPage.jsx';
import AdminPage from './components/AdminPage.jsx';
import { formatCurrency, formatNumber } from './engine/formatting.js';

function getQualityLevel(pqf) {
  if (pqf >= 1.30) return 'Exceptional';
  if (pqf >= 1.18) return 'Strong';
  if (pqf >= 0.95) return 'Standard';
  if (pqf >= 0.82) return 'Below Standard';
  return 'Accumulation Risk';
}

function HeroCard({ label, value, color = 'text-emerald-700', loading }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4">
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${loading ? 'text-slate-300 animate-pulse' : color}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
    </div>
  );
}

const ACCESS_LEVELS = [
  { key: 'client', label: 'Client', icon: Eye, color: 'bg-blue-500' },
  { key: 'enterprise', label: 'Enterprise', icon: Shield, color: 'bg-amber-500' },
  { key: 'master', label: 'Master', icon: Settings, color: 'bg-emerald-500' },
];

export default function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [accessLevel, setAccessLevel] = useState('master');
  const [lockedAccess, setLockedAccess] = useState(false);
  const [expired, setExpired] = useState(false);
  const [showAdmin, setShowAdmin] = useState(window.location.hash === '#admin');

  // Listen for hash changes
  useEffect(() => {
    function onHash() { setShowAdmin(window.location.hash === '#admin'); }
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Admin page — separate from main auth flow
  if (showAdmin) {
    return <AdminPage onBack={() => { window.location.hash = ''; setShowAdmin(false); }} />;
  }

  // Check auth on mount
  useEffect(() => {
    fetch('/api/check-auth')
      .then(res => {
        setAuthenticated(res.ok);
        setAuthChecked(true);
      })
      .catch(() => {
        setAuthenticated(false);
        setAuthChecked(true);
      });
  }, []);

  // Show loading pulse while checking auth
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <HeartPulse size={32} className="text-emerald-600 animate-pulse" />
      </div>
    );
  }

  // Show login page if not authenticated
  if (!authenticated) {
    return <LoginPage onLogin={() => setAuthenticated(true)} />;
  }

  return <AuthenticatedApp
    accessLevel={accessLevel}
    setAccessLevel={setAccessLevel}
    lockedAccess={lockedAccess}
    setLockedAccess={setLockedAccess}
    expired={expired}
    setExpired={setExpired}
    onLogout={() => {
      fetch('/api/logout', { method: 'POST' }).then(() => setAuthenticated(false));
    }}
  />;
}

function AuthenticatedApp({ accessLevel, setAccessLevel, lockedAccess, setLockedAccess, expired, setExpired, onLogout }) {
  const {
    inputs,
    updateInput,
    pl,
    derived,
    sensitivities,
    consensus,
    finalValuation,
    marketAdcRange,
    factorOverrides,
    updateFactorOverride,
    loading,
  } = useValuation();

  // On mount, check URL for locked access level and expiry
  useEffect(() => {
    if (isLinkExpired()) {
      setExpired(true);
      return;
    }
    const urlAccess = getAccessLevelFromUrl();
    if (urlAccess && urlAccess !== 'master') {
      setAccessLevel(urlAccess);
      setLockedAccess(true);
    } else if (urlAccess === 'master') {
      setAccessLevel('master');
    }
  }, []);

  const qualityLabel = getQualityLevel(pl.patientQualityFactor);

  const sidebarIcons = [
    { icon: Home, label: 'Home', onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
    { icon: Info, label: 'About' },
    { icon: Mail, label: 'Contact' },
    { icon: ShoppingCart, label: 'Purchase' },
  ];

  if (expired) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-10">
            <HeartPulse size={48} className="text-slate-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Link Expired</h1>
            <p className="text-slate-500 leading-relaxed">
              This valuation report link has expired. Please contact Amerix Medical Consulting for a new link.
            </p>
          </div>
          <p className="text-xs text-slate-400 mt-6">&copy; 2026 Amerix Medical Consulting, LLC</p>
        </div>
      </div>
    );
  }

  // Show initial loading state before first calculation returns
  const initialLoad = loading && consensus === 0;

  return (
    <div className="min-h-screen bg-slate-50 md:ml-14">
      {/* Left Icon Sidebar */}
      <nav className="hidden md:flex fixed left-0 top-0 h-full w-14 bg-slate-800 flex-col items-center py-4 gap-4 z-50 no-print">
        <div className="mb-2">
          <HeartPulse size={22} className="text-emerald-400" />
        </div>
        <div className="w-6 border-t border-slate-600" />
        {sidebarIcons.map(({ icon: Icon, label, onClick }) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            title={label}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <Icon size={20} />
          </button>
        ))}
      </nav>

      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-slate-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartPulse size={24} />
            <span className="text-lg font-bold">Hospice Valuation Tool</span>
            {loading && !initialLoad && (
              <Loader2 size={16} className="text-slate-400 animate-spin ml-2" />
            )}
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
            {!lockedAccess && (
              <button
                type="button"
                onClick={onLogout}
                title="Sign Out"
                className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="valuation-content" className="max-w-7xl mx-auto px-4 py-6">
        {initialLoad ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <Loader2 size={32} className="text-emerald-600 animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-500">Calculating valuation...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Hero Metric Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <HeroCard label="Consensus EV (Pre-Adjustment)" value={formatCurrency(consensus)} loading={loading} />
              <HeroCard label="Final EV (Market-Adjusted)" value={formatCurrency(finalValuation)} loading={loading} />
              <HeroCard
                label="$/ADC"
                value={formatCurrency(sensitivities.perAdcBackCalculated)}
                loading={loading}
              />
              <HeroCard
                label="Patient Quality"
                value={
                  <span>
                    {formatNumber(pl.patientQualityFactor, 3)}
                    <span className="text-sm font-medium text-slate-500 ml-2">{qualityLabel}</span>
                  </span>
                }
                loading={loading}
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

              {/* Right column — Results */}
              <div className={`lg:sticky lg:top-20 lg:self-start transition-opacity duration-200 ${loading ? 'opacity-60' : 'opacity-100'}`}>
                <ValuationSummary
                  pl={pl}
                  sensitivities={sensitivities}
                  consensus={consensus}
                  finalValuation={finalValuation}
                  yearlyAdc={inputs.yearlyAdc}
                  marketAdcRange={marketAdcRange}
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
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 py-8 border-t border-slate-200 mt-12">
        &copy; 2026{' '}
        <button
          type="button"
          onClick={() => { window.location.hash = 'admin'; }}
          className="text-slate-400 hover:text-slate-500 transition-colors cursor-text"
          title=""
        >
          Amerix Medical Consulting, LLC
        </button>
        {' '}&mdash; Powered by Amerix Intelligence
      </footer>
    </div>
  );
}

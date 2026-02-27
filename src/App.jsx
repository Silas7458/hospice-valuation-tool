/**
 * App.jsx — Main layout for the Hospice Valuation Tool
 */
import useValuation from './hooks/useValuation.js';
import HospiceKPIs from './components/HospiceKPIs.jsx';
import QualifyingFactors from './components/QualifyingFactors.jsx';
import RateAssumptions from './components/RateAssumptions.jsx';
import ProfitLoss from './components/ProfitLoss.jsx';
import ValuationMultiples from './components/ValuationMultiples.jsx';
import ValuationSummary from './components/ValuationSummary.jsx';
import SensitivityBreakdown from './components/SensitivityBreakdown.jsx';
import MonthlyDetail from './components/MonthlyDetail.jsx';
import ShareButton from './components/ShareButton.jsx';

export default function App() {
  const {
    inputs,
    updateInput,
    pl,
    sensitivities,
    consensus,
    finalValuation,
  } = useValuation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Hospice Valuation Tool</h1>
            <p className="text-sm text-gray-500">Enterprise value modeling for Medicare-certified hospice agencies</p>
          </div>
          <ShareButton inputs={inputs} />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="lg:grid lg:grid-cols-2 lg:gap-6">
          {/* Left column — Inputs */}
          <div>
            <HospiceKPIs inputs={inputs} updateInput={updateInput} pl={pl} />
            <QualifyingFactors inputs={inputs} updateInput={updateInput} />
            <RateAssumptions inputs={inputs} updateInput={updateInput} pl={pl} />
          </div>

          {/* Right column — Results */}
          <div>
            <ValuationSummary
              pl={pl}
              sensitivities={sensitivities}
              consensus={consensus}
              finalValuation={finalValuation}
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
        <SensitivityBreakdown sensitivities={sensitivities} />
        <MonthlyDetail inputs={inputs} pl={pl} />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-xs text-gray-400">
          Amerix Medical Consulting, LLC — Hospice Valuation Tool — For professional use only
        </div>
      </footer>
    </div>
  );
}

/**
 * QualifyingFactors.jsx — Grid of toggle cards for qualifying factors
 */
import { ClipboardCheck } from 'lucide-react';

function Toggle({ value, onChange }) {
  return (
    <div className="inline-flex rounded-lg overflow-hidden border border-slate-300">
      <button
        type="button"
        className={`px-3 py-1 text-sm font-medium transition-colors ${
          value === 'yes' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
        onClick={() => onChange('yes')}
      >
        Yes
      </button>
      <button
        type="button"
        className={`px-3 py-1 text-sm font-medium transition-colors ${
          value === 'no' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
        onClick={() => onChange('no')}
      >
        No
      </button>
    </div>
  );
}

const FACTORS = [
  { key: 'cleanSurvey',   label: 'Clean Survey History (3+ yrs)' },
  { key: 'pureMedicare',   label: '100% Medicare Payer Mix' },
  { key: 'highTurnover',   label: 'Staff Turnover > 40%' },
  { key: 'highAlos',       label: 'Total ALOS > 280 Days' },
  { key: 'conState',       label: 'CON State' },
  { key: 'esop',           label: 'ESOP or Nonprofit Conversion' },
  { key: 'strongRcm',      label: 'Strong RCM/QAPI/HRIS' },
  { key: 'highGip',        label: 'High GIP or Continuous Care Mix' },
  { key: 'nonReplicable',  label: 'Non-Replicable Profit Structure' },
  { key: 'hospitalRels',   label: 'Acute Hospital Relationships' },
  { key: 'highLiveDc',     label: 'High Live Discharge Rate' },
  { key: 'auditRisk',      label: 'Audit Risk (>10% in >=10 BP)' },
  { key: 'otherFactor',    label: 'Other (Manual Adjustment)' },
];

export default function QualifyingFactors({ inputs, updateInput }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <ClipboardCheck size={20} className="text-teal-600" />
        B. Qualifying Factors
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {FACTORS.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
            <span className="text-sm text-slate-700 mr-2">{label}</span>
            <Toggle value={inputs[key]} onChange={(v) => updateInput(key, v)} />
          </div>
        ))}
      </div>

      {/* Viable ADS stepper */}
      <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
        <span className="text-sm text-slate-700">Number of Viable ADS (0-5)</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-lg flex items-center justify-center"
            onClick={() => updateInput('viableAds', Math.max(0, (inputs.viableAds || 0) - 1))}
          >
            -
          </button>
          <span className="text-sm font-semibold w-6 text-center tabular-nums">{inputs.viableAds || 0}</span>
          <button
            type="button"
            className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-lg flex items-center justify-center"
            onClick={() => updateInput('viableAds', Math.min(5, (inputs.viableAds || 0) + 1))}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

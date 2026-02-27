/**
 * QualifyingFactors.jsx — Grid of toggle cards for qualifying factors
 */

function Toggle({ value, onChange }) {
  return (
    <div className="inline-flex rounded-md overflow-hidden border border-gray-300">
      <button
        type="button"
        className={`px-3 py-1 text-sm font-medium transition-colors ${
          value === 'yes' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        onClick={() => onChange('yes')}
      >
        Yes
      </button>
      <button
        type="button"
        className={`px-3 py-1 text-sm font-medium transition-colors ${
          value === 'no' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">B. Qualifying Factors</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {FACTORS.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2">
            <span className="text-sm text-gray-700 mr-2">{label}</span>
            <Toggle value={inputs[key]} onChange={(v) => updateInput(key, v)} />
          </div>
        ))}
      </div>

      {/* Viable ADS stepper */}
      <div className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2">
        <span className="text-sm text-gray-700">Number of Viable ADS (0-5)</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="w-8 h-8 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-lg flex items-center justify-center"
            onClick={() => updateInput('viableAds', Math.max(0, (inputs.viableAds || 0) - 1))}
          >
            -
          </button>
          <span className="font-mono text-sm font-semibold w-6 text-center">{inputs.viableAds || 0}</span>
          <button
            type="button"
            className="w-8 h-8 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-lg flex items-center justify-center"
            onClick={() => updateInput('viableAds', Math.min(5, (inputs.viableAds || 0) + 1))}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

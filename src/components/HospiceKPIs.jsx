/**
 * HospiceKPIs.jsx — Section A: Operational KPIs
 */
import { formatCurrency, formatNumber, formatPercent } from '../engine/formatting.js';

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

function NumberInput({ label, value, onChange, step = 1, min, max, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="number"
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
}

function ToggleRow({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-700">{label}</span>
      <Toggle value={value} onChange={onChange} />
    </div>
  );
}

function getQualityLevel(pqf) {
  if (pqf >= 1.15) return { label: 'Level 1 — Premium Quality' };
  if (pqf >= 1.05) return { label: 'Level 2 — Fair Quality' };
  if (pqf >= 0.95) return { label: 'Level 3 — Neutral' };
  if (pqf >= 0.85) return { label: 'Level 4 — Below Average' };
  return { label: 'Level 5 — Accumulation Risk' };
}

export default function HospiceKPIs({ inputs, updateInput, pl }) {
  const netRate = inputs.admitRateToAdc - inputs.dcRateToAdc;
  const admitsPerYear = inputs.admitRateToAdc * inputs.yearlyAdc;
  const dcsPerYear = inputs.dcRateToAdc * inputs.yearlyAdc;
  const deathsPerYear = inputs.deathRateToAdc * inputs.yearlyAdc;
  const quality = getQualityLevel(pl.patientQualityFactor);

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">A. Hospice Operational KPIs</h2>

      {/* Toggles */}
      <div className="space-y-1 mb-6">
        <ToggleRow label="MCR/MCD License" value={inputs.mcrMcdLicense} onChange={(v) => updateInput('mcrMcdLicense', v)} />
        <ToggleRow label="Audit Exposure" value={inputs.auditExposure} onChange={(v) => updateInput('auditExposure', v)} />
        <ToggleRow label="Prior CAP Liabilities" value={inputs.priorCapLiabilities} onChange={(v) => updateInput('priorCapLiabilities', v)} />
        {inputs.priorCapLiabilities === 'yes' && (
          <NumberInput
            label="CAP Liability Count"
            value={inputs.capLiabilityCount}
            onChange={(v) => updateInput('capLiabilityCount', v)}
            min={0}
            step={1}
            className="ml-4 mt-1 max-w-xs"
          />
        )}
        <ToggleRow label="HQRP Penalty" value={inputs.hqrpPenalty} onChange={(v) => updateInput('hqrpPenalty', v)} />
      </div>

      {/* Census & Rates */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <NumberInput label="Start ADC" value={inputs.startAdc} onChange={(v) => updateInput('startAdc', v)} step={0.1} />
        <NumberInput label="End ADC" value={inputs.endAdc} onChange={(v) => updateInput('endAdc', v)} step={0.1} />
        <NumberInput label="Yearly ADC" value={inputs.yearlyAdc} onChange={(v) => updateInput('yearlyAdc', v)} step={0.1} />
        <NumberInput label="Admit Rate / ADC" value={inputs.admitRateToAdc} onChange={(v) => updateInput('admitRateToAdc', v)} step={0.01} />
        <NumberInput label="DC Rate / ADC" value={inputs.dcRateToAdc} onChange={(v) => updateInput('dcRateToAdc', v)} step={0.01} />
        <NumberInput label="Death Rate / ADC" value={inputs.deathRateToAdc} onChange={(v) => updateInput('deathRateToAdc', v)} step={0.01} />
      </div>

      {/* Calculated displays */}
      <div className="bg-gray-50 rounded-md p-4">
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">Calculated Metrics</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-6 text-sm">
          <div>
            <span className="text-gray-500">Net Rate</span>
            <p className="font-mono font-semibold">{formatNumber(netRate, 2)}</p>
          </div>
          <div>
            <span className="text-gray-500">Admits / Year</span>
            <p className="font-mono font-semibold">{formatNumber(admitsPerYear, 1)}</p>
          </div>
          <div>
            <span className="text-gray-500">DCs / Year</span>
            <p className="font-mono font-semibold">{formatNumber(dcsPerYear, 1)}</p>
          </div>
          <div>
            <span className="text-gray-500">Deaths / Year</span>
            <p className="font-mono font-semibold">{formatNumber(deathsPerYear, 1)}</p>
          </div>
          <div>
            <span className="text-gray-500">Patient Quality Factor</span>
            <p className="font-mono font-semibold">{formatNumber(pl.patientQualityFactor, 3)}</p>
            <p className="text-xs text-gray-400">{quality.label}</p>
          </div>
          <div>
            <span className="text-gray-500">ACDRI v2</span>
            <p className="font-mono font-semibold">{formatCurrency(pl.acdriV2)}</p>
          </div>
          <div>
            <span className="text-gray-500">ACDRI v4</span>
            <p className="font-mono font-semibold">{formatCurrency(pl.acdriV4)}</p>
          </div>
          <div>
            <span className="text-gray-500">CAP / Patient</span>
            <p className="font-mono font-semibold">{formatCurrency(pl.capPerPatient)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

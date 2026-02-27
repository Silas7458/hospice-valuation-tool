/**
 * ValuationSummary.jsx — Main results panel showing EV by method, consensus, and final value
 */
import { formatCurrency, formatPercent, formatMultiple } from '../engine/formatting.js';

const METHODS = [
  { key: 'sde',        label: 'SDE',               basisKey: 'sde',        basisLabel: 'SDE' },
  { key: 'ebitda',     label: 'EBITDA-A',          basisKey: 'ebitda',     basisLabel: 'EBITDA' },
  { key: 'revenue',    label: 'Revenue',           basisKey: 'netRevenue', basisLabel: 'Net Revenue' },
  { key: 'normEbitda', label: 'Norm EBITDA (NOI)', basisKey: 'ebitda',     basisLabel: 'EBITDA' },
];

export default function ValuationSummary({ pl, sensitivities, consensus, finalValuation }) {
  const { multiples, ev, capAdj, lowAdj, midAdj, highAdj, harmonizationGapPct, perAdcBackCalculated } = sensitivities;

  const basisValues = {
    sde: pl.sde,
    ebitda: pl.ebitda,
    netRevenue: pl.netRevenue,
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6 lg:sticky lg:top-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Valuation Summary</h2>

      {/* 4-method results table */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2 text-gray-600 font-medium">Method</th>
              <th className="text-right py-2 text-gray-600 font-medium">Basis</th>
              <th className="text-right py-2 text-gray-600 font-medium">Multiple</th>
              <th className="text-right py-2 text-gray-600 font-medium">Enterprise Value</th>
            </tr>
          </thead>
          <tbody>
            {METHODS.map(({ key, label, basisKey }) => (
              <tr key={key} className="border-t border-gray-100">
                <td className="py-2 font-medium text-gray-700">{label}</td>
                <td className="py-2 font-mono text-right text-gray-600">
                  {formatCurrency(basisValues[basisKey])}
                </td>
                <td className="py-2 font-mono text-right text-gray-600">
                  {formatMultiple(multiples[key])}
                </td>
                <td className="py-2 font-mono text-right font-semibold text-gray-900">
                  {formatCurrency(ev[key])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Harmonization Gap */}
      <div className="flex items-center justify-between bg-gray-50 rounded-md px-4 py-2 mb-3 text-sm">
        <span className="text-gray-600">Harmonization Gap (EBITDA vs Revenue)</span>
        <span className={`font-mono font-semibold ${
          harmonizationGapPct > 0.25 ? 'text-amber-600' : 'text-gray-700'
        }`}>
          {formatPercent(harmonizationGapPct)}
        </span>
      </div>

      {/* Consensus EV */}
      <div className="bg-blue-50 rounded-md px-4 py-3 mb-3">
        <div className="text-sm text-blue-700 mb-1">Consensus EV (4-Method Average)</div>
        <div className="text-2xl font-bold font-mono text-blue-900">{formatCurrency(consensus)}</div>
      </div>

      {/* $/ADC back-calculated */}
      <div className="flex items-center justify-between bg-gray-50 rounded-md px-4 py-2 mb-3 text-sm">
        <span className="text-gray-600">$/ADC (Back-Calculated)</span>
        <span className="font-mono font-semibold text-gray-900">{formatCurrency(perAdcBackCalculated)}</span>
      </div>

      {/* CAP Adjustment */}
      <div className="flex items-center justify-between bg-gray-50 rounded-md px-4 py-2 mb-3 text-sm">
        <span className="text-gray-600">CAP Adjustment</span>
        <span className={`font-mono font-semibold ${
          capAdj >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {capAdj >= 0 ? '+' : ''}{formatCurrency(capAdj)}
          <span className="text-xs ml-1">({capAdj >= 0 ? 'surplus' : 'liability'})</span>
        </span>
      </div>

      {/* Range */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-50 rounded-md px-3 py-2 text-center">
          <div className="text-xs text-gray-500 uppercase">Low</div>
          <div className="font-mono font-semibold text-sm text-gray-800">{formatCurrency(lowAdj)}</div>
        </div>
        <div className="bg-gray-50 rounded-md px-3 py-2 text-center">
          <div className="text-xs text-gray-500 uppercase">Mid</div>
          <div className="font-mono font-semibold text-sm text-gray-800">{formatCurrency(midAdj)}</div>
        </div>
        <div className="bg-gray-50 rounded-md px-3 py-2 text-center">
          <div className="text-xs text-gray-500 uppercase">High</div>
          <div className="font-mono font-semibold text-sm text-gray-800">{formatCurrency(highAdj)}</div>
        </div>
      </div>

      {/* Final EV */}
      <div className="bg-green-50 border-2 border-green-300 rounded-lg px-6 py-5 text-center">
        <div className="text-sm text-green-700 font-medium mb-1">Final Estimated Enterprise Value</div>
        <div className="text-3xl font-bold font-mono text-green-900">{formatCurrency(finalValuation)}</div>
      </div>
    </div>
  );
}

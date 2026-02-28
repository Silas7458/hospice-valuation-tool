/**
 * ValuationSummary.jsx — Main results panel showing EV by method, consensus, and final value
 */
import { TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatPercent, formatMultiple } from '../engine/formatting.js';
import { getMarketAdcRange } from '../engine/tiers.js';

const METHODS = [
  { key: 'sde',        label: 'SDE',               basisKey: 'sde',        basisLabel: 'SDE' },
  { key: 'ebitda',     label: 'EBITDA-A',          basisKey: 'ebitda',     basisLabel: 'EBITDA' },
  { key: 'revenue',    label: 'Revenue',           basisKey: 'netRevenue', basisLabel: 'Net Revenue' },
  { key: 'normEbitda', label: 'Norm EBITDA',        basisKey: 'normEbitda', basisLabel: 'Adj. EBITDA' },
];

export default function ValuationSummary({ pl, sensitivities, consensus, finalValuation, yearlyAdc }) {
  const { multiples, ev, capAdj, trailingCapLiability, lowAdj, midAdj, highAdj, harmonizationGapPct, perAdcBackCalculated } = sensitivities;

  const basisValues = {
    sde: pl.sde,
    ebitda: pl.ebitda,
    netRevenue: pl.netRevenue,
    normEbitda: sensitivities.normEbitdaBasis,
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <TrendingUp size={20} className="text-teal-600" />
        Valuation Summary
      </h2>

      {/* 4-method results table */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="text-left py-2 text-slate-500 font-medium">Method</th>
              <th className="text-right py-2 text-slate-500 font-medium">Basis</th>
              <th className="text-right py-2 text-slate-500 font-medium">Multiple</th>
              <th className="text-right py-2 text-slate-500 font-medium">Enterprise Value</th>
            </tr>
          </thead>
          <tbody>
            {METHODS.map(({ key, label, basisKey }) => (
              <tr key={key} className="border-t border-slate-100 even:bg-slate-50 hover:bg-slate-100">
                <td className="py-2 font-medium text-slate-700">{label}</td>
                <td className="py-2 text-right text-slate-500" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {formatCurrency(basisValues[basisKey])}
                </td>
                <td className="py-2 text-right text-slate-500" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {formatMultiple(multiples[key])}
                </td>
                <td className="py-2 text-right font-semibold text-slate-900" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {formatCurrency(ev[key])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Harmonization Gap */}
      <div className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2 mb-3 text-sm">
        <span className="text-slate-500">Harmonization Gap (EBITDA vs Revenue)</span>
        <span className={`font-semibold ${
          harmonizationGapPct > 0.25 ? 'text-amber-600' : 'text-slate-700'
        }`} style={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatPercent(harmonizationGapPct)}
        </span>
      </div>

      {/* Consensus EV */}
      <div className="bg-teal-50 rounded-lg px-4 py-3 mb-3">
        <div className="text-sm text-teal-700 mb-1">Consensus EV (4-Method Average)</div>
        <div className="text-2xl font-bold text-teal-900" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(consensus)}</div>
      </div>

      {/* $/ADC back-calculated with market indicator */}
      {(() => {
        const range = getMarketAdcRange(yearlyAdc || 0);
        const withinMarket = perAdcBackCalculated >= range.low && perAdcBackCalculated <= range.high;
        return (
          <div className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2 mb-3 text-sm">
            <span className="text-slate-500">$/ADC (Back-Calculated)</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(perAdcBackCalculated)}</span>
              {withinMarket ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                  <CheckCircle size={12} /> In Range
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                  <AlertTriangle size={12} /> Outside
                </span>
              )}
            </div>
          </div>
        );
      })()}
      <div className="text-xs text-slate-400 -mt-2 mb-3 px-4">
        Market range: {formatCurrency(getMarketAdcRange(yearlyAdc || 0).low)} &ndash; {formatCurrency(getMarketAdcRange(yearlyAdc || 0).high)}
      </div>

      {/* CAP Adjustment */}
      <div className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2 mb-3 text-sm">
        <span className="text-slate-500">CAP Adjustment</span>
        <span className={`font-semibold ${
          capAdj >= 0 ? 'text-emerald-600' : 'text-rose-600'
        }`} style={{ fontVariantNumeric: 'tabular-nums' }}>
          {capAdj >= 0 ? '+' : ''}{formatCurrency(capAdj)}
          <span className="text-xs ml-1">({capAdj >= 0 ? 'surplus' : 'liability'})</span>
        </span>
      </div>

      {/* Trailing CAP Liability */}
      {trailingCapLiability > 0 && (
        <div className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2 mb-3 text-sm">
          <span className="text-slate-500">Trailing CAP Liability Deduction</span>
          <span className="font-semibold text-rose-600" style={{ fontVariantNumeric: 'tabular-nums' }}>
            -{formatCurrency(trailingCapLiability)}
          </span>
        </div>
      )}

      {/* Range */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-slate-50 rounded-lg px-3 py-2 text-center">
          <div className="text-xs text-slate-500 uppercase">Low</div>
          <div className="font-semibold text-sm text-slate-800" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(lowAdj)}</div>
        </div>
        <div className="bg-slate-50 rounded-lg px-3 py-2 text-center">
          <div className="text-xs text-slate-500 uppercase">Mid</div>
          <div className="font-semibold text-sm text-slate-800" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(midAdj)}</div>
        </div>
        <div className="bg-slate-50 rounded-lg px-3 py-2 text-center">
          <div className="text-xs text-slate-500 uppercase">High</div>
          <div className="font-semibold text-sm text-slate-800" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(highAdj)}</div>
        </div>
      </div>

      {/* Final EV */}
      <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl px-6 py-5 text-center">
        <div className="text-sm text-emerald-700 font-medium mb-1">Final Estimated Enterprise Value</div>
        <div className="text-3xl font-bold text-emerald-900" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(finalValuation)}</div>
      </div>
    </div>
  );
}

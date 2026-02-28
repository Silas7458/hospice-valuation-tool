/**
 * ProfitLoss.jsx — Display-only P&L table
 */
import { Receipt } from 'lucide-react';
import { formatCurrency, formatPercent } from '../engine/formatting.js';

function Row({ label, value, bold = false, negative = false }) {
  const textColor = negative && value < 0 ? 'text-rose-600' : 'text-slate-900';
  const fontWeight = bold ? 'font-bold' : 'font-normal';

  return (
    <tr className={`${bold ? 'border-t-2 border-slate-300' : 'border-t border-slate-100'} even:bg-slate-50 hover:bg-slate-100`}>
      <td className={`py-2 text-sm ${fontWeight} text-slate-700`}>{label}</td>
      <td className={`py-2 text-sm text-right ${fontWeight} ${textColor}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
        {formatCurrency(value)}
      </td>
    </tr>
  );
}

export default function ProfitLoss({ pl }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Receipt size={20} className="text-teal-600" />
        D. Profit &amp; Loss Summary
      </h2>

      <table className="w-full">
        <tbody>
          <Row label="Gross Revenue" value={pl.grossRevenue} />
          <Row label="Sequestration" value={pl.sequestration} negative />
          <Row label="Net Revenue" value={pl.netRevenue} bold />
          <Row label="Staff Costs" value={pl.staffCosts} negative />
          <Row label="Patient Costs" value={pl.patientCosts} negative />
          <Row label="Ops/Overhead Costs" value={pl.opsCosts} negative />
          <tr className="border-t-2 border-slate-300 hover:bg-slate-100">
            <td className="py-2 text-sm font-bold text-slate-700">
              EBITDA{' '}
              <span className="font-normal text-slate-500">
                ({formatPercent(pl.ebitdaMargin)} margin)
              </span>
            </td>
            <td className="py-2 text-sm text-right font-bold text-slate-900" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatCurrency(pl.ebitda)}
            </td>
          </tr>
          <Row label="Below-the-Line" value={-pl.btl} negative />
          <Row label="NOI" value={pl.noi} bold />
          <Row label="SDE" value={pl.sde} bold />
        </tbody>
      </table>
    </div>
  );
}

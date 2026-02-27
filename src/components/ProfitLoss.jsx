/**
 * ProfitLoss.jsx — Display-only P&L table
 */
import { formatCurrency, formatPercent } from '../engine/formatting.js';

function Row({ label, value, bold = false, negative = false }) {
  const textColor = negative && value < 0 ? 'text-red-600' : 'text-gray-900';
  const fontWeight = bold ? 'font-bold' : 'font-normal';

  return (
    <tr className={bold ? 'border-t-2 border-gray-300' : 'border-t border-gray-100'}>
      <td className={`py-2 text-sm ${fontWeight} text-gray-700`}>{label}</td>
      <td className={`py-2 text-sm font-mono text-right ${fontWeight} ${textColor}`}>
        {formatCurrency(value)}
      </td>
    </tr>
  );
}

export default function ProfitLoss({ pl }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">D. Profit &amp; Loss Summary</h2>

      <table className="w-full">
        <tbody>
          <Row label="Gross Revenue" value={pl.grossRevenue} />
          <Row label="Sequestration" value={pl.sequestration} negative />
          <Row label="Net Revenue" value={pl.netRevenue} bold />
          <Row label="Staff Costs" value={pl.staffCosts} negative />
          <Row label="Patient Costs" value={pl.patientCosts} negative />
          <Row label="Ops/Overhead Costs" value={pl.opsCosts} negative />
          <tr className="border-t-2 border-gray-300">
            <td className="py-2 text-sm font-bold text-gray-700">
              EBITDA{' '}
              <span className="font-normal text-gray-500">
                ({formatPercent(pl.ebitdaMargin)} margin)
              </span>
            </td>
            <td className="py-2 text-sm font-mono text-right font-bold text-gray-900">
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

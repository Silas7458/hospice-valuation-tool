/**
 * MonthlyDetail.jsx — Collapsible 12-month P&L grid
 */
import { useState } from 'react';
import { formatCurrency, formatNumber } from '../engine/formatting.js';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS_PER_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const TOTAL_DAYS = DAYS_PER_MONTH.reduce((a, b) => a + b, 0); // 365

function buildMonthlyData(inputs, pl) {
  const annualPatientDays = pl.annualPatientDays;
  const weightedRate = pl.weightedAvgDailyRate;

  return DAYS_PER_MONTH.map((days) => {
    const fraction = days / TOTAL_DAYS;
    const patientDays = annualPatientDays * fraction;
    const gross = patientDays * weightedRate;
    const seq = -(gross * inputs.sequestrationRate);
    const net = gross + seq;
    const staff = -(net * inputs.staffCostPct);
    const patient = -(net * inputs.patientCostPct);
    const ops = -(net * inputs.opsCostPct);
    const ebitda = net + staff + patient + ops;
    const btl = net * inputs.btlPct;
    const noi = ebitda - btl;

    return { patientDays, gross, seq, net, staff, patient, ops, ebitda, btl, noi };
  });
}

function sumColumn(months, key) {
  return months.reduce((s, m) => s + m[key], 0);
}

export default function MonthlyDetail({ inputs, pl }) {
  const [open, setOpen] = useState(false);
  const months = buildMonthlyData(inputs, pl);

  const rows = [
    { label: 'Patient Days',    key: 'patientDays', format: (v) => formatNumber(v, 0) },
    { label: 'Gross Revenue',   key: 'gross',       format: formatCurrency },
    { label: 'Sequestration',   key: 'seq',         format: formatCurrency, negative: true },
    { label: 'Net Revenue',     key: 'net',         format: formatCurrency, bold: true },
    { label: 'Staff Costs',     key: 'staff',       format: formatCurrency, negative: true },
    { label: 'Patient Costs',   key: 'patient',     format: formatCurrency, negative: true },
    { label: 'Ops/Overhead',    key: 'ops',         format: formatCurrency, negative: true },
    { label: 'EBITDA',          key: 'ebitda',       format: formatCurrency, bold: true },
    { label: 'Below-the-Line',  key: 'btl',         format: formatCurrency },
    { label: 'NOI',             key: 'noi',         format: formatCurrency, bold: true },
  ];

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
      >
        <h2 className="text-lg font-semibold text-gray-900">G. Monthly P&amp;L Detail</h2>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-6 pb-6 border-t border-gray-100 pt-4 overflow-x-auto">
          <table className="min-w-[900px] w-full text-xs">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 pr-4 text-gray-600 font-medium sticky left-0 bg-white min-w-[120px]">
                  Line Item
                </th>
                {MONTH_NAMES.map((m) => (
                  <th key={m} className="text-right py-2 px-2 text-gray-600 font-medium">{m}</th>
                ))}
                <th className="text-right py-2 px-2 text-gray-800 font-bold">Annual</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ label, key, format, negative, bold }) => (
                <tr key={key} className={`border-t border-gray-100 ${bold ? 'bg-gray-50' : ''}`}>
                  <td className={`py-1.5 pr-4 text-gray-700 sticky left-0 ${bold ? 'font-bold bg-gray-50' : 'bg-white'}`}>
                    {label}
                  </td>
                  {months.map((m, i) => {
                    const val = m[key];
                    const color = negative && val < 0 ? 'text-red-600' : 'text-gray-800';
                    return (
                      <td key={i} className={`py-1.5 px-2 font-mono text-right ${color} ${bold ? 'font-semibold' : ''}`}>
                        {format(val)}
                      </td>
                    );
                  })}
                  <td className={`py-1.5 px-2 font-mono text-right font-bold ${
                    negative && sumColumn(months, key) < 0 ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {format(sumColumn(months, key))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

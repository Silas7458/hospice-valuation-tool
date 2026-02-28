/**
 * ValuationMultiples.jsx — Table showing 5 valuation methods with override inputs
 */
import { Calculator } from 'lucide-react';
import { formatMultiple, formatCurrency } from '../engine/formatting.js';

const METHODS = [
  { key: 'sde',        label: 'SDE',              overrideKey: 'overrideSde',        type: 'multiple' },
  { key: 'ebitda',     label: 'EBITDA-A',         overrideKey: 'overrideEbitda',     type: 'multiple' },
  { key: 'revenue',    label: 'Revenue',          overrideKey: 'overrideRevenue',    type: 'multiple' },
  { key: 'normEbitda', label: 'Norm EBITDA (NOI)', overrideKey: 'overrideNormEbitda', type: 'multiple' },
  { key: 'perAdc',     label: '$/ADC',            overrideKey: 'overridePerAdc',     type: 'currency' },
];

function formatValue(value, type) {
  return type === 'currency' ? formatCurrency(value) : formatMultiple(value);
}

export default function ValuationMultiples({ sensitivities, inputs, updateInput }) {
  const { engines, multiples } = sensitivities;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Calculator size={20} className="text-teal-600" />
        E. Valuation Multiples
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="text-left py-2 text-slate-500 font-medium">Method</th>
              <th className="text-right py-2 text-slate-500 font-medium">Calculated</th>
              <th className="text-center py-2 text-slate-500 font-medium">Override</th>
              <th className="text-right py-2 text-slate-500 font-medium">Applied</th>
            </tr>
          </thead>
          <tbody>
            {METHODS.map(({ key, label, overrideKey, type }) => {
              const calculated = engines[key]?.total ?? multiples[key];
              const overrideValue = inputs[overrideKey];
              const applied = multiples[key];
              const isPerAdc = key === 'perAdc';

              return (
                <tr key={key} className="border-t border-slate-100 even:bg-slate-50 hover:bg-slate-100">
                  <td className="py-2 font-medium text-slate-700">{label}</td>
                  <td className="py-2 text-right text-slate-500" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {formatValue(calculated, type)}
                  </td>
                  <td className="py-2 text-center">
                    {isPerAdc ? (
                      <span className="text-xs text-slate-400 italic">back-calc</span>
                    ) : (
                      <input
                        type="text"
                        value={overrideValue}
                        placeholder="--"
                        onChange={(e) => updateInput(overrideKey, e.target.value)}
                        className="w-20 px-2 py-1 border border-slate-300 rounded-lg bg-slate-50 text-sm text-center focus:ring-2 focus:ring-teal-500 focus:border-teal-500 tabular-nums"
                      />
                    )}
                  </td>
                  <td className={`py-2 text-right font-semibold ${
                    overrideValue !== '' && !isPerAdc ? 'text-teal-700' : 'text-slate-900'
                  }`} style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {formatValue(applied, type)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

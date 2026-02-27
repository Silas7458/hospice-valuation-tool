/**
 * ValuationMultiples.jsx — Table showing 5 valuation methods with override inputs
 */
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
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">E. Valuation Multiples</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2 text-gray-600 font-medium">Method</th>
              <th className="text-right py-2 text-gray-600 font-medium">Calculated</th>
              <th className="text-center py-2 text-gray-600 font-medium">Override</th>
              <th className="text-right py-2 text-gray-600 font-medium">Applied</th>
            </tr>
          </thead>
          <tbody>
            {METHODS.map(({ key, label, overrideKey, type }) => {
              const calculated = engines[key]?.total ?? multiples[key];
              const overrideValue = inputs[overrideKey];
              const applied = multiples[key];
              const isPerAdc = key === 'perAdc';

              return (
                <tr key={key} className="border-t border-gray-100">
                  <td className="py-2 font-medium text-gray-700">{label}</td>
                  <td className="py-2 font-mono text-right text-gray-600">
                    {formatValue(calculated, type)}
                  </td>
                  <td className="py-2 text-center">
                    {isPerAdc ? (
                      <span className="text-xs text-gray-400 italic">back-calc</span>
                    ) : (
                      <input
                        type="text"
                        value={overrideValue}
                        placeholder="--"
                        onChange={(e) => updateInput(overrideKey, e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm font-mono text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    )}
                  </td>
                  <td className={`py-2 font-mono text-right font-semibold ${
                    overrideValue !== '' && !isPerAdc ? 'text-blue-700' : 'text-gray-900'
                  }`}>
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

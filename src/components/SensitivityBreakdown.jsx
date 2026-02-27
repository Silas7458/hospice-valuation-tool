/**
 * SensitivityBreakdown.jsx — Collapsible factor-by-factor breakdown for each engine
 */
import { useState } from 'react';
import { formatMultiple, formatCurrency } from '../engine/formatting.js';

const ENGINE_META = [
  { key: 'sde',        label: 'SDE',               type: 'multiple' },
  { key: 'ebitda',     label: 'EBITDA-A',          type: 'multiple' },
  { key: 'revenue',    label: 'Revenue',           type: 'multiple' },
  { key: 'normEbitda', label: 'Norm EBITDA (NOI)', type: 'multiple' },
  { key: 'perAdc',     label: '$/ADC',             type: 'currency' },
];

function fmt(value, type) {
  if (type === 'currency') return formatCurrency(value);
  return value >= 0 ? '+' + formatMultiple(value) : formatMultiple(value);
}

function fmtTotal(value, type) {
  if (type === 'currency') return formatCurrency(value);
  return formatMultiple(value);
}

function colorClass(value) {
  if (value > 0) return 'text-green-600';
  if (value < 0) return 'text-red-600';
  return 'text-gray-400';
}

function EnginePanel({ engineKey, label, type, engine }) {
  if (!engine) return null;

  return (
    <div className="bg-gray-50 rounded-md p-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">{label}</h4>

      <div className="flex justify-between text-sm mb-2 pb-2 border-b border-gray-200">
        <span className="text-gray-600">Starting Multiple</span>
        <span className="font-mono font-semibold text-gray-900">{fmtTotal(engine.starting, type)}</span>
      </div>

      <div className="space-y-1">
        {engine.factors.map((f) => (
          <div key={f.key} className="flex justify-between text-sm">
            <span className="text-gray-600">{f.label}</span>
            <span className={`font-mono ${colorClass(f.value)}`}>
              {f.value === 0 ? '--' : fmt(f.value, type)}
            </span>
          </div>
        ))}
      </div>

      <div className="flex justify-between text-sm mt-2 pt-2 border-t border-gray-200 font-bold">
        <span className="text-gray-800">Total</span>
        <span className="font-mono text-gray-900">{fmtTotal(engine.total, type)}</span>
      </div>
    </div>
  );
}

export default function SensitivityBreakdown({ sensitivities }) {
  const [open, setOpen] = useState(false);
  const { engines } = sensitivities;

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
      >
        <h2 className="text-lg font-semibold text-gray-900">F. Sensitivity Breakdown</h2>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-6 pb-6 border-t border-gray-100 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {ENGINE_META.map(({ key, label, type }) => (
              <EnginePanel
                key={key}
                engineKey={key}
                label={label}
                type={type}
                engine={engines[key]}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

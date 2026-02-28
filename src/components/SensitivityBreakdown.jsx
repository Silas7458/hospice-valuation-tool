/**
 * SensitivityBreakdown.jsx — Collapsible factor-by-factor breakdown for each engine.
 * In master mode, factor values are editable inline.
 */
import { useState, useRef } from 'react';
import { BarChart3, ChevronDown, RotateCcw } from 'lucide-react';
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
  if (value > 0) return 'text-emerald-600';
  if (value < 0) return 'text-rose-600';
  return 'text-slate-400';
}

function FactorRow({ engineKey, factor, type, isMaster, onOverride }) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef(null);
  const isOverridden = factor.overridden;

  function handleClick() {
    if (isMaster) setEditing(true);
  }

  function handleBlur(e) {
    setEditing(false);
    const raw = e.target.value.trim();
    if (raw === '') {
      onOverride(engineKey, factor.key, '');
    } else {
      const num = parseFloat(raw);
      if (!isNaN(num)) onOverride(engineKey, factor.key, num);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') e.target.blur();
    if (e.key === 'Escape') {
      onOverride(engineKey, factor.key, '');
      setEditing(false);
    }
  }

  function handleReset(e) {
    e.stopPropagation();
    onOverride(engineKey, factor.key, '');
  }

  if (editing) {
    return (
      <div className="flex justify-between items-center text-sm">
        <span className="text-slate-500">{factor.label}</span>
        <input
          ref={inputRef}
          type="number"
          step="any"
          defaultValue={factor.value}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-24 text-right text-sm border border-blue-400 rounded px-1.5 py-0.5 bg-blue-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex justify-between items-center text-sm ${isMaster ? 'cursor-pointer hover:bg-slate-100 -mx-1 px-1 rounded' : ''}`}
      onClick={handleClick}
    >
      <span className="text-slate-500">{factor.label}</span>
      <span className="flex items-center gap-1">
        {isOverridden && isMaster && (
          <button
            type="button"
            onClick={handleReset}
            className="text-blue-400 hover:text-blue-600"
            title="Reset to computed value"
          >
            <RotateCcw size={12} />
          </button>
        )}
        <span
          className={`${colorClass(factor.value)} ${isOverridden ? 'bg-blue-100 px-1 rounded' : ''}`}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {factor.value === 0 ? '--' : fmt(factor.value, type)}
        </span>
      </span>
    </div>
  );
}

function EnginePanel({ engineKey, label, type, engine, isMaster, onOverride }) {
  if (!engine) return null;

  return (
    <div className="bg-slate-50 rounded-lg p-4">
      <h4 className="text-sm font-semibold text-slate-700 mb-3">{label}</h4>

      <div className="flex justify-between text-sm mb-2 pb-2 border-b border-slate-200">
        <span className="text-slate-500">Starting Multiple</span>
        <span className="font-semibold text-slate-900" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtTotal(engine.starting, type)}</span>
      </div>

      <div className="space-y-1">
        {engine.factors.map((f) => (
          <FactorRow
            key={f.key}
            engineKey={engineKey}
            factor={f}
            type={type}
            isMaster={isMaster}
            onOverride={onOverride}
          />
        ))}
      </div>

      <div className="flex justify-between text-sm mt-2 pt-2 border-t border-slate-200 font-bold">
        <span className="text-slate-800">Total</span>
        <span className="text-slate-900" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtTotal(engine.total, type)}</span>
      </div>
    </div>
  );
}

export default function SensitivityBreakdown({ sensitivities, accessLevel, onFactorOverride }) {
  const [open, setOpen] = useState(false);
  const { engines } = sensitivities;
  const isMaster = accessLevel === 'master';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
      >
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <BarChart3 size={20} className="text-teal-600" />
          F. Sensitivity Breakdown
          {isMaster && <span className="text-xs font-normal text-blue-500 ml-2">(click values to override)</span>}
        </h2>
        <ChevronDown
          size={20}
          className={`text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="px-6 pb-6 border-t border-slate-100 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {ENGINE_META.map(({ key, label, type }) => (
              <EnginePanel
                key={key}
                engineKey={key}
                label={label}
                type={type}
                engine={engines[key]}
                isMaster={isMaster}
                onOverride={onFactorOverride || (() => {})}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

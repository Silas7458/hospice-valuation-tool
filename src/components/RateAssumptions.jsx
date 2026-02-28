/**
 * RateAssumptions.jsx — Collapsible rate and cost assumptions section
 */
import { useState } from 'react';
import { Sliders, ChevronDown } from 'lucide-react';
import { formatCurrency } from '../engine/formatting.js';

function PctInput({ label, value, onChange, step = 1 }) {
  // Display as whole number (e.g., 14 for 0.14), convert on change
  const displayValue = Math.round(value * 10000) / 100; // avoid floating point drift
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={displayValue}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value) / 100 || 0)}
          className="w-full px-3 py-2 pr-8 border border-slate-300 rounded-lg bg-slate-50 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
      </div>
    </div>
  );
}

function DollarInput({ label, value, onChange, step = 0.01 }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
        <input
          type="number"
          value={value}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        />
      </div>
    </div>
  );
}

export default function RateAssumptions({ inputs, updateInput, pl }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
      >
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Sliders size={20} className="text-teal-600" />
          C. Rate &amp; Cost Assumptions
        </h2>
        <ChevronDown
          size={20}
          className={`text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="px-6 pb-6 border-t border-slate-100 pt-4">
          {/* Rate inputs */}
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Reimbursement Rates</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <DollarInput label="RHC High Rate" value={inputs.rhcHighRate} onChange={(v) => updateInput('rhcHighRate', v)} />
            <DollarInput label="RHC Low Rate" value={inputs.rhcLowRate} onChange={(v) => updateInput('rhcLowRate', v)} />
            <PctInput label="% High Rate" value={inputs.pctHighRate} onChange={(v) => updateInput('pctHighRate', v)} />
          </div>

          <div className="bg-teal-50 rounded-lg px-4 py-3 mb-6">
            <span className="text-sm text-teal-700">Weighted Avg Daily Rate: </span>
            <span className="font-semibold text-teal-900 tabular-nums">{formatCurrency(pl.weightedAvgDailyRate, 2)}</span>
          </div>

          {/* Cost structure */}
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Cost Structure</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <PctInput label="Staff Cost %" value={inputs.staffCostPct} onChange={(v) => updateInput('staffCostPct', v)} />
            <PctInput label="Patient Cost %" value={inputs.patientCostPct} onChange={(v) => updateInput('patientCostPct', v)} />
            <PctInput label="Ops/Overhead %" value={inputs.opsCostPct} onChange={(v) => updateInput('opsCostPct', v)} />
          </div>

          {/* Other rates */}
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Other Assumptions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <PctInput label="Below-the-Line %" value={inputs.btlPct} onChange={(v) => updateInput('btlPct', v)} />
            <PctInput label="Sequestration Rate" value={inputs.sequestrationRate} onChange={(v) => updateInput('sequestrationRate', v)} />
            <PctInput label="% Collected in 30 Days" value={inputs.pctCollected30Days} onChange={(v) => updateInput('pctCollected30Days', v)} />
          </div>
        </div>
      )}
    </div>
  );
}

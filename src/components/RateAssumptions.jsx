/**
 * RateAssumptions.jsx — Collapsible rate and cost assumptions section
 */
import { useState, useRef, useEffect } from 'react';
import { Sliders, ChevronDown, MapPin } from 'lucide-react';
import { formatCurrency } from '../engine/formatting.js';
import { TEXAS_CITIES, getCityData, getCountiesForCity, getDefaultCounty } from '../data/texasRates.js';

function SelectInput({ label, value, onChange, options, icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter((o) => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => { setIsOpen(!isOpen); setSearch(''); }}
        className="w-full flex items-center justify-between px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-left"
      >
        <span className="flex items-center gap-2">
          {icon}
          <span className={value ? 'text-slate-800' : 'text-slate-400'}>{value || 'Select...'}</span>
        </span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-52 overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-40">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-400">No matches</div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { onChange(opt); setIsOpen(false); setSearch(''); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-teal-50 ${opt === value ? 'bg-teal-50 text-teal-700 font-medium' : 'text-slate-700'}`}
                >
                  {opt}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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
  const [open, setOpen] = useState(true);

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
          {/* Location */}
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <MapPin size={14} className="text-teal-600" />
            Location
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <SelectInput
              label="State"
              value={inputs.locationState}
              onChange={(v) => updateInput('locationState', v)}
              options={['Texas']}
            />
            <SelectInput
              label="City"
              value={inputs.locationCity}
              onChange={(city) => {
                updateInput('locationCity', city);
                const data = getCityData(city);
                if (data) {
                  updateInput('locationCounty', data.counties[0]);
                  updateInput('rhcHighRate', data.rhcHigh);
                  updateInput('rhcLowRate', data.rhcLow);
                }
              }}
              options={TEXAS_CITIES}
            />
            <SelectInput
              label="County"
              value={inputs.locationCounty}
              onChange={(v) => updateInput('locationCounty', v)}
              options={getCountiesForCity(inputs.locationCity)}
            />
          </div>

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
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Norm. Adjustment ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Non-recurring add-back"
                  value={inputs.normAdjustment || ''}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9.]/g, '');
                    updateInput('normAdjustment', raw === '' ? 0 : parseFloat(raw));
                  }}
                  className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">Adjusts Norm EBITDA basis only</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

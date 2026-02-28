/**
 * ValuationNarrative.jsx — Dynamic narrative summary of the valuation rationale.
 * Generates plain-English justification that updates live with every input change.
 */
import { useState } from 'react';
import { FileText, ChevronDown } from 'lucide-react';
import { formatCurrency, formatPercent, formatMultiple } from '../engine/formatting.js';

function adcScale(adc) {
  if (adc >= 80) return 'large-scale';
  if (adc >= 50) return 'mid-size';
  if (adc >= 30) return 'established';
  return 'small';
}

function marginAssessment(margin) {
  if (margin >= 0.20) return 'exceptionally strong';
  if (margin >= 0.18) return 'strong';
  if (margin >= 0.15) return 'healthy';
  if (margin >= 0.12) return 'adequate';
  if (margin >= 0.08) return 'below industry average';
  return 'weak';
}

function gapConfidence(gapPct) {
  const abs = Math.abs(gapPct);
  if (abs <= 5) return 'high';
  if (abs <= 15) return 'moderate';
  return 'low';
}

function collectActiveFactors(engines) {
  const positive = [];
  const negative = [];
  const seen = new Set();
  Object.values(engines).forEach(engine => {
    if (!engine?.factors) return;
    engine.factors.forEach(f => {
      if (f.value !== 0 && !seen.has(f.label)) {
        seen.add(f.label);
        (f.value > 0 ? positive : negative).push(f.label);
      }
    });
  });
  return { positive, negative };
}

function buildNarrative(pl, sensitivities, consensus, finalValuation, inputs, derived) {
  const { ev, multiples, engines, harmonizationGapPct, perAdcBackCalculated } = sensitivities;
  const { positive, negative } = collectActiveFactors(engines);
  const adc = inputs.yearlyAdc;
  const adcGrowth = inputs.endAdc - inputs.startAdc;
  const adcGrowthPct = inputs.startAdc > 0 ? adcGrowth / inputs.startAdc : 0;

  const sections = [];

  // 1. Opening
  sections.push({
    title: 'Valuation Opinion',
    text: `Based on a multi-method consensus analysis using four independent valuation approaches, this hospice operation is valued at ${formatCurrency(consensus)} (pre-adjustment), with a final market-adjusted enterprise value of ${formatCurrency(finalValuation)}. This valuation reflects the organization's financial performance, patient census characteristics, regulatory positioning, and market-comparable transaction data.`
  });

  // 2. Business Profile
  const growthClause = adcGrowth > 0
    ? `, demonstrating census growth of ${Math.abs(adcGrowth).toFixed(1)} patients (${formatPercent(Math.abs(adcGrowthPct), 1)}) over the measurement period`
    : adcGrowth < 0
    ? `, noting a census decline of ${Math.abs(adcGrowth).toFixed(1)} patients (${formatPercent(Math.abs(adcGrowthPct), 1)}) over the measurement period`
    : ', with stable census over the measurement period';

  sections.push({
    title: 'Business Profile',
    text: `This is ${adc >= 80 ? 'a' : (/^[aeiou]/.test(adcScale(adc)) ? 'an' : 'a')} ${adcScale(adc)} hospice operation serving an average daily census of ${adc.toFixed(1)} patients${growthClause}. The organization generates ${formatCurrency(pl.grossRevenue)} in annual gross revenue (${formatCurrency(pl.netRevenue)} net of sequestration and HQRP adjustments), producing EBITDA of ${formatCurrency(pl.ebitda)} at a ${formatPercent(pl.ebitdaMargin, 1)} margin — which is ${marginAssessment(pl.ebitdaMargin)} relative to industry benchmarks. Seller's Discretionary Earnings total ${formatCurrency(pl.sde)}, reflecting the full cash flow available to an owner-operator.`
  });

  // 3. Methodology
  const conf = gapConfidence(harmonizationGapPct);
  sections.push({
    title: 'Valuation Methodology',
    text: `Four independent valuation methods were applied, producing a harmonization gap of ${formatPercent(Math.abs(harmonizationGapPct) / 100, 1)} — indicating ${conf} convergence across approaches:\n\n` +
      `• SDE Method: ${formatCurrency(ev.sde)} at ${formatMultiple(multiples.sde)} applied to seller's discretionary earnings\n` +
      `• EBITDA-A Method: ${formatCurrency(ev.ebitda)} at ${formatMultiple(multiples.ebitda)} applied to adjusted EBITDA\n` +
      `• Revenue Method: ${formatCurrency(ev.revenue)} at ${formatMultiple(multiples.revenue)} applied to net revenue\n` +
      `• Normalized EBITDA Method: ${formatCurrency(ev.normEbitda)} at ${formatMultiple(multiples.normEbitda)} applied to normalized earnings\n\n` +
      `The consensus value of ${formatCurrency(consensus)} represents the arithmetic mean of these four approaches${conf === 'high' ? ', and the tight convergence across methods strengthens confidence in this estimate' : conf === 'moderate' ? ', with reasonable agreement across the different approaches' : ', though the wider spread across methods suggests some valuation uncertainty'}.`
  });

  // 4. Value Drivers
  if (positive.length > 0) {
    const driverList = positive.map(f => `• ${f}`).join('\n');
    sections.push({
      title: 'Value Drivers',
      text: `The following factors contribute positively to the enterprise value, supporting premium multiples across the valuation engines:\n\n${driverList}\n\n` +
        (derived.ebitdaAbove18 ? `The EBITDA margin at or above 18% signals operational efficiency that exceeds industry norms, commanding a premium in buyer negotiations. ` : '') +
        (adcGrowth > 0 ? `Census growth demonstrates market demand and referral source strength, a key indicator of sustainable revenue. ` : '') +
        (pl.patientQualityFactor >= 1.05 ? `The patient quality factor of ${pl.patientQualityFactor.toFixed(3)} reflects favorable clinical outcomes and care patterns. ` : '')
    });
  }

  // 5. Risk Factors
  if (negative.length > 0) {
    const riskList = negative.map(f => `• ${f}`).join('\n');
    sections.push({
      title: 'Risk Adjustments',
      text: `The following factors apply downward pressure on valuation multiples, reflecting areas where buyers may discount the enterprise value:\n\n${riskList}\n\n` +
        `These adjustments are standard in hospice M&A transactions and reflect the buyer's risk assessment for this specific operation. A seller addressing these factors prior to sale could improve the achievable transaction price.`
    });
  }

  // 6. Range
  sections.push({
    title: 'Valuation Range',
    text: `The market-adjusted valuation range spans from ${formatCurrency(sensitivities.lowAdj)} (conservative) to ${formatCurrency(sensitivities.highAdj)} (optimistic), with the midpoint at ${formatCurrency(sensitivities.midAdj)}. The final enterprise value of ${formatCurrency(finalValuation)} reflects the consensus estimate after applying market sensitivity adjustments. ` +
      (finalValuation > consensus
        ? `The upward adjustment from the pre-adjustment consensus indicates that the operation's positive characteristics outweigh its risk factors.`
        : finalValuation < consensus
        ? `The downward adjustment from the pre-adjustment consensus reflects the net impact of risk factors identified in the sensitivity analysis.`
        : `The final value aligns with the pre-adjustment consensus, indicating that positive and negative sensitivity factors are balanced.`)
  });

  // 7. Per-ADC
  const perAdc = perAdcBackCalculated;
  const perAdcContext = perAdc >= 70000 ? 'above'
    : perAdc >= 50000 ? 'within'
    : perAdc >= 35000 ? 'at the lower end of'
    : 'below';
  sections.push({
    title: 'Per-Patient Validation',
    text: `As a cross-check, the implied value per average daily census patient is ${formatCurrency(perAdc)}, which falls ${perAdcContext} the typical market range of $40,000–$80,000 per ADC for hospice operations in non-Certificate of Need states. ` +
      (perAdcContext === 'above'
        ? 'This premium per-patient value is supported by the operation\'s strong financial performance and favorable quality indicators.'
        : perAdcContext === 'within'
        ? 'This positioning within the market range supports the reasonableness of the overall valuation.'
        : 'This positioning suggests that scale, margins, or market factors are constraining per-patient value relative to larger operations.')
  });

  // 8. Conclusion
  sections.push({
    title: 'Summary',
    text: `In summary, the enterprise value of ${formatCurrency(finalValuation)} is supported by ${positive.length > 0 ? positive.length + ' positive value driver' + (positive.length > 1 ? 's' : '') : 'the baseline financial metrics'}, validated across four independent methodologies with ${conf} convergence, and cross-checked against per-patient market benchmarks. ` +
      `This valuation provides a defensible basis for ${finalValuation >= consensus ? 'a seller to justify the asking price in negotiations with prospective buyers' : 'a buyer to anchor their offer and negotiate acquisition terms'}, grounded in current market multiples, operational performance, and industry-standard sensitivity analysis.`
  });

  return sections;
}

export default function ValuationNarrative({ pl, sensitivities, consensus, finalValuation, inputs, derived }) {
  const [open, setOpen] = useState(false);
  const sections = buildNarrative(pl, sensitivities, consensus, finalValuation, inputs, derived);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
      >
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <FileText size={20} className="text-teal-600" />
          G. Valuation Narrative Summary
        </h2>
        <ChevronDown
          size={20}
          className={`text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="px-6 pb-6 border-t border-slate-100 pt-4">
          <div className="space-y-5">
            {sections.map((section) => (
              <div key={section.title}>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">
                  {section.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {section.text}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 italic">
              This narrative is generated dynamically from the valuation model inputs and is intended as a discussion aid.
              It does not constitute a formal appraisal or financial opinion. All figures are subject to the assumptions entered above.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * ShareButton.jsx — Dropdown with Copy Link, Download PDF, and Email options.
 * Encodes access level in share URLs for locked sharing.
 */
import { useState, useRef, useEffect } from 'react';
import { Share2, Link, FileDown, Mail, Loader2 } from 'lucide-react';
import { encodeState } from '../utils/urlState.js';

export default function ShareButton({ inputs, accessLevel }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const ref = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function getShareUrl() {
    const encoded = encodeState(inputs, accessLevel);
    return `${window.location.origin}${window.location.pathname}?v=${encoded}`;
  }

  async function handleCopyLink() {
    const url = getShareUrl();
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setOpen(false);
  }

  async function handleDownloadPdf() {
    if (pdfLoading) return;
    setOpen(false);
    setPdfLoading(true);

    try {
      const el = document.getElementById('valuation-content');
      if (!el) return;

      const html2pdf = (await import('html2pdf.js')).default;

      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('PDF generation timed out')), 30000)
      );

      const generate = html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: 'Hospice-Valuation-Report.pdf',
          image: { type: 'jpeg', quality: 0.90 },
          html2canvas: { scale: 1.5, useCORS: true, scrollY: 0, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'] },
        })
        .from(el)
        .save();

      await Promise.race([generate, timeout]);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('PDF generation failed. Try collapsing some sections and retry.');
    } finally {
      setPdfLoading(false);
    }
  }

  function handleEmail() {
    const url = getShareUrl();
    const subject = encodeURIComponent('Hospice Valuation Report — Amerix Medical Consulting');
    const body = encodeURIComponent(
      `Here is the interactive hospice valuation report:\n\n${url}\n\nPowered by Amerix Medical Consulting, LLC`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 border border-slate-500 text-slate-200 hover:bg-slate-700 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
      >
        <Share2 size={16} />
        {copied ? 'Link Copied!' : 'Share'}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Link size={16} className="text-slate-400" />
            Copy Link
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {pdfLoading ? (
              <Loader2 size={16} className="text-slate-400 animate-spin" />
            ) : (
              <FileDown size={16} className="text-slate-400" />
            )}
            {pdfLoading ? 'Generating...' : 'Download PDF'}
          </button>
          <button
            type="button"
            onClick={handleEmail}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Mail size={16} className="text-slate-400" />
            Email Report
          </button>
        </div>
      )}
    </div>
  );
}

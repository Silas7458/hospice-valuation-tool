/**
 * ShareButton.jsx — Dropdown with Copy Link, Download PDF, and Email options.
 * Encodes access level in share URLs for locked sharing.
 */
import { useState, useRef, useEffect } from 'react';
import { Share2, Link, FileDown, Mail, Loader2, X, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { encodeState } from '../utils/urlState.js';

const FROM_EMAIL = 'executive.shelton@gmail.com';

export default function ShareButton({ inputs, accessLevel }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null); // 'success' | 'error' | null
  const [linkExpiry, setLinkExpiry] = useState('unlimited');
  const ref = useRef(null);
  const emailInputRef = useRef(null);

  const EXPIRY_OPTIONS = [
    { value: '24h', label: '24 Hours' },
    { value: '48h', label: '48 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '3mo', label: '3 Months' },
    { value: '12mo', label: '12 Months' },
    { value: 'unlimited', label: 'Unlimited' },
  ];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Focus email input when dialog opens
  useEffect(() => {
    if (emailDialogOpen && emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, [emailDialogOpen]);

  function getShareUrl() {
    const encoded = encodeState(inputs, accessLevel, linkExpiry);
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

  function handleOpenEmailDialog() {
    setOpen(false);
    setRecipientEmail('');
    setSendResult(null);
    setEmailDialogOpen(true);
  }

  async function handleSendEmail() {
    if (!recipientEmail.trim() || sending) return;
    setSending(true);
    setSendResult(null);

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientEmail.trim(),
          shareUrl: getShareUrl(),
        }),
      });

      if (!res.ok) throw new Error('Send failed');
      setSendResult('success');
      setTimeout(() => {
        setEmailDialogOpen(false);
        setSendResult(null);
        setRecipientEmail('');
      }, 2000);
    } catch {
      setSendResult('error');
    } finally {
      setSending(false);
    }
  }

  return (
    <>
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
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
            {/* Link Expiry Selector */}
            <div className="px-4 py-2 border-b border-slate-100">
              <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Link expires in</label>
              <select
                value={linkExpiry}
                onChange={(e) => setLinkExpiry(e.target.value)}
                className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {EXPIRY_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
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
              onClick={handleOpenEmailDialog}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Mail size={16} className="text-slate-400" />
              Share via Email
            </button>
          </div>
        )}
      </div>

      {/* Email Dialog Overlay */}
      {emailDialogOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Dialog Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-slate-800 text-white">
              <div className="flex items-center gap-2">
                <Mail size={18} />
                <span className="font-semibold text-sm">Share via Email</span>
              </div>
              <button
                type="button"
                onClick={() => setEmailDialogOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Dialog Body */}
            <div className="px-5 py-5 space-y-4">
              {/* From confirmation */}
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">From</label>
                <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <Mail size={14} className="text-slate-400" />
                  <span className="text-sm text-slate-700 font-medium">{FROM_EMAIL}</span>
                </div>
              </div>

              {/* Recipient input */}
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">To</label>
                <input
                  ref={emailInputRef}
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendEmail()}
                  placeholder="recipient@example.com"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Subject preview */}
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Subject</label>
                <div className="px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-600">
                  Hospice Valuation Report — Amerix Medical Consulting
                </div>
              </div>

              {/* Link expiry */}
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Link Expires In</label>
                <select
                  value={linkExpiry}
                  onChange={(e) => setLinkExpiry(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {EXPIRY_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status message */}
            {sendResult === 'success' && (
              <div className="mx-5 mb-2 flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm">
                <CheckCircle2 size={16} />
                Email sent successfully!
              </div>
            )}
            {sendResult === 'error' && (
              <div className="mx-5 mb-2 flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm">
                <AlertCircle size={16} />
                Failed to send. Check credentials and try again.
              </div>
            )}

            {/* Dialog Footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => { setEmailDialogOpen(false); setSendResult(null); }}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={!recipientEmail.trim() || sending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <><Loader2 size={14} className="animate-spin" /> Sending...</>
                ) : (
                  <><Send size={14} /> Send Email</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

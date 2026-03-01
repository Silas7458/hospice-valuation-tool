/**
 * ShareButton.jsx — Share dropdown with invite code creation.
 * Creates per-person access codes when sharing via email or link.
 */
import { useState, useRef, useEffect } from 'react';
import { Share2, Link, FileDown, Mail, Loader2, X, Send, CheckCircle2, AlertCircle, Key, User, Copy, Check } from 'lucide-react';
import { encodeState } from '../utils/urlState.js';

const FROM_EMAIL = 'executive.shelton@gmail.com';

export default function ShareButton({ inputs, accessLevel }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('email'); // 'email' | 'link'
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [linkExpiry, setLinkExpiry] = useState('48h');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null); // { type: 'success'|'error', code?, message? }
  const [codeCopied, setCodeCopied] = useState(false);
  const ref = useRef(null);
  const nameInputRef = useRef(null);

  const EXPIRY_OPTIONS = [
    { value: '24h', label: '24 Hours' },
    { value: '48h', label: '48 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '3mo', label: '3 Months' },
    { value: '12mo', label: '12 Months' },
    { value: 'unlimited', label: 'Unlimited' },
  ];

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (dialogOpen && nameInputRef.current) nameInputRef.current.focus();
  }, [dialogOpen]);

  function getShareUrl() {
    const encoded = encodeState(inputs, accessLevel, linkExpiry);
    return `${window.location.origin}${window.location.pathname}?v=${encoded}`;
  }

  function openDialog(mode) {
    setOpen(false);
    setDialogMode(mode);
    setRecipientName('');
    setRecipientEmail('');
    setAccessCode('');
    setResult(null);
    setCodeCopied(false);
    setDialogOpen(true);
  }

  async function handleInvite() {
    if (!recipientName.trim() || sending) return;
    if (dialogMode === 'email' && !recipientEmail.trim()) return;
    setSending(true);
    setResult(null);

    try {
      const body = {
        name: recipientName.trim(),
        expires: linkExpiry,
        shareUrl: getShareUrl(),
      };
      if (recipientEmail.trim()) body.email = recipientEmail.trim();
      if (accessCode.trim()) body.code = accessCode.trim();
      if (dialogMode === 'email') body.sendEmail = true;

      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed');
      }

      const data = await res.json();

      if (dialogMode === 'email') {
        setResult({
          type: data.sent ? 'success' : 'error',
          code: data.code,
          message: data.sent
            ? `Invite sent to ${data.email} with code ${data.code}`
            : `Code ${data.code} created but email failed to send`,
        });
      } else {
        // Link mode — copy the link and show the code
        const url = getShareUrl();
        try { await navigator.clipboard.writeText(url); } catch { /* fallback below */ }
        setResult({
          type: 'success',
          code: data.code,
          message: `Link copied! Access code: ${data.code}`,
        });
      }
    } catch (err) {
      setResult({ type: 'error', message: err.message || 'Something went wrong' });
    } finally {
      setSending(false);
    }
  }

  function copyCode(code) {
    navigator.clipboard.writeText(code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  function handleDownloadPdf() {
    setOpen(false);
    window.print();
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
            <button
              type="button"
              onClick={() => openDialog('link')}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Link size={16} className="text-slate-400" />
              Share Link
            </button>
            <button
              type="button"
              onClick={() => openDialog('email')}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Mail size={16} className="text-slate-400" />
              Share via Email
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-100"
            >
              <FileDown size={16} className="text-slate-400" />
              Download PDF
            </button>
          </div>
        )}
      </div>

      {/* Invite Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-slate-800 text-white">
              <div className="flex items-center gap-2">
                {dialogMode === 'email' ? <Mail size={18} /> : <Link size={18} />}
                <span className="font-semibold text-sm">
                  {dialogMode === 'email' ? 'Send Invite Email' : 'Create Share Link'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-5 space-y-4">
              {/* Recipient Name */}
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                  <User size={10} className="inline mr-1" />Recipient Name
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Jake Smith"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Email (only for email mode) */}
              {dialogMode === 'email' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">From</label>
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <Mail size={14} className="text-slate-400" />
                      <span className="text-sm text-slate-700 font-medium">{FROM_EMAIL}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">To</label>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                      placeholder="recipient@example.com"
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              {/* Access Code */}
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                  <Key size={10} className="inline mr-1" />Access Code
                </label>
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Auto-generated if blank"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono uppercase"
                />
              </div>

              {/* Expiry */}
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Access Expires</label>
                <select
                  value={linkExpiry}
                  onChange={(e) => setLinkExpiry(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {EXPIRY_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Result */}
            {result && (
              <div className={`mx-5 mb-2 px-4 py-3 rounded-lg text-sm ${
                result.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'
              }`}>
                <div className="flex items-start gap-2">
                  {result.type === 'success' ? <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />}
                  <div className="flex-1">
                    <div>{result.message}</div>
                    {result.code && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="font-mono font-bold text-base tracking-wider">{result.code}</span>
                        <button
                          type="button"
                          onClick={() => copyCode(result.code)}
                          className="text-emerald-600 hover:text-emerald-800 transition-colors"
                          title="Copy code"
                        >
                          {codeCopied ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => { setDialogOpen(false); setResult(null); }}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
              >
                {result?.type === 'success' ? 'Done' : 'Cancel'}
              </button>
              {!result?.type && (
                <button
                  type="button"
                  onClick={handleInvite}
                  disabled={!recipientName.trim() || (dialogMode === 'email' && !recipientEmail.trim()) || sending}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <><Loader2 size={14} className="animate-spin" /> {dialogMode === 'email' ? 'Sending...' : 'Creating...'}</>
                  ) : dialogMode === 'email' ? (
                    <><Send size={14} /> Send Invite</>
                  ) : (
                    <><Link size={14} /> Create &amp; Copy Link</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

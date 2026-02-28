/**
 * ShareButton.jsx — Encodes current inputs to URL and copies to clipboard
 * Styled for dark header bar (ghost/outline style)
 */
import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { encodeState } from '../utils/urlState.js';

export default function ShareButton({ inputs }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      const encoded = encodeState(inputs);
      const url = `${window.location.origin}${window.location.pathname}?v=${encoded}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for environments without clipboard API
      const encoded = encodeState(inputs);
      const url = `${window.location.origin}${window.location.pathname}?v=${encoded}`;
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-2 border border-slate-500 text-slate-200 hover:bg-slate-700 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
    >
      <Share2 size={16} />
      {copied ? 'Link Copied!' : 'Share'}
    </button>
  );
}

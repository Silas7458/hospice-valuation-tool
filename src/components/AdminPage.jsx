import { useState, useEffect, useCallback } from 'react';
import { HeartPulse, Shield, Plus, Trash2, Copy, Check, Loader2, ArrowLeft, Clock, User, Mail } from 'lucide-react';

export default function AdminPage({ onBack }) {
  const [adminKey, setAdminKey] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);

  // Create form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [expires, setExpires] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/codes', {
        headers: { Authorization: `Bearer ${adminKey}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCodes(data.codes);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [adminKey]);

  async function handleAdminLogin(e) {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/admin/codes', {
        headers: { Authorization: `Bearer ${adminKey}` },
      });
      if (res.ok) {
        setAuthed(true);
        const data = await res.json();
        setCodes(data.codes);
      } else {
        setAuthError('Invalid admin password');
      }
    } catch {
      setAuthError('Connection failed');
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const body = { name: name.trim() };
      if (email.trim()) body.email = email.trim();
      if (customCode.trim()) body.code = customCode.trim().toUpperCase();
      if (expires) body.expires = expires;

      const res = await fetch('/api/admin/codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminKey}`,
        },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setName('');
        setEmail('');
        setCustomCode('');
        setExpires('');
        fetchCodes();
      }
    } catch { /* ignore */ }
    setCreating(false);
  }

  async function handleRevoke(code) {
    if (!confirm(`Revoke access for ${code}?`)) return;
    await fetch('/api/admin/codes', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminKey}`,
      },
      body: JSON.stringify({ code }),
    });
    fetchCodes();
  }

  function copyCode(code) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  }

  // Admin login screen
  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-full max-w-sm mx-4">
          <div className="text-center mb-8">
            <Shield size={40} className="text-emerald-600 mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-slate-800">Admin Panel</h1>
            <p className="text-sm text-slate-500 mt-1">Access Code Management</p>
          </div>
          <form onSubmit={handleAdminLogin} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Master Password</label>
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Enter admin password"
              autoFocus
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            {authError && <p className="text-sm text-rose-600 mt-2">{authError}</p>}
            <button
              type="submit"
              disabled={!adminKey}
              className="w-full mt-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-40"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={onBack}
              className="w-full mt-2 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              <ArrowLeft size={14} className="inline mr-1 -mt-0.5" />
              Back to Tool
            </button>
          </form>
        </div>
      </div>
    );
  }

  const activeCodes = codes.filter(c => c.active);
  const revokedCodes = codes.filter(c => !c.active);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-800 text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={20} />
            <span className="text-lg font-bold">Access Code Admin</span>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1"
          >
            <ArrowLeft size={14} />
            Back to Tool
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Create Code Form */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Plus size={18} />
            Create Access Code
          </h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                <User size={12} className="inline mr-1" />Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jake Smith"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                <Mail size={12} className="inline mr-1" />Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jake@example.com"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Custom Code</label>
              <input
                type="text"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                placeholder="Auto-generated if blank"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                <Clock size={12} className="inline mr-1" />Expires
              </label>
              <input
                type="date"
                value={expires}
                onChange={(e) => setExpires(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={!name.trim() || creating}
                className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-40 flex items-center gap-2"
              >
                {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Create Code
              </button>
            </div>
          </form>
        </div>

        {/* Active Codes */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">
              Active Codes ({activeCodes.length})
            </h2>
            {loading && <Loader2 size={16} className="text-slate-400 animate-spin" />}
          </div>
          {activeCodes.length === 0 ? (
            <p className="text-sm text-slate-500">No active access codes yet.</p>
          ) : (
            <div className="space-y-3">
              {activeCodes.map((c) => (
                <div key={c.code} className="flex items-center justify-between border border-slate-200 rounded-lg px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-emerald-700">{c.code}</span>
                      <button
                        type="button"
                        onClick={() => copyCode(c.code)}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                        title="Copy code"
                      >
                        {copied === c.code ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <div className="text-sm text-slate-700 font-medium">{c.name}</div>
                    {c.email && <div className="text-xs text-slate-500">{c.email}</div>}
                    <div className="text-xs text-slate-400 mt-1">
                      Created {formatDate(c.created)}
                      {c.expires && <span className="ml-2">· Expires {formatDate(c.expires)}</span>}
                      {c.lastLogin && <span className="ml-2">· Last login {formatDate(c.lastLogin)}</span>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRevoke(c.code)}
                    className="ml-4 p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Revoke access"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revoked Codes */}
        {revokedCodes.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 opacity-60">
            <h2 className="text-lg font-bold text-slate-800 mb-4">
              Revoked ({revokedCodes.length})
            </h2>
            <div className="space-y-2">
              {revokedCodes.map((c) => (
                <div key={c.code} className="flex items-center justify-between border border-slate-200 rounded-lg px-4 py-2">
                  <div>
                    <span className="font-mono text-sm text-slate-400 line-through">{c.code}</span>
                    <span className="text-sm text-slate-500 ml-2">{c.name}</span>
                  </div>
                  <span className="text-xs text-rose-500 font-medium">Revoked</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="text-center text-xs text-slate-400 py-8 border-t border-slate-200 mt-12">
        &copy; 2026 Amerix Medical Consulting, LLC
      </footer>
    </div>
  );
}

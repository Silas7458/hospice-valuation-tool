import { useState } from 'react';
import { HeartPulse, Lock, Loader2 } from 'lucide-react';

export default function LoginPage({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        onLogin();
      } else {
        setError('Invalid access code');
      }
    } catch {
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <HeartPulse size={40} className="text-emerald-600 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-slate-800">Hospice Valuation Tool</h1>
          <p className="text-sm text-slate-500 mt-1">Amerix Medical Consulting, LLC</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <Lock size={14} className="inline mr-1 -mt-0.5" />
            Access Code
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter access code"
            autoFocus
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          {error && <p className="text-sm text-rose-600 mt-2">{error}</p>}
          <button
            type="submit"
            disabled={!password || loading}
            className="w-full mt-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Sign In'}
          </button>
        </form>
        <p className="text-xs text-slate-400 text-center mt-6">&copy; 2026 Amerix Medical Consulting, LLC</p>
      </div>
    </div>
  );
}

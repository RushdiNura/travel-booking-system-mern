import { useState } from 'react';
import { ArrowRightLeft, Loader2 } from 'lucide-react';
import { api } from '../../lib/api.js';

const COMMON_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'ZAR'];

export default function CurrencyConverter({ defaultTo }) {
  const [amount, setAmount] = useState('100');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState(defaultTo || 'EUR');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const convert = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/currency/convert', { params: { amount, from, to } });
      setResult(data.data);
    } catch {
      setError('Conversion is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={convert} className="space-y-2">
      <div className="flex items-center gap-2">
        <input type="number" min="0" className="input" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <select className="input" value={from} onChange={(e) => setFrom(e.target.value)}>
          {COMMON_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <ArrowRightLeft className="h-4 w-4 shrink-0 text-muted dark:text-indigo-300" />
        <select className="input" value={to} onChange={(e) => setTo(e.target.value)}>
          {COMMON_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <button type="submit" className="btn-outline w-full text-sm" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Convert'}
      </button>

      {error && <p className="text-xs text-error">{error}</p>}
      {result && !error && (
        <div className="rounded bg-ivory dark:bg-indigo-950 px-3 py-2 text-sm">
          {result.isLive ? (
            <>
              <span className="font-medium text-indigo-900 dark:text-ivory">
                {result.amount} {result.from} = {result.result?.toFixed(2)} {result.to}
              </span>
              <p className="mt-0.5 text-[11px] text-muted dark:text-indigo-300">Live rate via exchangerate.host</p>
            </>
          ) : (
            <p className="text-xs text-muted dark:text-indigo-300">{result.message}</p>
          )}
        </div>
      )}
    </form>
  );
}

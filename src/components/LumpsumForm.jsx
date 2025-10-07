 'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function LumpsumForm({ schemeCode }) {
  const [amount, setAmount] = useState(100000);
  const [from, setFrom] = useState(new Date().toISOString().split('T')[0]);
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Use returns endpoint to compute simple/lumpsum returns between dates
      const res = await fetch(`/api/scheme/${schemeCode}/returns?from=${from}&to=${to}`);
      const data = await res.json();
      if (res.ok && !data.error) {
        const currentValue = (amount / data.startNAV) * data.endNAV;
        setResult({ invested: amount, currentValue, simpleReturn: data.simpleReturn, annualizedReturn: data.annualizedReturn });
      } else {
        setResult({ error: data.error || 'Unable to compute returns' });
      }
    } catch (err) {
      setResult({ error: 'Failed to compute lumpsum' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass p-6 rounded-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-gray-400 block mb-1">Lumpsum Amount</label>
          <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400 block mb-1">From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded" />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded" />
          </div>
        </div>
        <button className="w-full py-2 bg-accent rounded text-white" disabled={loading}>{loading ? 'Computing...' : 'Compute'}</button>
      </form>

      {result && (
        <div className="mt-4 space-y-2">
          {result.error ? (
            <p className="text-red-400">{result.error}</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="glass p-4 rounded">
                <p className="text-sm text-gray-400">Invested</p>
                <p className="font-semibold">₹{result.invested.toLocaleString()}</p>
              </div>
              <div className="glass p-4 rounded">
                <p className="text-sm text-gray-400">Current Value</p>
                <p className="font-semibold">₹{Math.round(result.currentValue).toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function SIPForm({ schemeCode }) {
  const [formData, setFormData] = useState({
    amount: 5000,
    frequency: 'monthly',
    from: new Date().toISOString().split('T')[0],
    to: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/scheme/${schemeCode}/sip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        // map timeline dates to chart-friendly shape
        if (data.timeline) {
          data.chartData = data.timeline.map(t => ({ date: t.date, value: t.value }));
        }
        setResult(data);
      } else {
        setError(data.error || 'Failed to calculate SIP returns');
      }
    } catch (err) {
      setError('Failed to calculate SIP returns');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-8">
      {/* Input Form */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 rounded-xl space-y-6"
        onSubmit={handleSubmit}
      >
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Monthly Investment</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                min="500"
                className="w-full pl-8 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-accent/50"
                required
              />
            </div>

            {/* Export CSV */}
            {result.timeline && result.timeline.length > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    const headers = ['date','invested','nav','units','cumulativeUnits','value','skipped'];
                    const rows = result.timeline.map(t => headers.map(h => t[h] ?? '').join(','));
                    const csv = [headers.join(','), ...rows].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `sip_${schemeCode}_${formData.from}_${formData.to}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10"
                >
                  Download CSV
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Frequency</label>
            <select
              name="frequency"
              value={formData.frequency}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-accent/50"
              required
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Start Date</label>
            <input
              type="date"
              name="from"
              value={formData.from}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-accent/50"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">End Date</label>
            <input
              type="date"
              name="to"
              value={formData.to}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-accent/50"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-lg font-medium transition-colors ${
            loading
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-accent hover:bg-accent/90'
          }`}
        >
          {loading ? 'Calculating...' : 'Calculate Returns'}
        </button>

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}
      </motion.form>

      {/* Results */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass p-4 rounded-xl">
                <p className="text-sm text-gray-400 mb-1">Total Investment</p>
                <p className="text-xl font-semibold">₹{result.totalInvested.toLocaleString()}</p>
              </div>
              <div className="glass p-4 rounded-xl">
                <p className="text-sm text-gray-400 mb-1">Current Value</p>
                <p className="text-xl font-semibold">₹{result.currentValue.toLocaleString()}</p>
              </div>
              <div className="glass p-4 rounded-xl">
                <p className="text-sm text-gray-400 mb-1">Total Return</p>
                <p className={`text-xl font-semibold ${
                  result.absoluteReturn >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {result.absoluteReturn.toFixed(2)}%
                </p>
              </div>
              <div className="glass p-4 rounded-xl">
                <p className="text-sm text-gray-400 mb-1">XIRR</p>
                <p className={`text-xl font-semibold ${
                  result.annualizedReturn >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {result.annualizedReturn.toFixed(2)}%
                </p>
              </div>
            </div>

            {/* Investment Growth Chart */}
            {result.chartData && result.chartData.length > 0 && (
              <div className="glass p-6 rounded-xl">
                <h3 className="text-lg font-semibold mb-4">Investment Growth</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={result.chartData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: '#9ca3af' }}
                        tickFormatter={(date) => new Date(date).toLocaleDateString()}
                      />
                      <YAxis tick={{ fill: '#9ca3af' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(17, 24, 39, 0.9)',
                          border: 'none',
                          borderRadius: '0.5rem',
                          color: '#fff'
                        }}
                        formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Value']}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#2563eb"
                        fill="#2563eb"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

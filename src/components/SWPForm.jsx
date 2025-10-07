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

export default function SWPForm({ schemeCode }) {
  const [formData, setFormData] = useState({
    initialInvestment: 1000000,
    withdrawalAmount: 10000,
    frequency: 'monthly',
    from: new Date().toISOString().split('T')[0],
    to: new Date(new Date().setFullYear(new Date().getFullYear() + 5)).toISOString().split('T')[0]
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculateSWP = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch NAV data for the date range
      const response = await fetch(`/api/scheme/${schemeCode}`);
      if (!response.ok) {
        throw new Error('Failed to fetch scheme data');
      }
      
      const schemeData = await response.json();
      const navData = schemeData.data;

      // Sort NAV data by date
      const sortedNAVs = [...navData].sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Find initial NAV
      const startDate = new Date(formData.from);
      const endDate = new Date(formData.to);
      const initialNAV = sortedNAVs.find(nav => new Date(nav.date) >= startDate)?.nav;

      if (!initialNAV) {
        throw new Error('No NAV data available for the start date');
      }

      // Calculate initial units
      let remainingUnits = formData.initialInvestment / parseFloat(initialNAV);
      let withdrawalHistory = [];
      let currentDate = startDate;

      // Simulate withdrawals
      while (currentDate <= endDate) {
        const navEntry = sortedNAVs.find(nav => new Date(nav.date) >= currentDate);
        if (navEntry) {
          const nav = parseFloat(navEntry.nav);
          const unitsToWithdraw = formData.withdrawalAmount / nav;
          
          if (unitsToWithdraw > remainingUnits) {
            // Not enough units for withdrawal
            withdrawalHistory.push({
              date: navEntry.date,
              remainingValue: (remainingUnits * nav).toFixed(2),
              remainingUnits: remainingUnits.toFixed(4),
              status: 'insufficient_funds'
            });
            break;
          }

          remainingUnits -= unitsToWithdraw;
          withdrawalHistory.push({
            date: navEntry.date,
            withdrawalAmount: formData.withdrawalAmount,
            unitsWithdrawn: unitsToWithdraw.toFixed(4),
            remainingUnits: remainingUnits.toFixed(4),
            remainingValue: (remainingUnits * nav).toFixed(2),
            nav: nav.toFixed(2)
          });
        }

        // Move to next withdrawal date
        switch (formData.frequency) {
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
          case 'quarterly':
            currentDate.setMonth(currentDate.getMonth() + 3);
            break;
          case 'yearly':
            currentDate.setFullYear(currentDate.getFullYear() + 1);
            break;
        }
      }

      const lastEntry = withdrawalHistory[withdrawalHistory.length - 1];
      const totalWithdrawals = withdrawalHistory.reduce((sum, entry) => 
        sum + (entry.withdrawalAmount || 0), 0);

      setResult({
        initialInvestment: formData.initialInvestment,
        withdrawalHistory,
        totalWithdrawals,
        remainingValue: parseFloat(lastEntry.remainingValue),
        remainingUnits: parseFloat(lastEntry.remainingUnits),
        isExhausted: lastEntry.status === 'insufficient_funds'
      });

    } catch (err) {
      setError(err.message || 'Failed to calculate SWP');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    calculateSWP();
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
            <label className="text-sm text-gray-400">Initial Investment</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
              <input
                type="number"
                name="initialInvestment"
                value={formData.initialInvestment}
                onChange={handleInputChange}
                min="100000"
                className="w-full pl-8 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-accent/50"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Monthly Withdrawal</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
              <input
                type="number"
                name="withdrawalAmount"
                value={formData.withdrawalAmount}
                onChange={handleInputChange}
                min="1000"
                className="w-full pl-8 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-accent/50"
                required
              />
            </div>
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
          {loading ? 'Calculating...' : 'Calculate SWP'}
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
                <p className="text-sm text-gray-400 mb-1">Initial Investment</p>
                <p className="text-xl font-semibold">₹{result.initialInvestment.toLocaleString()}</p>
              </div>
              <div className="glass p-4 rounded-xl">
                <p className="text-sm text-gray-400 mb-1">Total Withdrawals</p>
                <p className="text-xl font-semibold">₹{result.totalWithdrawals.toLocaleString()}</p>
              </div>
              <div className="glass p-4 rounded-xl">
                <p className="text-sm text-gray-400 mb-1">Remaining Value</p>
                <p className="text-xl font-semibold">₹{result.remainingValue.toLocaleString()}</p>
              </div>
              <div className="glass p-4 rounded-xl">
                <p className="text-sm text-gray-400 mb-1">Remaining Units</p>
                <p className="text-xl font-semibold">{result.remainingUnits.toFixed(3)}</p>
              </div>
            </div>

            {/* Investment Growth Chart */}
            {result.withdrawalHistory && result.withdrawalHistory.length > 0 && (
              <div className="glass p-6 rounded-xl">
                <h3 className="text-lg font-semibold mb-4">Portfolio Value Over Time</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={result.withdrawalHistory}
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
                        formatter={(value) => [`₹${parseFloat(value).toLocaleString()}`, 'Value']}
                      />
                      <Area
                        type="monotone"
                        dataKey="remainingValue"
                        stroke="#2563eb"
                        fill="#2563eb"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {result.isExhausted && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400">
                  Note: The investment will be exhausted before the end date with the current withdrawal rate.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

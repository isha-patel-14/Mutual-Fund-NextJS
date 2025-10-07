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

export default function LumpsumCalculator({ schemeCode }) {
  const [formData, setFormData] = useState({
    amount: 100000,
    investmentDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0],
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculateReturns = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch NAV data for the scheme
      const response = await fetch(`/api/scheme/${schemeCode}/returns?from=${formData.investmentDate}&to=${new Date().toISOString().split('T')[0]}`);
      const data = await response.json();

      if (response.ok) {
        const investmentAmount = parseFloat(formData.amount);
        const units = investmentAmount / data.startNAV;
        const currentValue = units * data.endNAV;
        const absoluteReturn = ((currentValue - investmentAmount) / investmentAmount) * 100;
        const years = data.durationDays / 365;
        const annualizedReturn = (Math.pow((currentValue / investmentAmount), (1 / years)) - 1) * 100;

        setResult({
          investmentAmount,
          currentValue,
          absoluteReturn,
          annualizedReturn,
          units,
          startDate: data.startDate,
          endDate: data.endDate,
          startNAV: data.startNAV,
          endNAV: data.endNAV
        });
      } else {
        setError(data.error || 'Failed to calculate returns');
      }
    } catch (err) {
      setError('Failed to calculate returns');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    calculateReturns();
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
            <label className="text-sm text-gray-400">Investment Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                min="1000"
                className="w-full pl-8 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-accent/50"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Investment Date</label>
            <input
              type="date"
              name="investmentDate"
              value={formData.investmentDate}
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
                <p className="text-sm text-gray-400 mb-1">Investment</p>
                <p className="text-xl font-semibold">₹{result.investmentAmount.toLocaleString()}</p>
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

            {/* Additional Details */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass p-6 rounded-xl"
            >
              <h3 className="text-lg font-semibold mb-4">Investment Details</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Units Allotted</p>
                  <p className="text-lg">{result.units.toFixed(3)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Investment Period</p>
                  <p className="text-lg">
                    {new Date(result.startDate).toLocaleDateString()} to{' '}
                    {new Date(result.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Purchase NAV</p>
                  <p className="text-lg">₹{result.startNAV.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Current NAV</p>
                  <p className="text-lg">₹{result.endNAV.toFixed(2)}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

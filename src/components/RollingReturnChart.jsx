'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine
} from 'recharts';

export default function RollingReturnChart({ schemeCode }) {
  const [rollingReturns, setRollingReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('1'); // in years
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    calculateRollingReturns();
  }, [schemeCode, period]);

  const calculateRollingReturns = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch NAV data
      const response = await fetch(`/api/scheme/${schemeCode}`);
      if (!response.ok) {
        throw new Error('Failed to fetch scheme data');
      }

      const data = await response.json();
      const navData = data.data.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Calculate rolling returns
      const periodInDays = parseInt(period) * 365;
      const returns = [];
      let minReturn = Infinity;
      let maxReturn = -Infinity;
      let sumReturns = 0;
      let countReturns = 0;

      for (let i = periodInDays; i < navData.length; i++) {
        const endNAV = parseFloat(navData[i].nav);
        const startNAV = parseFloat(navData[i - periodInDays].nav);
        
        if (endNAV > 0 && startNAV > 0) {
          const returnValue = (Math.pow(endNAV / startNAV, 1 / period) - 1) * 100;
          
          returns.push({
            date: navData[i].date,
            return: parseFloat(returnValue.toFixed(2))
          });

          minReturn = Math.min(minReturn, returnValue);
          maxReturn = Math.max(maxReturn, returnValue);
          sumReturns += returnValue;
          countReturns++;
        }
      }

      // Calculate statistics
      const avgReturn = sumReturns / countReturns;
      const sortedReturns = returns.map(r => r.return).sort((a, b) => a - b);
      const medianReturn = sortedReturns[Math.floor(sortedReturns.length / 2)];
      
      setRollingReturns(returns);
      setStatistics({
        min: minReturn.toFixed(2),
        max: maxReturn.toFixed(2),
        avg: avgReturn.toFixed(2),
        median: medianReturn.toFixed(2)
      });
    } catch (err) {
      setError('Failed to calculate rolling returns');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const periodOptions = [
    { value: '1', label: '1 Year' },
    { value: '3', label: '3 Years' },
    { value: '5', label: '5 Years' },
    { value: '10', label: '10 Years' }
  ];

  if (loading) {
    return (
      <div className="h-96 glass rounded-xl shimmer" />
    );
  }

  if (error) {
    return (
      <div className="text-red-400 text-center py-4">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selection */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Rolling Returns Analysis</h3>
        <div className="flex space-x-2">
          {periodOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setPeriod(option.value)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                period === option.value
                  ? 'bg-accent text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-4 gap-4">
          <div className="glass p-4 rounded-xl">
            <p className="text-sm text-gray-400 mb-1">Minimum Return</p>
            <p className={`text-xl font-semibold ${
              parseFloat(statistics.min) >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {statistics.min}%
            </p>
          </div>
          <div className="glass p-4 rounded-xl">
            <p className="text-sm text-gray-400 mb-1">Maximum Return</p>
            <p className={`text-xl font-semibold ${
              parseFloat(statistics.max) >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {statistics.max}%
            </p>
          </div>
          <div className="glass p-4 rounded-xl">
            <p className="text-sm text-gray-400 mb-1">Average Return</p>
            <p className={`text-xl font-semibold ${
              parseFloat(statistics.avg) >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {statistics.avg}%
            </p>
          </div>
          <div className="glass p-4 rounded-xl">
            <p className="text-sm text-gray-400 mb-1">Median Return</p>
            <p className={`text-xl font-semibold ${
              parseFloat(statistics.median) >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {statistics.median}%
            </p>
          </div>
        </div>
      )}

      {/* Rolling Returns Chart */}
      <div className="glass p-6 rounded-xl">
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rollingReturns}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#9ca3af' }}
                tickFormatter={(date) => new Date(date).toLocaleDateString()}
              />
              <YAxis
                tick={{ fill: '#9ca3af' }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(17, 24, 39, 0.9)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: '#fff'
                }}
                formatter={(value) => [`${value}%`, `${period}Y Rolling Return`]}
              />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
              <Line
                type="monotone"
                dataKey="return"
                stroke="#f97316"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Information Box */}
      <div className="glass p-6 rounded-xl text-sm text-gray-400">
        <h4 className="font-semibold text-white mb-2">Understanding Rolling Returns</h4>
        <p>
          Rolling returns show the fund's performance over a continuous series of periods,
          providing a more comprehensive view of returns than point-to-point returns.
          They help eliminate the recency bias and give a better understanding of the
          fund's consistency in performance.
        </p>
      </div>
    </div>
  );
}

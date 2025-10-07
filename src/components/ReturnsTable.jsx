'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function ReturnsTable({ schemeCode }) {
  const [returns, setReturns] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReturns = async () => {
      try {
        const periods = ['1m', '3m', '6m', '1y'];
        const results = await Promise.all(
          periods.map(period =>
            fetch(`/api/scheme/${schemeCode}/returns?period=${period}`)
              .then(res => res.json())
          )
        );

        const returnsData = {};
        periods.forEach((period, index) => {
          returnsData[period] = results[index];
        });

        setReturns(returnsData);
      } catch (error) {
        console.error('Error fetching returns:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReturns();
  }, [schemeCode]);

  const periodLabels = {
    '1m': '1 Month',
    '3m': '3 Months',
    '6m': '6 Months',
    '1y': '1 Year'
  };

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/10">
        {loading ? (
          // Loading skeletons
          <>
            {Object.keys(periodLabels).map(period => (
              <div key={period} className="p-4 space-y-2">
                <div className="h-4 w-20 bg-white/5 rounded shimmer" />
                <div className="h-6 w-16 bg-white/5 rounded shimmer" />
              </div>
            ))}
          </>
        ) : (
          // Returns data
          <>
            {Object.entries(returns).map(([period, data], index) => (
              <motion.div
                key={period}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 text-center"
              >
                <p className="text-sm text-gray-400 mb-1">
                  {periodLabels[period]}
                </p>
                {data.error ? (
                  <p className="text-red-400 text-sm">No data</p>
                ) : (
                  <p className={`text-lg font-semibold ${
                    data.simpleReturn >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {data.simpleReturn.toFixed(2)}%
                  </p>
                )}
              </motion.div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

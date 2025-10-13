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
  ResponsiveContainer
} from 'recharts';
import { RiLineChartLine, RiCalendarLine, RiMoneyDollarCircleLine } from 'react-icons/ri';
import ReturnsTable from '@/components/ReturnsTable';
import SIPForm from '@/components/SIPForm';
import LumpsumCalculator from '@/components/LumpsumCalculator';
import SWPForm from '@/components/SWPForm';
import RollingReturnChart from '@/components/RollingReturnChart';
import Loader from '@/components/Loader';

export default function SchemePage({ params }) {
  const { code } = params;
  const [schemeData, setSchemeData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, sip, lumpsum, swp

  useEffect(() => {
    const fetchSchemeData = async () => {
      try {
        const response = await fetch(`/api/scheme/${code}`);
        const data = await response.json();
        setSchemeData(data);

        // Prepare chart data (last 1 year)
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        
        const navData = data.data
          .filter(item => new Date(item.date) >= oneYearAgo)
          .map(item => ({
            date: item.date,
            nav: parseFloat(item.nav)
          }))
          .reverse();

        setChartData(navData);
      } catch (error) {
        console.error('Error fetching scheme data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchemeData();
  }, [code]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Loader label="Fetching scheme & NAV history..." height={280} />
      </div>
    );
  }

  if (!schemeData) {
    return <div>Failed to load scheme data</div>;
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: RiLineChartLine },
    { id: 'sip', label: 'SIP Calculator', icon: RiCalendarLine },
    { id: 'lumpsum', label: 'Lumpsum', icon: RiMoneyDollarCircleLine },
    { id: 'swp', label: 'SWP Simulator', icon: RiMoneyDollarCircleLine }
  ];

  return (
    <div className="space-y-8">
      {/* Scheme Header */}
      <div className="space-y-4">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold"
        >
          {schemeData.meta.scheme_name}
        </motion.h1>
        <p className="text-gray-400">{schemeData.meta.fund_house}</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-accent text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* NAV Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-6 rounded-xl"
          >
            <h2 className="text-xl font-semibold mb-6">NAV History (1 Year)</h2>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
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
                    formatter={(value) => [`₹${value}`, 'NAV']}
                  />
                  <Line
                    type="monotone"
                    dataKey="nav"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Returns Table */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Historical Returns</h2>
            <ReturnsTable schemeCode={code} />
          </div>

          {/* Rolling Returns Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-semibold">Rolling Returns</h2>
            <RollingReturnChart schemeCode={code} />
          </motion.div>

          {/* Scheme Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid md:grid-cols-2 gap-6"
          >
            <div className="glass p-6 rounded-xl space-y-4">
              <h2 className="text-xl font-semibold">Scheme Details</h2>
              <div className="space-y-2">
                <p className="flex justify-between">
                  <span className="text-gray-400">Category</span>
                  <span>{schemeData.meta.scheme_category}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-400">Type</span>
                  <span>{schemeData.meta.scheme_type}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-400">Latest NAV</span>
                  <span>₹{parseFloat(schemeData.data[0].nav).toFixed(2)}</span>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* SIP Calculator Tab */}
      {activeTab === 'sip' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <SIPForm schemeCode={code} />
        </motion.div>
      )}

      {/* Lumpsum Calculator Tab */}
      {activeTab === 'lumpsum' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
            <LumpsumCalculator schemeCode={code} />
        </motion.div>
      )}
        {activeTab === 'swp' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <SWPForm schemeCode={code} />
          </motion.div>
        )}
    </div>
  );
}

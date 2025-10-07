'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { RiLineChartLine, RiMoneyDollarCircleLine, RiShieldStarLine } from 'react-icons/ri';

export default function Home() {
  const features = [
    {
      icon: RiLineChartLine,
      title: "Advanced Analytics",
      description: "Track fund performance with interactive charts and rolling returns analysis"
    },
    {
      icon: RiMoneyDollarCircleLine,
      title: "Investment Planning",
      description: "Calculate returns for SIP, Lumpsum, and SWP investments"
    },
    {
      icon: RiShieldStarLine,
      title: "Smart Insights",
      description: "Get detailed fund information and compare performance metrics"
    }
  ];

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="relative text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto space-y-6"
        >
          <h1 className="text-5xl md:text-6xl font-bold gradient-text pb-4">
            Invest Smarter with FundVision
          </h1>
          <p className="text-xl text-gray-300">
            Your intelligent companion for mutual fund analysis and investment planning
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href="/funds"
              className="inline-block px-8 py-3 bg-accent text-white rounded-full font-medium hover:bg-accent/90 transition-colors"
            >
              Explore Funds
            </Link>
          </motion.div>
        </motion.div>

        {/* Floating graphics */}
        <motion.div
          className="absolute top-0 left-0 w-full h-full -z-10 opacity-20"
          animate={{
            background: [
              'radial-gradient(circle at 20% 20%, #f97316 0%, transparent 50%)',
              'radial-gradient(circle at 80% 80%, #2563eb 0%, transparent 50%)',
              'radial-gradient(circle at 20% 80%, #f97316 0%, transparent 50%)',
            ]
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </section>

      {/* Features Section */}
      <section className="grid md:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2 }}
            className="glass p-6 rounded-2xl card-hover"
          >
            <feature.icon className="w-12 h-12 text-accent mb-4" />
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-gray-300">{feature.description}</p>
          </motion.div>
        ))}
      </section>

      {/* Info Section */}
      <section className="space-y-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="glass p-8 rounded-2xl"
        >
          <h2 className="text-3xl font-bold mb-6 gradient-text">
            Understanding Mutual Funds
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-accent">What are Mutual Funds?</h3>
              <p className="text-gray-300">
                Mutual funds pool money from multiple investors to invest in a diversified portfolio
                of stocks, bonds, or other securities. Professional fund managers handle these
                investments to help achieve specific financial goals.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-accent">Why Invest in Mutual Funds?</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Professional Management</li>
                <li>Diversification</li>
                <li>Accessibility</li>
                <li>Liquidity</li>
                <li>Regulated Investment Vehicle</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

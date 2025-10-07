'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { RiArrowRightLine } from 'react-icons/ri';

export default function FundCard({ fund }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="glass p-6 rounded-xl card-hover relative overflow-hidden group"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-accent via-transparent to-primary" />

      {/* Content */}
      <div className="relative z-10">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-accent transition-colors">
          {fund.schemeName}
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          {fund.fundHouse}
        </p>
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="text-gray-400">Scheme Code: </span>
            <span className="text-gray-300">{fund.schemeCode}</span>
          </div>
          <Link 
            href={`/scheme/${fund.schemeCode}`}
            className="flex items-center text-accent hover:text-white transition-colors"
          >
            <span className="mr-1">View Details</span>
            <RiArrowRightLine className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

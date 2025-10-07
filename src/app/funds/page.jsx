'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiSearchLine, RiFilter3Line } from 'react-icons/ri';
import FundCard from '@/components/FundCard';

export default function FundsPage() {
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFundHouse, setSelectedFundHouse] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch funds data
  useEffect(() => {
    const fetchFunds = async () => {
      try {
        const response = await fetch('/api/mf');
        const data = await response.json();
        setFunds(data);
      } catch (error) {
        console.error('Error fetching funds:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFunds();
  }, []);

  // Get unique categories and fund houses
  const categories = ['all', ...new Set(funds.map(fund => fund.category || 'Uncategorized'))].sort();
  const fundHouses = ['all', ...new Set(funds.map(fund => fund.fundHouse))].sort();

  // Filter funds based on search and filters
  const filteredFunds = funds.filter(fund => {
    const matchesSearch = fund.schemeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fund.fundHouse.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || fund.category === selectedCategory;
    const matchesFundHouse = selectedFundHouse === 'all' || fund.fundHouse === selectedFundHouse;
    
    return matchesSearch && matchesCategory && matchesFundHouse;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold gradient-text"
        >
          Explore Mutual Funds
        </motion.h1>
        <p className="text-gray-400">
          Discover and analyze a wide range of mutual funds
        </p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <RiSearchLine className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by fund name or AMC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-accent/50 transition-colors"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
          >
            <RiFilter3Line className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="glass p-4 rounded-lg space-y-4"
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-accent/50"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Fund House</label>
                  <select
                    value={selectedFundHouse}
                    onChange={(e) => setSelectedFundHouse(e.target.value)}
                    className="w-full p-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-accent/50"
                  >
                    {fundHouses.map(house => (
                      <option key={house} value={house}>
                        {house === 'all' ? 'All Fund Houses' : house}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Funds Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 glass rounded-xl shimmer" />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredFunds.map((fund, index) => (
              <FundCard
                key={fund.schemeCode}
                fund={fund}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* No results message */}
      {!loading && filteredFunds.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <p className="text-gray-400">No funds match your search criteria</p>
        </motion.div>
      )}
    </div>
  );
}

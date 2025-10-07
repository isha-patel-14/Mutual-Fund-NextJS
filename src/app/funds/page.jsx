
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiSearchLine, RiFilter3Line } from 'react-icons/ri';
import FundCard from '@/components/FundCard';
import Loader from '@/components/Loader';

export default function FundsPage() {
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [codeSearch, setCodeSearch] = useState('');
  const [serverError, setServerError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFundHouse, setSelectedFundHouse] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Fetch funds data with debounce
  const searchTimeout = useRef();

  // hydrate favorites
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('mf_favorites') || '[]');
      setFavorites(new Set(saved));
    } catch {}
  }, []);

  // persist favorites
  useEffect(() => {
    try { localStorage.setItem('mf_favorites', JSON.stringify(Array.from(favorites))); } catch {}
  }, [favorites]);

  const toggleFavorite = (schemeCode) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(schemeCode)) next.delete(schemeCode); else next.add(schemeCode);
      return next;
    });
  };

  // Fetch one page
  const fetchPage = async ({ reset = false } = {}) => {
    try {
      setLoading(true);
      setServerError(null);

      const params = new URLSearchParams();
      if (codeSearch) {
        params.set('code', codeSearch);
        params.set('limit', '50');
        params.set('offset', reset ? '0' : String(offset));
      } else {
        if (searchTerm) params.set('q', searchTerm);
        params.set('limit', '24');
        params.set('offset', reset ? '0' : String(offset));
      }
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (selectedFundHouse !== 'all') params.set('fundHouse', selectedFundHouse);

      const response = await fetch(`/api/mf?${params.toString()}`);
      if (!response.ok) {
        const body = await response.text();
        console.error('/api/mf failed:', response.status, body);
        setServerError('Server error fetching funds — please try again');
        if (reset) setFunds([]);
        return;
      }
      const data = await response.json();
      if (data?.error) {
        console.error('/api/mf error:', data.error, data.detail || '');
        setServerError(data.detail ? `${data.error}: ${data.detail}` : data.error);
        if (reset) setFunds([]);
        return;
      }

      const incoming = Array.isArray(data.results) ? data.results : [];
      setHasMore((reset ? 0 : offset) + incoming.length < (data.count || 0));
      setFunds(prev => reset ? incoming : [...prev, ...incoming]);
      setOffset(prev => reset ? incoming.length : prev + incoming.length);
      setServerError(null);
    } catch (error) {
      console.error('Error fetching funds:', error);
      setServerError('Failed to fetch funds — network error');
      if (reset) setFunds([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced fetch/reset on changes
  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setOffset(0);
      fetchPage({ reset: true });
    }, 300);
    return () => clearTimeout(searchTimeout.current);
  }, [searchTerm, codeSearch, selectedCategory, selectedFundHouse]);

  // Categories and fund houses from current page
  const categories = ['all', ...new Set(funds.map(fund => fund.schemeCategory || 'Uncategorized'))].sort();
  const fundHouses = ['all', ...new Set(funds.map(fund => fund.fundHouse || 'Unknown'))].sort();

  // Local filter including favoritesOnly
  const filteredFunds = funds.filter(fund => {
    if (!fund) return false;
    const name = (fund.schemeName || '').toLowerCase();
    const house = (fund.fundHouse || '').toLowerCase();
    const matchesSearch = searchTerm ? (name.includes(searchTerm.toLowerCase()) || house.includes(searchTerm.toLowerCase())) : true;
    const matchesCategory = selectedCategory === 'all' || (fund.schemeCategory || '') === selectedCategory;
    const matchesFundHouse = selectedFundHouse === 'all' || (fund.fundHouse || '') === selectedFundHouse;
    const matchesFav = !favoritesOnly || favorites.has(fund.schemeCode);
    return matchesSearch && matchesCategory && matchesFundHouse && matchesFav;
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
        <p className="text-gray-400">Discover and analyze a wide range of mutual funds</p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="grid md:grid-cols-3 gap-4 items-center">
          <div className="relative md:col-span-2">
            <RiSearchLine className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by fund name or AMC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>

          <div className="relative flex items-center gap-3">
            <input
              type="text"
              placeholder="Search by code (e.g. 119027)"
              value={codeSearch}
              onChange={(e) => setCodeSearch(e.target.value)}
              className="w-full pl-3 pr-10 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-accent/50"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <RiFilter3Line className="w-5 h-5" />
            </button>
            <label className="flex items-center gap-2 text-sm text-gray-300 whitespace-nowrap">
              <input type="checkbox" checked={favoritesOnly} onChange={(e) => setFavoritesOnly(e.target.checked)} />
              Favorites only
            </label>
          </div>
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

        {serverError && (
          <div className="text-center text-sm text-red-400">{serverError}</div>
        )}
      </div>

      {/* Funds Grid */}
      {loading ? (
        <div className="flex items-center justify-center">
          <Loader label="Loading funds..." height={220} />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredFunds.map((fund) => (
              <FundCard
                key={fund.schemeCode}
                fund={fund}
                isFavorite={favorites.has(fund.schemeCode)}
                onToggleFavorite={() => toggleFavorite(fund.schemeCode)}
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

      {/* Load more */}
      {!loading && filteredFunds.length > 0 && hasMore && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => fetchPage({ reset: false })}
            className="px-6 py-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Navbar />
        {/* Animated ambient backdrop */}
        <div className="fixed inset-0 -z-10 animated-backdrop" />
        <AnimatePresence mode="wait">
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="pt-20 min-h-screen"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </div>
          </motion.main>
        </AnimatePresence>
      </body>
    </html>
  );
}

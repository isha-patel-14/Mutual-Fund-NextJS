'use client';

import { motion } from 'framer-motion';

export default function Loader({ label = 'Loading...', height = 240 }) {
  const dots = [0, 1, 2, 3];
  return (
    <div className="glass rounded-xl p-6 flex flex-col items-center justify-center" style={{ height }}>
      <div className="relative w-28 h-28">
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{ boxShadow: '0 0 0 2px rgba(255,255,255,0.08) inset' }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
        />
        {dots.map((i) => (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2 + i * 0.4, ease: 'linear' }}
            style={{ width: 112 - i * 18, height: 112 - i * 18, borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <motion.span
              className="block w-2.5 h-2.5 rounded-full"
              style={{ background: 'rgb(var(--accent))' }}
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 2 + i * 0.4, ease: 'linear' }}
            />
          </motion.span>
        ))}
      </div>
      <p className="mt-4 text-sm text-gray-300">{label}</p>
    </div>
  );
}

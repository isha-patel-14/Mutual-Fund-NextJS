// Simple in-memory cache with TTL
const schemeCache = new Map();
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

export async function GET(request, { params }) {
  const { code } = params;

  try {
    // Check cache
    const cached = schemeCache.get(code);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return Response.json(cached.data);
    }

    // Fetch fresh data
    const response = await fetch(`https://api.mfapi.in/mf/${code}`);
    if (!response.ok) {
      throw new Error('Failed to fetch scheme data');
    }

    const data = await response.json();

    // Update cache
    schemeCache.set(code, {
      data,
      timestamp: Date.now()
    });

    // Clean up old cache entries (optional)
    if (schemeCache.size > 1000) { // Limit cache size
      const oldestEntry = [...schemeCache.entries()]
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0];
      if (oldestEntry) {
        schemeCache.delete(oldestEntry[0]);
      }
    }

    return Response.json(data);
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch scheme data' },
      { status: 500 }
    );
  }
}

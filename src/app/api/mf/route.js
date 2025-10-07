// Simple in-memory cache with TTL
let cache = {
  data: null,
  lastFetched: null,
  ttl: 12 * 60 * 60 * 1000 // 12 hours in milliseconds
};

export async function GET() {
  try {
    // Check if we have valid cached data
    if (
      cache.data &&
      cache.lastFetched &&
      Date.now() - cache.lastFetched < cache.ttl
    ) {
      return Response.json(cache.data);
    }

    // Fetch fresh data
    const response = await fetch('https://api.mfapi.in/mf');
    if (!response.ok) {
      throw new Error('Failed to fetch mutual funds data');
    }

    const data = await response.json();

    // Update cache
    cache = {
      data,
      lastFetched: Date.now(),
      ttl: cache.ttl
    };

    return Response.json(data);
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch mutual funds data' },
      { status: 500 }
    );
  }
}

// Simple in-memory cache with TTL
// Simple in-memory cache with TTL and search helpers
let cache = {
  data: null,
  lastFetched: null,
  ttl: 12 * 60 * 60 * 1000 // 12 hours
};

function trimScheme(s) {
  // Keep only fields needed for listing to reduce payload
  const name = s.schemeName || '';
  return {
    schemeName: name,
    schemeCode: s.schemeCode,
    fundHouse: s.fundHouse || (name.split('-')[0] || 'Unknown'),
    schemeCategory: s.schemeCategory || null,
    schemeType: s.schemeType || null
  };
}

export async function GET(request) {
  try {
    // Check cache
    if (cache.data && cache.lastFetched && Date.now() - cache.lastFetched < cache.ttl) {
      // serve from cache (but may still apply query filters below)
    } else {
      // Use canonical MFAPI endpoint with proper headers and timeout
      const url = 'https://api.mfapi.in/mf';
      let response = null;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        const r = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; MutualFundExplorer/1.0)'  
          },
          signal: controller.signal,
          cache: 'no-store' // Bypass cache to avoid stale data
        });        clearTimeout(timeoutId);
        
        if (!r || !r.ok) {
          const body = await r?.text().catch(() => '<no-body>');
          const status = r?.status || 'unknown';
          console.error(`MFAPI returned ${status} status: ${body}`);
          throw new Error(`Upstream returned ${status} status`);
        }
        response = r;
      } catch (err) {
        console.error('Failed to fetch mutual funds data from MFAPI:', err?.message || err);
        throw err;
      }

      // Parse JSON defensively and handle MFAPI array response
      let data = null;
      try {
        const text = await response.text();
        try {
          // First try parsing as JSON
          data = JSON.parse(text);
        } catch (jsonErr) {
          console.error('Invalid JSON from MFAPI:', text.slice(0, 500));
          throw new Error('Failed to parse upstream response as JSON');
        }
        
        // MFAPI returns either array directly or { data: [] }
        if (Array.isArray(data)) {
          cache.data = data;
        } else if (data && Array.isArray(data.data)) {
          cache.data = data.data;
        } else {
          console.error('Unexpected MFAPI response shape:', typeof data, Object.keys(data || {}));
          throw new Error('Unexpected data shape from upstream');
        }
      } catch (err) {
        console.error('Failed to process MFAPI response:', err.message);
        throw err;
      }

      if (!Array.isArray(cache.data) || cache.data.length === 0) {
        console.error('Empty or invalid data from MFAPI');
        throw new Error('Upstream returned empty or invalid data');
      }
      cache.lastFetched = Date.now();
    }

    const url = new URL(request.url);
  const q = url.searchParams.get('q') || '';
  const codeQuery = url.searchParams.get('code') || '';
    const limit = parseInt(url.searchParams.get('limit') || '100', 10);
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10));
    const fundHouse = url.searchParams.get('fundHouse');
    const category = url.searchParams.get('category');

    let list = cache.data || [];

    if (q) {
      const ql = q.toLowerCase();
      list = list.filter(s => (s.schemeName || '').toLowerCase().includes(ql) || (s.fundHouse || '').toLowerCase().includes(ql));
    }
    // code query supports exact or prefix match on schemeCode
    if (codeQuery) {
      const cq = codeQuery.toString().toLowerCase();
      list = list.filter(s => (s.schemeCode || '').toString().toLowerCase().startsWith(cq));
    }
    if (fundHouse) {
      const fh = fundHouse.toLowerCase();
      list = list.filter(s => (s.fundHouse || '').toLowerCase() === fh);
    }
    if (category) {
      const c = category.toLowerCase();
      list = list.filter(s => (s.schemeCategory || '').toLowerCase() === c);
    }

    // Trim and paginate
    const safeLimit = Math.max(1, Math.min(5000, limit));
    const start = Math.min(offset, Math.max(0, list.length - 1));
    const end = Math.min(start + safeLimit, list.length);
    const pageSlice = list.slice(start, end);
    const trimmed = pageSlice.map(trimScheme);

    // If cache is unexpectedly empty, return a helpful error for debugging
    if ((!cache.data || cache.data.length === 0) && trimmed.length === 0) {
      return Response.json({ error: 'No data available from upstream MFAPI', lastFetched: cache.lastFetched }, { status: 502 });
    }

    return Response.json(
      { count: list.length, results: trimmed },
      {
        headers: {
          // Allow CDN/proxy to cache for 6h and serve stale for quick UX
          'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=86400'
        }
      }
    );
  } catch (error) {
    console.error('Error in /api/mf:', error?.message || error);
    return Response.json({ error: 'Failed to fetch mutual funds data', detail: error?.message || String(error) }, { status: 500 });
  }
}

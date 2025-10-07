// Normalized scheme endpoint with simple per-code cache
const schemeCache = new Map();
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

export async function GET(request, { params }) {
  const { code } = params;

  try {
    const cached = schemeCache.get(code);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return Response.json(cached.data);
    }

  const fetchUrl = `https://www.mfapi.in/mf/${code}`;
    let resp;
    try {
      resp = await fetch(fetchUrl);
    } catch (err) {
      return Response.json({ error: 'Failed to fetch scheme data', detail: err.message }, { status: 502 });
    }
    if (!resp || !resp.ok) {
      const text = await resp?.text().catch(() => '<no-body>');
      return Response.json({ error: 'Failed to fetch scheme data', detail: `upstream ${resp?.status}: ${text}` }, { status: 502 });
    }

    const raw = await resp.json();

    // Normalize shape: ensure meta and data arrays
    const data = {
      meta: raw.meta || raw.scheme || {},
      data: Array.isArray(raw.data) ? raw.data : (raw.data || [])
    };

    schemeCache.set(code, { data, timestamp: Date.now() });

    // Keep cache size bounded
    if (schemeCache.size > 2000) {
      const oldest = [...schemeCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
      if (oldest) schemeCache.delete(oldest[0]);
    }

    return Response.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=86400'
      }
    });
  } catch (err) {
    return Response.json({ error: 'Failed to fetch scheme data' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';

function toDateOnly(d) {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

// Returns the nav entry on or before the given date (nearest earlier)
function findNavOnOrBefore(sortedHistoryAsc, targetDate) {
  // binary search like approach
  let lo = 0, hi = sortedHistoryAsc.length - 1, res = null;
  const t = toDateOnly(targetDate).getTime();
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const midDate = toDateOnly(sortedHistoryAsc[mid].date).getTime();
    if (midDate === t) return sortedHistoryAsc[mid];
    if (midDate < t) {
      res = sortedHistoryAsc[mid];
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return res;
}

function addMonths(date, n) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

function calculateSIP(navHistory, amount, frequency, startDate, endDate) {
  // sort ascending by date (oldest first)
  const sorted = [...navHistory].map(d => ({ ...d, date: d.date })).sort((a, b) => new Date(a.date) - new Date(b.date));

  const start = toDateOnly(startDate);
  const end = toDateOnly(endDate);
  if (end < start) return { error: 'End date must be after start date' };

  const investments = [];
  let totalUnits = 0;
  let totalInvested = 0;

  // build schedule
  let current = new Date(start);
  while (current <= end) {
    // find NAV on or before current
    const navEntry = findNavOnOrBefore(sorted, current);
    if (navEntry) {
      const nav = parseFloat(navEntry.nav || navEntry.NetAssetValue || 0);
      if (nav > 0) {
        const units = amount / nav;
        totalUnits += units;
        totalInvested += amount;
        investments.push({ date: navEntry.date, amount, nav, units });
      } else {
        investments.push({ date: current.toISOString().split('T')[0], amount, nav: null, units: 0, skipped: true });
      }
    } else {
      // no earlier NAV available -> mark needs_review if all dates have no nav
      investments.push({ date: current.toISOString().split('T')[0], amount, nav: null, units: 0, skipped: true });
    }

    // advance by frequency
    switch ((frequency || 'monthly').toLowerCase()) {
      case 'monthly':
        current = addMonths(current, 1);
        break;
      case 'quarterly':
        current = addMonths(current, 3);
        break;
      case 'yearly':
        current = addMonths(current, 12);
        break;
      default:
        return { error: 'Invalid frequency' };
    }
  }

  const validInvestments = investments.filter(i => i.nav && i.nav > 0);
  if (validInvestments.length === 0) {
    return { error: 'No valid NAVs found for the selected range', needs_review: true };
  }

  // latest NAV: most recent available in history
  const latestEntry = sorted[sorted.length - 1];
  const latestNAV = parseFloat(latestEntry.nav || latestEntry.NetAssetValue || 0);
  const currentValue = totalUnits * latestNAV;

  const absoluteReturn = totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0;

  // compute years between first valid investment date and last available date for annualized return
  const firstDate = toDateOnly(new Date(validInvestments[0].date));
  const lastDate = toDateOnly(new Date(latestEntry.date));
  const years = Math.max( (lastDate - firstDate) / (365 * 24 * 60 * 60 * 1000), 0.0001);
  const annualizedReturn = years > 0 ? (Math.pow((currentValue / totalInvested), (1 / years)) - 1) * 100 : null;

  // build timeline: cumulative units and value after each investment date
  let cumUnits = 0;
  const timeline = investments.map(inv => {
    if (inv.units) cumUnits += inv.units;
    const value = cumUnits * latestNAV;
    return {
      date: inv.date,
      invested: inv.amount,
      nav: inv.nav,
      units: parseFloat(inv.units ? inv.units.toFixed(6) : '0'),
      cumulativeUnits: parseFloat(cumUnits.toFixed(6)),
      value: parseFloat(value.toFixed(2)),
      skipped: !!inv.skipped
    };
  });

  return {
    totalInvested: parseFloat(totalInvested.toFixed(2)),
    currentValue: parseFloat(currentValue.toFixed(2)),
    totalUnits: parseFloat(totalUnits.toFixed(6)),
    absoluteReturn: parseFloat(absoluteReturn.toFixed(2)),
    annualizedReturn: annualizedReturn !== null ? parseFloat(annualizedReturn.toFixed(2)) : null,
    latestNAV: parseFloat(latestNAV.toFixed(4)),
    timeline,
    investments: validInvestments.map(inv => ({ ...inv, units: parseFloat(inv.units.toFixed(6)) }))
  };
}

export async function POST(request, { params }) {
  const { code } = params;

  try {
    const body = await request.json();
    const { amount, frequency, from, to } = body;

    if (!amount || !frequency || !from || !to) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

  const origin = new URL(request.url).origin;
  const fetchUrl = `${origin}/api/scheme/${code}`;
    let response;
    try {
      response = await fetch(fetchUrl);
    } catch (err) {
      return NextResponse.json({ error: 'Failed to fetch scheme data', detail: err.message }, { status: 502 });
    }
    if (!response || !response.ok) {
      const body = await response?.text().catch(() => '<no-body>');
      return NextResponse.json({ error: 'Failed to fetch scheme data', detail: `upstream ${response?.status}: ${body}` }, { status: 502 });
    }

    const raw = await response.json();
    const navHistory = Array.isArray(raw.data) ? raw.data : (raw.data || []);

    const result = calculateSIP(navHistory, parseFloat(amount), frequency, from, to);
    if (result.error) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to calculate SIP returns' }, { status: 500 });
  }
}

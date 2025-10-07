import { NextResponse } from 'next/server';

function calculateReturns(navHistory, startDate, endDate) {
  // Sort NAV history by date in ascending order
  const sortedHistory = [...navHistory].sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );

  // Find closest NAV entries to start and end dates
  const startNAVEntry = sortedHistory.find(entry => 
    new Date(entry.date) >= new Date(startDate)
  );
  const endNAVEntry = [...sortedHistory].reverse().find(entry => 
    new Date(entry.date) <= new Date(endDate)
  );

  if (!startNAVEntry || !endNAVEntry) {
    return {
      error: 'Insufficient data for the selected date range'
    };
  }

  const startNAV = parseFloat(startNAVEntry.nav);
  const endNAV = parseFloat(endNAVEntry.nav);
  const durationDays = (new Date(endNAVEntry.date) - new Date(startNAVEntry.date)) / (1000 * 60 * 60 * 24);

  // Calculate simple return
  const simpleReturn = ((endNAV - startNAV) / startNAV) * 100;

  // Calculate annualized return if duration ≥ 30 days
  let annualizedReturn = null;
  if (durationDays >= 30) {
    annualizedReturn = (Math.pow((endNAV / startNAV), (365 / durationDays)) - 1) * 100;
  }

  return {
    startDate: startNAVEntry.date,
    endDate: endNAVEntry.date,
    startNAV,
    endNAV,
    simpleReturn: parseFloat(simpleReturn.toFixed(2)),
    annualizedReturn: annualizedReturn ? parseFloat(annualizedReturn.toFixed(2)) : null,
    durationDays: Math.round(durationDays)
  };
}

function getDateRangeFromPeriod(period) {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case '1m':
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    case '3m':
      startDate.setMonth(endDate.getMonth() - 3);
      break;
    case '6m':
      startDate.setMonth(endDate.getMonth() - 6);
      break;
    case '1y':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    default:
      return null;
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
}

export async function GET(request, { params }) {
  const { code } = params;
  const searchParams = new URL(request.url).searchParams;
  let startDate, endDate;

  // Handle period-based queries
  const period = searchParams.get('period');
  if (period) {
    const dateRange = getDateRangeFromPeriod(period);
    if (!dateRange) {
      return NextResponse.json(
        { error: 'Invalid period parameter' },
        { status: 400 }
      );
    }
    ({ startDate, endDate } = dateRange);
  } else {
    // Handle custom date range
    startDate = searchParams.get('from');
    endDate = searchParams.get('to');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing date parameters' },
        { status: 400 }
      );
    }
  }

  try {
    // Prefer our own cached scheme endpoint to reduce upstream load
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

    const schemeData = await response.json();
    const returns = calculateReturns(schemeData.data, startDate, endDate);

    if (returns.error) {
      return NextResponse.json({ error: returns.error }, { status: 404 });
    }

    return NextResponse.json(returns);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to calculate returns' },
      { status: 500 }
    );
  }
}

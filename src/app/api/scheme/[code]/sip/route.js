import { NextResponse } from 'next/server';

function calculateSIP(navHistory, amount, frequency, startDate, endDate) {
  // Sort NAV history by date in ascending order
  const sortedHistory = [...navHistory].sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );

  // Convert dates to Date objects
  const start = new Date(startDate);
  const end = new Date(endDate);

  let totalUnits = 0;
  let totalInvested = 0;
  let investments = [];

  // Determine investment dates based on frequency
  let currentDate = new Date(start);
  while (currentDate <= end) {
    // Find closest NAV entry for the investment date
    const navEntry = sortedHistory.find(entry => 
      new Date(entry.date) >= currentDate
    );

    if (navEntry) {
      const nav = parseFloat(navEntry.nav);
      if (nav > 0) {  // Skip if NAV is 0 or invalid
        const units = amount / nav;
        totalUnits += units;
        totalInvested += amount;
        investments.push({
          date: navEntry.date,
          amount,
          nav,
          units
        });
      }
    }

    // Move to next investment date based on frequency
    switch (frequency.toLowerCase()) {
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
      case 'quarterly':
        currentDate.setMonth(currentDate.getMonth() + 3);
        break;
      case 'yearly':
        currentDate.setFullYear(currentDate.getFullYear() + 1);
        break;
      default:
        return { error: 'Invalid frequency' };
    }
  }

  if (investments.length === 0) {
    return { error: 'No valid investment dates found' };
  }

  // Get latest NAV for current value calculation
  const latestNAV = parseFloat(sortedHistory[0].nav);
  const currentValue = totalUnits * latestNAV;

  // Calculate returns
  const absoluteReturn = ((currentValue - totalInvested) / totalInvested) * 100;
  
  // Calculate XIRR (simplified annual return)
  const years = (end - start) / (365 * 24 * 60 * 60 * 1000);
  const annualizedReturn = (Math.pow((currentValue / totalInvested), (1 / years)) - 1) * 100;

  return {
    totalInvested: parseFloat(totalInvested.toFixed(2)),
    currentValue: parseFloat(currentValue.toFixed(2)),
    totalUnits: parseFloat(totalUnits.toFixed(4)),
    absoluteReturn: parseFloat(absoluteReturn.toFixed(2)),
    annualizedReturn: parseFloat(annualizedReturn.toFixed(2)),
    investments: investments.map(inv => ({
      ...inv,
      units: parseFloat(inv.units.toFixed(4))
    }))
  };
}

export async function POST(request, { params }) {
  const { code } = params;

  try {
    const body = await request.json();
    const { amount, frequency, from, to } = body;

    // Validate input
    if (!amount || !frequency || !from || !to) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Fetch scheme data
    const response = await fetch(`https://api.mfapi.in/mf/${code}`);
    if (!response.ok) {
      throw new Error('Failed to fetch scheme data');
    }

    const schemeData = await response.json();
    const sipCalculation = calculateSIP(
      schemeData.data,
      parseFloat(amount),
      frequency,
      from,
      to
    );

    if (sipCalculation.error) {
      return NextResponse.json(
        { error: sipCalculation.error },
        { status: 400 }
      );
    }

    return NextResponse.json(sipCalculation);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to calculate SIP returns' },
      { status: 500 }
    );
  }
}

// BESCOM Tariff — Verified 2026 GJS Edition
// Source: slab_optimisation_with_entitlement_limit.py (Team 3)

export interface BillBreakdown {
  totalUnits:      number;
  slabBreakdown:   Array<{ slab: string; units: number; rate: number; amount: number }>;
  energyCharges:   number;
  fixedCharges:    number;
  electricityDuty: number;
  totalBill:       number;
  averageRate:     number;
  // Entitlement-aware fields
  grossTotal?:     number;
  subsidyAmount?:  number;
  netPayable?:     number;
  scenario?:       'ZERO_BILL' | 'PARTIAL' | 'CLIFF_EDGE';
}

// Verified 2026 BESCOM constants (entitlement engine)
const FIXED_RATE_PER_KW  = 145.0;
const CONNECTED_LOAD_KW  = 3.0;
const ENERGY_RATE        = 5.80;
const FPPCA_RATE         = 0.44;   // Matches backend main.py (2026 GJS)
const PG_SURCHARGE_RATE  = 0.36;
const TAX_RATE           = 0.09;   // 9% State Duty
const GRUHA_JYOTI_MAX    = 200;

/**
 * Legacy flat-200 bill calculator.
 * Note: Only use this for generic calculations. For personalized user dashboards, 
 * use calculateBESCOMBillWithEntitlement.
 */
export function calculateBESCOMBill(units: number): BillBreakdown {
  if (units <= 0) {
    return { totalUnits: 0, slabBreakdown: [], energyCharges: 0, fixedCharges: 0, electricityDuty: 0, totalBill: 0, averageRate: 0 };
  }

  if (units <= GRUHA_JYOTI_MAX) {
    return {
      totalUnits: units,
      slabBreakdown: [{ slab: '0-200 units (Gruha Jyoti FREE)', units, rate: 0, amount: 0 }],
      energyCharges: 0, fixedCharges: 0, electricityDuty: 0, totalBill: 0, averageRate: 0,
      grossTotal: 0, subsidyAmount: 0, netPayable: 0, scenario: 'ZERO_BILL',
    };
  }

  const fixed       = FIXED_RATE_PER_KW * CONNECTED_LOAD_KW;
  const energy      = units * ENERGY_RATE;
  const fppca       = units * FPPCA_RATE;
  const pgSurcharge = units * PG_SURCHARGE_RATE;
  const subtotal    = fixed + energy + fppca + pgSurcharge;
  const stateDuty   = subtotal * TAX_RATE;
  const totalBill   = subtotal + stateDuty;

  return {
    totalUnits: units,
    slabBreakdown: [
      { slab: 'Energy Charge',             units, rate: ENERGY_RATE,       amount: energy      },
      { slab: `FPPCA (×₹${FPPCA_RATE})`,   units, rate: FPPCA_RATE,        amount: fppca       },
      { slab: `P&G Surcharge (×₹${PG_SURCHARGE_RATE})`, units, rate: PG_SURCHARGE_RATE, amount: pgSurcharge },
      { slab: `Fixed Charge (₹${FIXED_RATE_PER_KW} × ${CONNECTED_LOAD_KW}kW)`, units: 1, rate: fixed, amount: fixed },
    ],
    energyCharges:   Math.round(energy + fppca + pgSurcharge),
    fixedCharges:    Math.round(fixed),
    electricityDuty: Math.round(stateDuty),
    totalBill:       Math.round(totalBill),
    averageRate:     parseFloat((totalBill / units).toFixed(2)),
    grossTotal:      Math.round(totalBill),
    subsidyAmount:   0,
    netPayable:      Math.round(totalBill),
    scenario:        'CLIFF_EDGE',
  };
}

/**
 * 3-Scenario Gruha Jyothi entitlement-aware bill calculator.
 * Mirrors the Python BESCOMSlabOptimizer.calc_bill_with_entitlement().
 */
export function calculateBESCOMBillWithEntitlement(
  units: number,
  entitlement: number
): BillBreakdown {
  if (units <= 0) {
    return { totalUnits: 0, slabBreakdown: [], energyCharges: 0, fixedCharges: 0, electricityDuty: 0, totalBill: 0, averageRate: 0, scenario: 'ZERO_BILL' };
  }

  const fixed    = FIXED_RATE_PER_KW * CONNECTED_LOAD_KW;
  const energy   = units * ENERGY_RATE;
  const fppca    = units * FPPCA_RATE;
  const pg       = units * PG_SURCHARGE_RATE;
  
  const subtotal = fixed + energy + fppca + pg;
  const tax      = subtotal * TAX_RATE;
  const gross    = subtotal + tax;

  let subsidyAmount = 0;
  let netPayable    = 0;
  let scenario: 'ZERO_BILL' | 'PARTIAL' | 'CLIFF_EDGE';

  if (units > GRUHA_JYOTI_MAX) {
    // SCENARIO C: Crossed 200. Zero subsidy, pay full gross amount.
    scenario      = 'CLIFF_EDGE';
    subsidyAmount = 0;
    netPayable    = gross;
  } else if (units <= entitlement) {
    // SCENARIO A: Within entitlement. 100% subsidized.
    scenario      = 'ZERO_BILL';
    subsidyAmount = gross;
    netPayable    = 0;
  } else {
    // SCENARIO B: Partial Bill. Subsidized UP TO entitlement limit.
    scenario         = 'PARTIAL';
    
    // FIX: Calculate government subsidy for the entitled units INCLUDING FPPCA & PG surcharges
    const energySub  = entitlement * ENERGY_RATE;
    const fppcaSub   = entitlement * FPPCA_RATE;
    const pgSub      = entitlement * PG_SURCHARGE_RATE;
    const subSub     = fixed + energySub + fppcaSub + pgSub;
    
    subsidyAmount    = subSub + (subSub * TAX_RATE);
    netPayable       = Math.max(0, gross - subsidyAmount);
  }

  const averageRate = netPayable > 0 ? parseFloat((netPayable / units).toFixed(2)) : 0;

  return {
    totalUnits: units,
    slabBreakdown: [
      { slab: 'Energy Charge',             units, rate: ENERGY_RATE,       amount: energy   },
      { slab: `FPPCA (×₹${FPPCA_RATE})`,   units, rate: FPPCA_RATE,        amount: fppca    },
      { slab: `P&G Surcharge (×₹${PG_SURCHARGE_RATE})`, units, rate: PG_SURCHARGE_RATE, amount: pg       },
      { slab: `Fixed Charge (₹${FIXED_RATE_PER_KW} × ${CONNECTED_LOAD_KW}kW)`, units: 1, rate: fixed, amount: fixed    },
    ],
    energyCharges:   Math.round(energy + fppca + pg),
    fixedCharges:    Math.round(fixed),
    electricityDuty: Math.round(tax),
    totalBill:       Math.round(netPayable),
    averageRate,
    grossTotal:      Math.round(gross),
    subsidyAmount:   Math.round(subsidyAmount),
    netPayable:      Math.round(netPayable),
    scenario,
  };
}

// ============================================================
// Slab boundary impact helper (used by recommendations engine)
// Returns advice when close to the 200-unit cliff edge.
// ============================================================
export interface SlabBoundaryImpact {
  boundary: number;
  current: number;
  savings: number; // The financial penalty of crossing the boundary
}

export function calculateSlabBoundaryImpact(units: number, entitlement: number = 100): SlabBoundaryImpact[] {
  const impacts: SlabBoundaryImpact[] = [];
  const boundary = GRUHA_JYOTI_MAX; // 200 units

  // Only flag if within 30 units below the cliff edge (170–200)
  if (units > boundary - 30 && units <= boundary) {
    // FIX: Compare the partial bill against the full cliff-edge penalty
    const cliffBill = calculateBESCOMBillWithEntitlement(boundary + 1, entitlement).totalBill;
    const currentBill = calculateBESCOMBillWithEntitlement(units, entitlement).totalBill;
    
    // The savings is what they avoid paying by staying under 200
    const savings = cliffBill - currentBill; 
    
    impacts.push({ boundary, current: units, savings });
  }

  return impacts;
}
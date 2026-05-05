// ============================================================
// BESCOM App — Shared TypeScript Types
// ============================================================

export interface HistoricalBill {
  month: string;
  units: number;
  bill: number;
}

// Baseload appliance counts (new — Step 1)
export interface BaseloadCounts {
  num_fans:    number;
  num_fridges: number;
  num_tvs:     number;
  num_lights:  number;
}

export interface UserData {
  name?: string;
  email?: string;
  numberOfPeople: number;
  historicalBills: HistoricalBill[];
  entitlement?: number;    // Manual input from BESCOM bill
  daysHome?: number;       // New — days at home this month
  baseloadCounts?: BaseloadCounts; // New — per-appliance counts
}

export interface ApplianceEntry {
  selected: boolean;
  wattage: number;
}

export type ApplianceData = Record<string, ApplianceEntry>;

export type UsageData = Record<string, number>;

export interface Appliance {
  name: string;
  category: 'high-consumption' | 'baseload';
  defaultWattage: number;
  wattageRange?: [number, number];
  editable: boolean;
  description: string;
  icon: string;
}

export interface Recommendation {
  appliance: string;
  action: string;
  unitsSaved: number;
  billImpact: string;
  priority: 'high' | 'medium' | 'low';
}

// API response shape (scenario 1/2/3 as numbers per Team 3 spec)
export interface ApiPredictionResponse {
  units:             number;
  baseload_units:    number;
  hca_units:         number;
  bill:              number;
  is_free:           boolean;
  scenario:          1 | 2 | 3;         // 1=zero, 2=partial, 3=cliff
  entitlement_limit: number;
  units_over:        number;
  estimated_bill_inr: number;
  plan:              string[];
  history_note?:     string;
  details?: {
    fixed_charge?:    number;
    energy_charge?:   number;
    fppca_charge?:    number;
    pg_surcharge?:    number;
    subtotal?:        number;
    state_duty_9pct?: number;
    gross_total?:     number;
    subsidy_amount?:  number;
  };
}

export interface PredictionResult {
  estimatedUnits:   number;   // physics estimate (baseload + HCA sum)
  correctedUnits:   number;   // XGBoost ML predicted units
  estimatedBill:    number;   // 3-scenario slab bill amount
  gruhaJyotiStatus: 'FREE' | 'CHARGED';
  scenario?:        'ZERO_BILL' | 'PARTIAL' | 'CLIFF_EDGE';
  entitlementLimit?: number;
  unitsOver?:        number;
  recommendations:  Recommendation[];
}

export interface ConsumptionData {
  date: string;
  units: number;
  predicted?: number;
}

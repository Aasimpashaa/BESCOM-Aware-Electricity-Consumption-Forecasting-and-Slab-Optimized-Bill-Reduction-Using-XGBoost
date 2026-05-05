import { UserData, ApplianceData, UsageData, PredictionResult, Recommendation } from '../types';
import { APPLIANCES } from '../data/appliances';
import { calculateBESCOMBillWithEntitlement } from './bescomTariffs';

// ── 2026 GJS CONSTANTS ──
const DAILY_MULT = 30.0;
const WEEKLY_MULT = 4.33; // Precise monthly average for cycles/week
const UNIT_RATE = 5.80;

// ============================================================
// Layer 1: Build the POST body for FastAPI
// ============================================================
function buildApiPayload(
  userData: UserData,
  applianceData: ApplianceData,
  usageData: UsageData
): Record<string, any> {
  const rawBills = userData.historicalBills.map(b => b.units);
  const last_3_months = rawBills.length >= 3 
    ? [...rawBills].slice(-3).reverse() 
    : [...rawBills, ...Array(3 - rawBills.length).fill(rawBills[0] || 0)].reverse();

  const daysHome = userData.daysHome ?? 30;

  // Convert raw daily/weekly hours into monthly kWh for the XGBoost Model
  const getUsageKWh = (keyFragment: string, isWeekly: boolean = false) => {
    const entry = Object.entries(applianceData).find(([n, d]) => d.selected && n.toLowerCase().includes(keyFragment.toLowerCase()));
    if (!entry) return 0;
    
    const [name, data] = entry;
    const val = usageData[name] ?? 0;
    const wattageKW = (data.wattage || 1000) / 1000;
    
    // Scale daily items by days home; weekly items remain constant
    return val * wattageKW * (isWeekly ? WEEKLY_MULT : (DAILY_MULT * (daysHome / 30)));
  };

  return {
    last_3_months,
    entitlement_limit: userData.entitlement ?? 100,
    num_people: Number(userData.numberOfPeople) || 3,
    days_home: daysHome,
    current_month: new Date().getMonth() + 1,
    num_fans: userData.baseloadCounts?.num_fans ?? 3,
    num_lights: userData.baseloadCounts?.num_lights ?? 6,
    num_tvs: userData.baseloadCounts?.num_tvs ?? 1,
    num_fridges: userData.baseloadCounts?.num_fridges ?? 1,
    
    ac_1ton_kwh: getUsageKWh('1 ton'),
    ac_1_5ton_kwh: getUsageKWh('1.5 ton'),
    geyser_kwh: getUsageKWh('geyser'),
    washing_machine_kwh: getUsageKWh('washing machine', true),
    microwave_kwh: getUsageKWh('microwave'),
    cooler_kwh: getUsageKWh('cooler'),
    iron_kwh: getUsageKWh('iron', true),
  };
}

// ============================================================
// Layer 2: Smart Recommendation Engine (Proportional Logic)
// ============================================================
function generateSmartPlan(
  predictedUnits: number, 
  entitlement: number, 
  applianceData: ApplianceData, 
  usageData: UsageData
): Recommendation[] {
  const recos: Recommendation[] = [];
  const targetUnits = predictedUnits > 200 ? 200 : entitlement;
  let remainingUnitsToSave = Math.max(0, predictedUnits - targetUnits);

  if (remainingUnitsToSave <= 0) return [];

  // 1. Map and Sort selected high-consumption appliances
  const activeApps = Object.entries(applianceData)
    .filter(([_, data]) => data.selected)
    .map(([name, data]) => {
      const appDef = APPLIANCES.find(a => a.name === name);
      const isWeekly = name.toLowerCase().includes('washing machine') || name.toLowerCase().includes('iron');
      const wattageKW = data.wattage / 1000;
      const hours = usageData[name] ?? 0;
      const monthlyKWh = hours * wattageKW * (isWeekly ? WEEKLY_MULT : DAILY_MULT);

      return { name, icon: appDef?.icon || '⚡', monthlyKWh, wattageKW, isWeekly };
    })
    .filter(app => app.monthlyKWh > 0)
    .sort((a, b) => b.monthlyKWh - a.monthlyKWh);

  // 2. Proportional Distribution: Spread the required reduction across ALL active appliances
  const MAX_CUT_RATIO = 0.35; // Maximum 35% cut per appliance
  const totalReducible = activeApps.reduce((sum, app) => sum + (app.monthlyKWh * MAX_CUT_RATIO), 0);
  
  // Calculate how much of the max 35% we actually need to apply to hit our goal
  let cutFactor = 1.0;
  if (totalReducible > remainingUnitsToSave && totalReducible > 0) {
    cutFactor = remainingUnitsToSave / totalReducible;
  }

  for (const app of activeApps) {
    if (remainingUnitsToSave <= 0) break;

    // Apply the proportional cut to EVERY appliance
    const actualUnitsToCut = app.monthlyKWh * MAX_CUT_RATIO * cutFactor;

    // Use a tiny threshold (0.1) to ensure even small appliances get a recommendation card
    if (actualUnitsToCut >= 0.1) {
      const hoursSavedMonthly = actualUnitsToCut / app.wattageKW;
      const timeMetric = app.isWeekly ? 'uses/wk' : 'h/day';
      const displayCut = app.isWeekly 
        ? (hoursSavedMonthly / WEEKLY_MULT).toFixed(1) 
        : (hoursSavedMonthly / DAILY_MULT).toFixed(1);
        
      const pctCut = Math.round((actualUnitsToCut / app.monthlyKWh) * 100);

      recos.push({
        appliance: `${app.icon} ${app.name}`,
        action: `Reduce usage by ~${displayCut} ${timeMetric} (a ${pctCut}% cut) to help reach ${targetUnits} unit slab goals.`,
        unitsSaved: Math.round(actualUnitsToCut),
        billImpact: `Saves ~₹${Math.round(actualUnitsToCut * UNIT_RATE)}`,
        priority: actualUnitsToCut > 15 ? 'high' : 'medium',
      });
      remainingUnitsToSave -= actualUnitsToCut;
    }
  }

  // 3. Fallback Baseload Advice (Lowest Priority - Only appears if appliances couldn't cover the gap)
  if (remainingUnitsToSave > 2) {
    recos.push({
      appliance: `💡 Electronics & Lighting`,
      action: `Minimize non-essential fans and lights. Ensure lights are switched on only after evening to save the remaining ~${Math.round(remainingUnitsToSave)} units.`,
      unitsSaved: Math.round(remainingUnitsToSave),
      billImpact: `Saves ~₹${Math.round(remainingUnitsToSave * UNIT_RATE)}`,
      priority: 'low', // Explicitly marked as low priority
    });
  }

  return recos;
}

// ============================================================
// Main Prediction Entry
// ============================================================
export async function generatePrediction(
  userData: UserData,
  applianceData: ApplianceData,
  usageData: UsageData
): Promise<PredictionResult> {
  const entitlement = userData.entitlement ?? 100;

  try {
    const response = await fetch('http://localhost:8000/optimize-bill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildApiPayload(userData, applianceData, usageData)),
    });

    if (!response.ok) throw new Error('Backend error');
    const data = await response.json();

    const correctedUnits = Math.round(data.predicted_units || 0);
    const recommendations = generateSmartPlan(correctedUnits, entitlement, applianceData, usageData);

    return {
      estimatedUnits: correctedUnits,
      correctedUnits,
      estimatedBill: data.bill || 0,
      gruhaJyotiStatus: correctedUnits <= entitlement ? 'FREE' : 'CHARGED',
      scenario: data.scenario,
      entitlementLimit: data.entitlement_limit ?? entitlement,
      unitsOver: Math.max(0, correctedUnits - entitlement),
      recommendations
    };
  } catch (error) {
    // Basic fallback if API is down
    const historicalAvg = userData.historicalBills.reduce((s, b) => s + b.units, 0) / (userData.historicalBills.length || 1);
    const units = Math.round(historicalAvg);
    const breakdown = calculateBESCOMBillWithEntitlement(units, entitlement);

    return {
      estimatedUnits: units,
      correctedUnits: units,
      estimatedBill: breakdown.totalBill,
      gruhaJyotiStatus: units <= entitlement ? 'FREE' : 'CHARGED',
      scenario: breakdown.scenario as any,
      entitlementLimit: entitlement,
      unitsOver: Math.max(0, units - entitlement),
      recommendations: []
    };
  }
}
import { calculateBESCOMBill, calculateSlabBoundaryImpact } from './bescomTariffs';
import { PredictionResult } from '../types';

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  potentialSavings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'behavioral' | 'equipment' | 'timing';
  icon: string;
}

export function generateRecommendations(
  currentMonthlyUnits: number,
  predictedMonthlyUnits: number,
  dailyPredictions: PredictionResult[],
  entitlement = 200
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const currentBill = calculateBESCOMBill(currentMonthlyUnits);
  const predictedBill = calculateBESCOMBill(predictedMonthlyUnits);
  const boundaryImpacts = calculateSlabBoundaryImpact(predictedMonthlyUnits);

  // Check if near slab boundary
  if (boundaryImpacts.length > 0) {
    boundaryImpacts.forEach(impact => {
      const unitsToReduce = Math.ceil(impact.current - impact.boundary);
      const potentialSavings = impact.savings;

      recommendations.push({
        id: 'slab-boundary',
        title: `Reduce consumption by ${unitsToReduce} units to save ₹${Math.round(potentialSavings)}`,
        description: `You're near the ${impact.boundary} unit slab boundary. Small reductions can yield significant savings by keeping you in a lower tariff slab.`,
        potentialSavings: Math.round(potentialSavings),
        difficulty: 'easy',
        category: 'behavioral',
        icon: 'Target',
      });
    });
  }

  // High consumption alert — fires when above entitlement OR above 200
  if (predictedMonthlyUnits > entitlement) {
    const target = Math.min(entitlement, predictedMonthlyUnits);
    const unitsOver = predictedMonthlyUnits - target;
    const reduction = Math.round(predictedMonthlyUnits * 0.15);
    const reducedBill = calculateBESCOMBill(predictedMonthlyUnits - reduction);
    const savings = predictedBill.totalBill - reducedBill.totalBill;
    const isOverCliff = predictedMonthlyUnits > 200;

    recommendations.push({
      id: 'high-consumption',
      title: isOverCliff
        ? `Reduce consumption by 15% to save ₹${Math.round(savings)}`
        : `You are ${unitsOver} units over your entitlement (${entitlement} units) — reduce to get a ₹0 bill`,
      description: isOverCliff
        ? 'Your consumption is above 200 units. The Gruha Jyothi subsidy is fully forfeited. Consider energy-efficient appliances like 5-star ACs, LED bulbs, and inverter refrigerators.'
        : `You are ${unitsOver} units above your Gruha Jyothi entitlement of ${entitlement} units. Reducing usage by ${unitsOver} units will bring your bill to ₹0.`,
      potentialSavings: isOverCliff ? Math.round(savings) : Math.round(unitsOver * 5.8),
      difficulty: 'medium',
      category: 'equipment',
      icon: 'Zap',
    });
  }

  // Peak hour optimization
  const avgDailyUnits = predictedMonthlyUnits / 30;
  if (avgDailyUnits > 7) {
    recommendations.push({
      id: 'peak-hours',
      title: 'Shift heavy appliance usage to off-peak hours',
      description: 'Run washing machines, dishwashers, and water heaters during off-peak hours (10 PM - 6 AM) to reduce load and extend appliance life.',
      potentialSavings: Math.round(predictedBill.totalBill * 0.08),
      difficulty: 'easy',
      category: 'timing',
      icon: 'Clock',
    });
  }

  // AC optimization (summer months)
  const currentMonth = new Date().getMonth();
  if ((currentMonth >= 2 && currentMonth <= 4) && predictedMonthlyUnits > 250) {
    recommendations.push({
      id: 'ac-optimization',
      title: 'Optimize AC usage for ₹300-500 savings',
      description: 'Set AC to 24-25°C, use timer functions, ensure proper servicing, and close doors/windows to reduce cooling load.',
      potentialSavings: 400,
      difficulty: 'easy',
      category: 'behavioral',
      icon: 'Wind',
    });
  }

  // Appliance standby power
  recommendations.push({
    id: 'standby-power',
    title: 'Eliminate standby power consumption',
    description: 'Unplug chargers, TVs, and other electronics when not in use. Standby power can account for 5-10% of your bill.',
    potentialSavings: Math.round(predictedBill.totalBill * 0.07),
    difficulty: 'easy',
    category: 'behavioral',
    icon: 'Power',
  });

  // LED lighting
  if (predictedMonthlyUnits > 150) {
    recommendations.push({
      id: 'led-lighting',
      title: 'Switch to LED bulbs for ₹150-250 monthly savings',
      description: 'Replace all incandescent and CFL bulbs with LED. LEDs consume 75% less energy and last 25 times longer.',
      potentialSavings: 200,
      difficulty: 'easy',
      category: 'equipment',
      icon: 'Lightbulb',
    });
  }

  // Solar water heater
  if (predictedMonthlyUnits > 250) {
    recommendations.push({
      id: 'solar-heater',
      title: 'Install solar water heater for ₹400-600 savings',
      description: 'Water heating accounts for 15-20% of residential electricity. Solar heaters have 3-4 year payback period.',
      potentialSavings: 500,
      difficulty: 'hard',
      category: 'equipment',
      icon: 'Sun',
    });
  }

  // Refrigerator optimization
  recommendations.push({
    id: 'refrigerator',
    title: 'Optimize refrigerator efficiency',
    description: 'Clean coils regularly, maintain optimal temperature (3-4°C for fridge, -18°C for freezer), and ensure door seals are tight.',
    potentialSavings: Math.round(predictedBill.totalBill * 0.05),
    difficulty: 'easy',
    category: 'behavioral',
    icon: 'Box',
  });

  // Sort by potential savings
  return recommendations.sort((a, b) => b.potentialSavings - a.potentialSavings);
}

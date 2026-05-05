import { Appliance } from '../types';

export const APPLIANCES: Appliance[] = [
  // High-consumption appliances (user must provide usage)
  {
    name: 'AC (1 Ton)',
    category: 'high-consumption',
    defaultWattage: 900,
    wattageRange: [750, 1200],
    editable: true,
    description: 'Split or window AC - 1 ton capacity',
    icon: '❄️',
  },
  {
    name: 'AC (1.5 Ton)',
    category: 'high-consumption',
    defaultWattage: 1500,
    wattageRange: [1200, 2200],
    editable: true,
    description: 'Split or window AC - 1.5 ton capacity',
    icon: '❄️',
  },
  {
    name: 'Geyser',
    category: 'high-consumption',
    defaultWattage: 2000,
    wattageRange: [1500, 3000],
    editable: true,
    description: 'Water heater',
    icon: '🚿',
  },
  {
    name: 'Washing Machine',
    category: 'high-consumption',
    defaultWattage: 500,
    wattageRange: [400, 2500],
    editable: true,
    description: 'Front-load ~500W, Top-load ~400W',
    icon: '🧺',
  },
  {
    name: 'Microwave',
    category: 'high-consumption',
    defaultWattage: 1200,
    wattageRange: [800, 1500],
    editable: true,
    description: 'Microwave oven',
    icon: '🍽️',
  },
  {
    name: 'Air Cooler',
    category: 'high-consumption',
    defaultWattage: 300,
    wattageRange: [150, 500],
    editable: true,
    description: 'Desert cooler or tower cooler',
    icon: '💨',
  },
  {
    name: 'Iron',
    category: 'high-consumption',
    defaultWattage: 1000,
    wattageRange: [750, 1500],
    editable: true,
    description: 'Clothes iron',
    icon: '👔',
  },

  // Baseload appliances (automatic - no user input needed)
  {
    name: 'Refrigerator',
    category: 'baseload',
    defaultWattage: 900, // 0.9 kWh/day = 900 Wh/day average
    wattageRange: undefined,
    editable: false,
    description: 'Always on - 0.9 kWh/day average',
    icon: '🧊',
  },
  {
    name: 'TV (LED)',
    category: 'baseload',
    defaultWattage: 400, // 0.1 kW × 4 hrs = 400 Wh/day
    wattageRange: undefined,
    editable: false,
    description: 'LED TV - 4 hours/day average',
    icon: '📺',
  },
  {
    name: 'Ceiling Fan',
    category: 'baseload',
    defaultWattage: 450, // 0.075 kW × 6 hrs = 450 Wh/day
    wattageRange: undefined,
    editable: false,
    description: 'Per fan - 6 hours/day average',
    icon: '🌀',
  },
  {
    name: 'LED Lights',
    category: 'baseload',
    defaultWattage: 500, // 0.5 kWh/day flat
    wattageRange: undefined,
    editable: false,
    description: 'All household lighting',
    icon: '💡',
  },
  {
    name: 'Phone Charger',
    category: 'baseload',
    defaultWattage: 100, // 0.1 kWh/day flat
    wattageRange: undefined,
    editable: false,
    description: 'Mobile and device charging',
    icon: '🔌',
  },
];

export const BASELOAD_DAILY_KWH = 2.35; // Sum of all baseload appliances in kWh/day

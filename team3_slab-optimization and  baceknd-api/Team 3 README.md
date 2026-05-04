# Team 3 — BESCOM Smart Bill Optimizer
### Gruha Jyothi Scheme (GJS) 2026 Edition

---

## 📋 Project Overview

This project is a **BESCOM Electricity Bill Prediction and Optimization System** built for residential consumers under the **Gruha Jyothi Scheme (GJS) 2026**. It combines an XGBoost ML model with deterministic physics-based calculations to accurately predict electricity consumption and estimate the monthly bill — helping users avoid subsidy forfeiture at the 200-unit cliff edge.

The system is split across three modules:

| File | Role |
|------|------|
| `DOC-20260504-WA0001` (`slab_optimisation_part1.py`) | Core billing engine — tariff constants, HCA wattage map, `BESCOMSlabOptimizer` class |
| `DOC-20260504-WA0002` (`slab_optimisation_part2.py`) | Optimization strategy engine + CLI presentation layer |
| `Backend_api.py` | FastAPI backend — ML model integration, blend prediction, REST endpoints |

---

## 🏗️ Architecture

```
User Input (appliance usage + entitlement)
        │
        ▼
┌───────────────────┐      ┌──────────────────────┐
│  Physics Engine   │      │  XGBoost ML Model     │
│  (wattage × hrs)  │ ──── │  (model_xgb_tuned.pkl)│
└───────────────────┘      └──────────────────────┘
        │                           │
        └──────── blend_prediction()────────┘
                        │
                        ▼
            BESCOMSlabOptimizer
            (3-Scenario GJS Logic)
                        │
                        ▼
            Bill Estimate + Optimization Plan
```

---

## ⚡ Gruha Jyothi 3-Scenario Logic

The billing engine applies the 2026 GJS rules with three distinct scenarios:

| Scenario | Condition | Result |
|----------|-----------|--------|
| **A — ZERO_BILL** | `units ≤ entitlement` | ₹0 payable, full subsidy applied |
| **B — PARTIAL** | `entitlement < units ≤ 200` | Pay only for excess units beyond entitlement |
| **C — CLIFF_EDGE** | `units > 200` | Full bill, subsidy completely forfeited |

> ⚠️ **Critical**: Crossing the 200-unit cliff causes total subsidy forfeiture — the optimizer is designed to warn and prevent this.

---

## 💰 Tariff Constants (2026, Verified)

| Component | Rate |
|-----------|------|
| Fixed Charge | ₹145.00 / kW (3 kW connected load = ₹435/month) |
| Energy Charge | ₹5.80 / unit |
| FPPCA | ₹0.39–0.44 / unit |
| PG Surcharge | ₹0.36 / unit |
| State Duty (Tax) | 9% on subtotal |

---

## 🔌 High-Consumption Appliance (HCA) Wattage Map

| Appliance | Wattage |
|-----------|---------|
| Air Conditioner (1 Ton) | 1000 W |
| Air Conditioner (1.5 Ton) | 1500 W |
| Geyser | 2000 W |
| Washing Machine | 500 W |
| Microwave | 1200 W |
| Cooler | 250 W |
| Iron | 1000 W |

**Monthly units per appliance** = `(Watts × daily_hours × 30) / 1000`

---

## 🤖 ML Blend Logic (`Backend_api.py`)

The backend uses a dynamic weighting strategy to blend XGBoost prediction with physics-based estimates:

```
ratio = HCA_kwh / (historical_avg + 1)

ratio < 0.30  →  70% ML  + 30% Physics
ratio 0.30–0.80  →  50% ML  + 50% Physics
ratio > 0.80  →  30% ML  + 70% Physics
```

This ensures that heavy appliance users (e.g., AC running 8+ hours) get a more accurate estimate driven by physics when the ML model alone may underfit.

---

## 🗂️ Module Details

### Part 1 — `slab_optimisation_part1.py`
- Defines all tariff constants for 2026
- `BESCOMSlabOptimizer.calculate_bill_breakdown(units, entitlement)` — returns `(payable, scenario, breakdown_dict)`
- `parse_hca_hours(hours_input: str)` — parses user appliance input string (e.g., `"ac:6, geyser:1.5"`) into a dict
- Supports aliases: `ac`, `a/c`, `wm`, `washer`, `mw`, `cooler`, etc.

### Part 2 — `slab_optimisation_part2.py`
- Imports from Part 1 and extends `BESCOMSlabOptimizer` with `get_optimization_strategy()`
- Optimization logic: sorts HCAs by wattage (highest first) and recommends per-appliance daily hour reductions to bring consumption below the cliff or entitlement
- CLI entry point with interactive prompts:
  - Enter personal entitlement limit
  - Enter appliance usage string
  - Displays predicted units, bill scenario, and optimization plan

**Sample CLI output:**
```
📊 CONSUMPTION BREAKDOWN
   Total Predicted: 187.5 kWh | Entitlement: 150 units

💰 BILL ESTIMATE
   STATUS: ⚠️ PARTIAL PAYMENT ZONE
   Gross Bill: ₹1,423.50
   GJS Subsidy: -₹1,102.20
   NET PAYABLE: ₹321.30

🎯 OPTIMIZATION PLAN
   🔹 AIR_CONDITIONER: Reduce by 1.2 hrs/day → saves 54.0 units.
```

### Backend API — `Backend_api.py`
- **Framework**: FastAPI with CORS middleware
- **Model assets** (loaded at startup):
  - `model_xgb_tuned.pkl` — trained XGBoost model
  - `scaler_team2.pkl` — feature scaler
  - `feature_order.json` — ordered feature list
- Graceful fallback: if model files are missing, physics-only mode is activated
- `BESCOMSlabOptimizer` class (self-contained, production version with refined Scenario B logic)
- `blend_prediction(ml_predicted, hist_avg, hca_kwh)` — dynamic ML/physics blend function

---

## 🚀 Setup & Running

### Prerequisites

```bash
pip install fastapi uvicorn xgboost scikit-learn joblib numpy pandas pydantic
```

### Running the CLI (Parts 1 & 2)

```bash
python slab_optimisation_part2.py
```

### Running the Backend API

Place the following files in the same directory as `Backend_api.py`:
- `model_xgb_tuned.pkl`
- `scaler_team2.pkl`
- `feature_order.json`

Then run:

```bash
uvicorn Backend_api:app --reload --port 8000
```

> If model files are absent, the server starts in **physics fallback mode** (no ML prediction).

---

## 📁 File Structure

```
team3/
├── slab_optimisation_part1.py   # Core engine (tariff + billing logic)
├── slab_optimisation_part2.py   # Optimization strategy + CLI
├── Backend_api.py               # FastAPI backend with XGBoost integration
├── model_xgb_tuned.pkl          # Trained XGBoost model (required for ML mode)
├── scaler_team2.pkl             # Feature scaler
├── feature_order.json           # Feature column ordering
└── Team 3 README.md             # This file
```

---

## 🔑 Key Design Decisions

1. **Cliff-edge awareness**: The optimizer is built around the critical 200-unit GJS threshold and actively warns users before they cross it.
2. **Physics + ML blend**: Pure ML can miss spikes from high-wattage appliances (AC, geyser). The blend function dynamically shifts weight to physics when HCA usage is dominant.
3. **Scenario B correction**: The backend's Scenario B logic charges only for excess units (not the full entitlement portion), which is the correct 2026 GJS interpretation.
4. **Alias support**: Common appliance shorthand (`ac`, `wm`, `mw`) is mapped to canonical names for flexible user input.

---

## 👥 Team 3

> BESCOM Smart Bill Optimizer — PoC Project, 2026

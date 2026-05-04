# Team 3 — BESCOM Smart Bill Optimizer
**SJBIT × IIMSTC Internship 2026**

A full-stack electricity bill prediction and optimization system for BESCOM domestic consumers under the **Gruha Jyothi Scheme (GJS) 2026**. The system combines an XGBoost ML model with deterministic physics-based blending to predict monthly consumption, calculate subsidy-adjusted bills, and recommend appliance-level reduction strategies.

---

## Project Structure

| File | Role |
|---|---|
| `slab_optimisation_with_entitlement_limit.py` | CLI-based bill engine with optimization planner |
| `main-7.py` | FastAPI backend — ML prediction + bill calculation API |

---

## Module 1: `slab_optimisation_with_entitlement_limit.py`
### CLI Optimizer — Gruha Jyothi Digital Twin

A standalone command-line tool that simulates a user's BESCOM bill and generates an appliance-level optimization plan.

### Features
- Accepts personal entitlement limit and appliance usage as input
- Implements the **3-Scenario GJS billing logic** (Zero Bill / Partial / Cliff Edge)
- Suggests which appliances to reduce and by how much (in hours/day)
- Supports common appliance aliases (`ac`, `wm`, `mw`, etc.)

### Tariff Constants (2026)

| Parameter | Value |
|---|---|
| Fixed Charge | ₹145/kW × 3 kW = ₹435 |
| Energy Rate | ₹5.80/unit |
| FPPCA Rate | ₹0.39/unit |
| PG Surcharge | ₹0.36/unit |
| State Duty (Tax) | 9% on subtotal |
| GJS Cliff Limit | 200 units |

### Billing Scenarios

| Scenario | Condition | Outcome |
|---|---|---|
| **A — Zero Bill** | Consumption ≤ Entitlement | Full subsidy; ₹0 payable |
| **B — Partial Bill** | Entitlement < Consumption ≤ 200 | Pay only for excess units |
| **C — Cliff Edge** | Consumption > 200 | Subsidy forfeited; full bill payable |

### Supported Appliances (HCA)

| Appliance | Wattage |
|---|---|
| Air Conditioner | 1500 W |
| Geyser | 2000 W |
| Washing Machine | 500 W |
| Iron | 1000 W |
| Microwave | 1200 W |
| Cooler | 250 W |

### Usage

```bash
python slab_optimisation_with_entitlement_limit.py
```

**Prompts:**
```
📋 Enter your Personal Entitlement Limit (Units): 100
⚡ Usage (e.g., ac:6, geyser:1.5): ac:4, geyser:1
```

**Sample Output:**
```
📊 CONSUMPTION BREAKDOWN
   Total Predicted: 156.5 kWh | Entitlement: 100 units

💰 BILL ESTIMATE
   STATUS: ⚠️ PARTIAL PAYMENT ZONE
   Gross Bill: ₹1042.30
   GJS Subsidy: -₹731.85
   NET PAYABLE: ₹310.45

🎯 OPTIMIZATION PLAN
   ⚠️  You are 56.5 units over your Entitlement (100 units).
   🔹 AIR_CONDITIONER: Reduce by 1.3 hrs/day → saves 58.5 units.
```

---

## Module 2: `main-7.py`
### FastAPI Backend — ML-Powered Prediction API (v3.1.0)

A production-ready REST API backend that powers the frontend UI. It loads a pre-trained XGBoost model, blends ML predictions with physics-based consumption math, and returns a full bill breakdown.

### Features
- XGBoost model + StandardScaler loading via `joblib` (with graceful fallback)
- **Blend function** that weights ML vs physics output based on HCA usage ratio
- Full GJS 3-scenario billing engine (updated Scenario B logic — user pays for excess only)
- Days-home scaling for partial-month occupancy
- CORS-enabled for frontend integration

### Tariff Constants (2026)

| Parameter | Value |
|---|---|
| Fixed Charge | ₹145/kW × 3 kW = ₹435 |
| Energy Rate | ₹5.80/unit |
| FPPCA Rate | ₹0.44/unit |
| PG Surcharge | ₹0.36/unit |
| State Duty (Tax) | 9% on subtotal |
| GJS Cliff Limit | 200 units |

### ML Blend Strategy

The `blend_prediction()` function dynamically weights the XGBoost prediction against a physics-based estimate depending on how dominant HCA appliance usage is:

| HCA Ratio (hca_kwh / hist_avg) | ML Weight | Physics Weight |
|---|---|---|
| < 0.30 | 70% | 30% |
| 0.30 – 0.80 | 50% | 50% |
| > 0.80 | 30% | 70% |

### API Endpoint

#### `POST /optimize-bill`

**Request Body (`application/json`):**

```json
{
  "last_3_months": [120, 135, 110],
  "entitlement_limit": 100,
  "num_people": 4,
  "days_home": 28,
  "current_month": 5,
  "num_fans": 3,
  "num_lights": 6,
  "num_tvs": 1,
  "num_fridges": 1,
  "ac_1ton_kwh": 45.0,
  "ac_1_5ton_kwh": 0.0,
  "geyser_kwh": 30.0,
  "washing_machine_kwh": 6.0,
  "microwave_kwh": 0.0,
  "cooler_kwh": 0.0,
  "iron_kwh": 3.0
}
```

> **Note:** Appliance values must be supplied as **monthly kWh units**, not daily hours.

**Response:**

```json
{
  "predicted_units": 158.4,
  "entitlement_limit": 100,
  "bill": 387.52,
  "scenario": "PARTIAL",
  "details": {
    "gross_total": 1061.40,
    "subsidy_amount": 673.88,
    "payable": 387.52,
    "fixed_charge": 435.0,
    "energy_charge": 919.12,
    "fppca_charge": 69.70,
    "pg_surcharge": 57.02,
    "subtotal": 973.76,
    "state_duty_9pct": 87.64
  },
  "plan": [],
  "feature_snapshot": {
    "hist_avg": 121.67,
    "hca_kwh": 84.0
  }
}
```

> The `plan` field is intentionally empty — optimization recommendations are rendered by the React frontend following the **"Dumb UI, Smart Logic"** architecture pattern.

### Running the API

**Install dependencies:**
```bash
pip install fastapi uvicorn joblib numpy pandas pydantic scikit-learn xgboost
```

**Required model files (place in same directory):**
```
model_xgb_tuned.pkl
scaler_team2.pkl
feature_order.json
```

**Start the server:**
```bash
uvicorn main:app --reload --port 8000
```

**Test:**
```
http://localhost:8000/docs   ← Swagger UI
```

---

## Key Differences Between the Two Modules

| Aspect | CLI Module | API Module |
|---|---|---|
| Interface | Terminal input/output | REST API (JSON) |
| Prediction method | Fixed baseload + wattage math | XGBoost + physics blend |
| Scenario B logic | Subsidizes fixed + entitlement energy | Charges only for excess units |
| FPPCA rate | ₹0.39/unit | ₹0.44/unit |
| Optimization plan | Printed to console | Delegated to frontend |
| Deployment | Local script | FastAPI server |

---

## Dependencies

```
fastapi
uvicorn
joblib
numpy
pandas
pydantic
scikit-learn
xgboost
```

---

## Team & Context

- **Team:** Team 3
- **Program:** SJBIT × IIMSTC Internship 2026
- **Domain:** Smart Energy · BESCOM Domestic Tariff Optimization
- **Scheme:** Gruha Jyothi Scheme (GJS), Karnataka 2026

import math
from typing import Dict, List, Tuple

# ============================================================
# FIXED PARAMETERS — UPDATED FOR 2026 GRUHA JYOTHI RULES
# ============================================================
BASELOAD_UNITS = 70.5

HCA_WATTS = {
    "air_conditioner": 1500,
    "geyser": 2000,
    "washing_machine": 500,
    "iron": 1000,
    "microwave": 1200,
    "cooler": 250
}

HCA_ALIASES = {
    "ac": "air_conditioner", "a/c": "air_conditioner",
    "wm": "washing_machine", "washer": "washing_machine",
    "geyser": "geyser", "iron": "iron", "mw": "microwave", "cooler": "cooler"
}

# BESCOM Rates (Verified 2026)
FIXED_RATE_PER_KW = 145.0
CONNECTED_LOAD_KW = 3.0
ENERGY_RATE = 5.80
FPPCA_RATE = 0.39        
PG_SURCHARGE_RATE = 0.36
TAX_RATE = 0.09          
GRUHA_JYOTI_MAX_LIMIT = 200 

def parse_hca_hours(hours_input: str) -> Dict[str, float]:
    hours = {}
    for item in hours_input.split(","):
        item = item.strip().lower()
        if ":" in item:
            try:
                name, hrs = item.split(":")
                name = HCA_ALIASES.get(name.strip(), name.strip())
                if name in HCA_WATTS:
                    hours[name] = float(hrs.strip())
            except: continue
    return hours

# ============================================================
# CORE ENGINE: GRUHA JYOTHI DIGITAL TWIN
# ============================================================
class BESCOMSlabOptimizer:

    def calculate_bill_breakdown(self, units: float, entitlement: float):
        """
        Calculates BESCOM bill based on the 3-Scenario Logic:
        Scenario A: Consumption <= Entitlement (Zero Bill)
        Scenario B: Entitlement < Consumption <= 200 (Partial Bill)
        Scenario C: Consumption > 200 (Full Bill - Subsidy Forfeited)
        """
        # --- Pre-Subsidy Calculations (The Four Pillars) ---
        fixed = FIXED_RATE_PER_KW * CONNECTED_LOAD_KW
        energy = units * ENERGY_RATE
        fppca = units * FPPCA_RATE
        pg_surcharge = units * PG_SURCHARGE_RATE
        subtotal = fixed + energy + fppca + pg_surcharge
        tax = subtotal * TAX_RATE
        gross_total = subtotal + tax

        # --- Applying Gruha Jyothi Logic ---
        subsidy_amount = 0.0
        scenario = ""

        if units > GRUHA_JYOTI_MAX_LIMIT:
            # Scenario C: Cliff Edge - No Subsidy
            scenario = "CLIFF_EDGE"
            payable = gross_total
        elif units <= entitlement:
            # Scenario A: Zero Bill Zone
            scenario = "ZERO_BILL"
            subsidy_amount = gross_total
            payable = 0.0
        else:
            # Scenario B: Partial Payment Zone
            scenario = "PARTIAL"
            # Government covers Fixed Charges + Energy cost of Entitlement units
            energy_subsidy = entitlement * ENERGY_RATE
            # In Scenario B, taxes on the subsidized portion are also waived
            subsidy_subtotal = fixed + energy_subsidy
            subsidy_amount = subsidy_subtotal + (subsidy_subtotal * TAX_RATE)
            payable = max(0.0, gross_total - subsidy_amount)

        return round(payable, 2), scenario, {
            "gross": round(gross_total, 2),
            "subsidy": round(subsidy_amount, 2),
            "payable": round(payable, 2),
            "fixed": fixed,
            "energy": energy,
            "tax": tax
        }

    def get_optimization_strategy(self, total_units: float, entitlement: float, hca_usage: Dict[str, float]):
        if total_units <= entitlement:
            return ["✅ Scenario A: You are within your Entitlement. Bill is ₹0."]

        # Calculate potential loss if over 200
        full_bill, _, _ = self.calculate_bill_breakdown(total_units, entitlement)
        
        target = entitlement if total_units <= 200 else 200
        excess = total_units - target
        
        strategy = []
        if total_units > 200:
            strategy.append(f"🚨 ALERT: You are at {total_units:.1f} units. Because you are over the 200-unit limit, your subsidy is forfeited!")
            strategy.append(f"   Potential Bill: ₹{full_bill:.2f}")
        else:
            strategy.append(f"⚠️  You are {excess:.1f} units over your Entitlement ({entitlement} units).")

        # Optimization Logic
        sorted_hca = sorted(hca_usage.items(), key=lambda x: HCA_WATTS.get(x[0], 0), reverse=True)
        remaining_excess = excess
        for app, hours in sorted_hca:
            if remaining_excess <= 0: break
            u_per_hr = (HCA_WATTS[app] * 30) / 1000.0
            hrs_to_cut = min(hours, remaining_excess / u_per_hr)
            if hrs_to_cut > 0.05:
                strategy.append(f"🔹 {app.upper()}: Reduce by {hrs_to_cut:.1f} hrs/day ({hrs_to_cut*60:.0f} mins) → saves {hrs_to_cut*u_per_hr:.1f} units.")
                remaining_excess -= (hrs_to_cut * u_per_hr)

        if total_units > 200 and remaining_excess <= 0:
            strategy.append(f"\n🎯 PROJECTED SAVINGS: ₹{full_bill:.2f} (Zero/Partial Bill restored).")
        
        return strategy

# ============================================================
# PRESENTATION CLI
# ============================================================
if __name__ == "__main__":
    engine = BESCOMSlabOptimizer()
    print("=" * 55 + "\n🚀 BESCOM Smart Bill Optimizer (2026 GJS Edition)\n" + "=" * 55)

    entitlement = float(input("📋 Enter your Personal Entitlement Limit (Units): ") or 0)
    print("\n💡 NOTE: Use 'Seva Sindhu' Delink Facility if you moved recently to reset this limit.")

    hours_raw = input("\n⚡ Usage (e.g., ac:6, geyser:1.5): ")
    hca_usage = parse_hca_hours(hours_raw)

    # Prediction
    hca_units = sum((HCA_WATTS.get(app, 0) * hrs * 30) / 1000 for app, hrs in hca_usage.items())
    total_predicted = BASELOAD_UNITS + hca_units
    
    # Bill
    bill, scenario, d = engine.calculate_bill_breakdown(total_predicted, entitlement)

    print("\n" + "=" * 55 + "\n📊 CONSUMPTION BREAKDOWN")
    print(f"   Total Predicted: {total_predicted:.1f} kWh | Entitlement: {entitlement} units")
    
    print("\n💰 BILL ESTIMATE")
    if scenario == "ZERO_BILL":
        print(f"   STATUS: ✅ ZERO BILL ZONE\n   Payable: ₹0.00 (Full Subsidy Applied)")
    elif scenario == "PARTIAL":
        print(f"   STATUS: ⚠️ PARTIAL PAYMENT ZONE\n   Gross Bill: ₹{d['gross']}\n   GJS Subsidy: -₹{d['subsidy']}\n   NET PAYABLE: ₹{bill}")
    else:
        print(f"   STATUS: ❌ CLIFF EDGE (OVER 200)\n   Subsidy Forfeited. NET PAYABLE: ₹{bill}")

    print("\n🎯 OPTIMIZATION PLAN")
    for step in engine.get_optimization_strategy(total_predicted, entitlement, hca_usage):
        print(f"   {step}")
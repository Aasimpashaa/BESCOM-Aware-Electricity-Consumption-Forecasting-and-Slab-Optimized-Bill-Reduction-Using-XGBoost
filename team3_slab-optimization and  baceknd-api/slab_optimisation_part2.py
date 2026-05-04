from slab_optimisation_part1 import (
    BESCOMSlabOptimizer, parse_hca_hours,
    BASELOAD_UNITS, HCA_WATTS, GRUHA_JYOTI_MAX_LIMIT
)

# ============================================================
# OPTIMIZATION STRATEGY (continued from Part 1)
# ============================================================

def get_optimization_strategy(self, total_units: float, entitlement: float, hca_usage: dict):
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

# Bind method to class
BESCOMSlabOptimizer.get_optimization_strategy = get_optimization_strategy

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

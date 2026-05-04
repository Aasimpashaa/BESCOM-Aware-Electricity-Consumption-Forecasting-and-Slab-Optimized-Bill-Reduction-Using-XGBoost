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

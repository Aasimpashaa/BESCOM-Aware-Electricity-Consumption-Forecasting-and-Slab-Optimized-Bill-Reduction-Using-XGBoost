# Team 2 Model Files

Place the following files exported by Team2_ModelDevelopment.ipynb in this folder:

| File | Source cell | Description |
|------|------------|-------------|
| `model_xgb_tuned.pkl` | Cell 12 (`joblib.dump(tuned_xgb, ...)`) | Optuna-tuned XGBoost regressor |
| `scaler_team2.pkl`    | Cell 12 (`joblib.dump(scaler, ...)`)   | StandardScaler fitted on 15 continuous features only |

> **Important:** Do NOT use `scaler.pkl` from v3 — it was fitted on a different feature set
> and will corrupt predictions. The Team 2 scaler must NOT be applied to binary columns
> (has_ac_1ton, has_ac_1_5ton, has_geyser, has_wm, has_microwave, has_cooler, has_iron,
>  has_any_ac, high_occupancy, partial_month). This is handled automatically in main.py.

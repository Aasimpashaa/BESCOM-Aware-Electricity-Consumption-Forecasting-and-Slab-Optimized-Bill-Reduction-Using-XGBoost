# Team 2 — Model Development & Tuning

**Project:** BESCOM-Aware Residential Electricity Consumption Forecasting and Slab Optimization using XGBoost Regression  
**Internship:** IIMSTC × VTU Interdisciplinary Research Internship (Feb 2026 onwards)  
**Team size:** 4 members

---

## What this folder contains

Team 2 takes the preprocessed dataset from Team 1 and owns the full model pipeline — from leakage audit and train/test splitting, through baseline model training, Optuna hyperparameter tuning, SHAP explainability, and final model export. The exported `.pkl` files are consumed by Team 3 (backend API) and Team 4 (frontend dashboard).

---

## Notebooks — one per member

| File | Member | Responsibility |
|---|---|---|
| `Team2_ModelDevelopment.ipynb` | All (combined reference) | Full end-to-end pipeline walkthrough |
| `TEAM2_MEM1.ipynb` | Member A | Data leakage audit · Train/Val/Test split · StandardScaler fit |
| `Team2_Mem2.ipynb` | Member B | Baseline models — Linear Regression, Ridge, Lasso, Random Forest, XGBoost baseline |
| `Team2_Mem3.ipynb` | Member C | Optuna hyperparameter tuning (75 trials, TPE sampler) · 5-fold cross-validation |
| `Team2_Mem4.ipynb` | Member D | SHAP explainability · Waterfall plots · Final model + scaler export |

> **Note:** The integrated frontend dashboard notebook lives in `team4_frontend/` — Team 4 owns that file.

---

## Exported files (handoff to Team 3 & 4)

| File | Description |
|---|---|
| `model_xgb_tuned.pkl` | Final tuned XGBoost regressor (joblib serialised) |
| `scaler_team2.pkl` | StandardScaler fitted on `X_train` only — must be applied to all inference inputs |
| `shap_explainer.pkl` | SHAP TreeExplainer for per-prediction explanation in the API |
| `feature_order.json` | Exact list of 25 features in the order the model expects — Team 3 must follow this strictly |

---

## Feature set (25 features)

The model expects features in this exact order (also in `feature_order.json`):

```
hist_avg_units, hist_trend, num_people, days_home,
month_sin, month_cos, baseload_kwh,
ac_1ton_kwh, ac_1_5ton_kwh, geyser_kwh, wm_kwh,
microwave_kwh, cooler_kwh, iron_kwh,
has_ac_1ton, has_ac_1_5ton, has_geyser, has_wm,
has_microwave, has_cooler, has_iron,
total_hca_kwh, has_any_ac, high_occupancy, partial_month
```

**Binary features** (do NOT scale): `has_*`, `has_any_ac`, `high_occupancy`, `partial_month`  
**Continuous features** (pass through `scaler_team2.pkl`): everything else

---

## Pipeline summary

```
bescom_preprocessed_final.csv  (from Team 1)
        │
        ▼
  [MEM A] Leakage audit → 70/15/15 train/val/test split → StandardScaler (fit on train only)
        │
        ▼
  [MEM B] Baseline models trained & compared
          Linear Regression · Ridge · Lasso · Random Forest · XGBoost baseline
        │
        ▼
  [MEM C] Optuna tuning (75 trials, TPE, minimise Val MAE) → 5-fold CV on train+val
        │
        ▼
  [MEM D] SHAP explainability → model_xgb_tuned.pkl + scaler_team2.pkl + shap_explainer.pkl
```

---

## Model results

| Model | Val R² | Val MAE |
|---|---|---|
| Physics baseline | ~0.30 | ~55–70 units |
| Linear Regression | ~0.65–0.72 | ~35–45 units |
| Ridge | ~0.67–0.74 | ~33–43 units |
| Lasso | ~0.66–0.73 | ~34–44 units |
| Random Forest | ~0.88–0.92 | ~22–28 units |
| **XGBoost (tuned)** | **~0.93** | **~20 units** |

5-fold CV was run on train+val combined. Test set was never used during tuning — touched only once for final evaluation.

---

## Key design decisions

- **Optuna over GridSearchCV** — Bayesian TPE finds good hyperparameters in 75 trials vs thousands of exhaustive fits. Search space: 9 hyperparameters including `n_estimators`, `learning_rate`, `max_depth`, `min_child_weight`, `subsample`, `colsample_bytree`, `gamma`, `reg_alpha`, `reg_lambda`.
- **Scaler fit on train only** — Team 1's scaler was fit on the full dataset (data leakage). Team 2 refits StandardScaler on `X_train` only; `X_val` and `X_test` are only transformed.
- **Binary features not scaled** — `has_*` flags, `has_any_ac`, `high_occupancy`, `partial_month` are already 0/1 and must not pass through StandardScaler.
- **SHAP TreeExplainer** — used on the test set for global importance and per-household waterfall explanations. The explainer is exported so Team 3 can serve per-prediction SHAP values through the API without re-computing.
- **RMSE intentionally omitted** — disproportionate penalty for large errors is not appropriate for this billing use case. R² and MAE are the primary metrics.

---

## How to run

### Prerequisites

```bash
pip install pandas numpy scikit-learn xgboost optuna shap joblib matplotlib seaborn
```

### Run order

Run notebooks in this order (each member's notebook depends on outputs from the previous):

1. `TEAM2_MEM1.ipynb` — produces `X_train_sc`, `X_val_sc`, `X_test_sc`, `scaler_team2.pkl`
2. `Team2_Mem2.ipynb` — produces baseline model comparison table
3. `Team2_Mem3.ipynb` — produces `best_params.json`, CV results
4. `Team2_Mem4.ipynb` — produces `model_xgb_tuned.pkl`, `shap_explainer.pkl`

Or run `Team2_ModelDevelopment.ipynb` end-to-end for a single combined walkthrough.

### Input file

Place `bescom_preprocessed_final.csv` (from Team 1) in the same directory before running.

---

## Branch convention

```
team2/leakage-audit
team2/baseline-models
team2/optuna-tuning
team2/shap-export
```

Merge into `dev` after review. Never push directly to `main`.

---

## Handoff checklist for Team 3

Before Team 3 starts integrating, confirm all of these are present in `team2_models/saved_models/`:

- [ ] `model_xgb_tuned.pkl`
- [ ] `scaler_team2.pkl`
- [ ] `shap_explainer.pkl`
- [ ] `feature_order.json`

Team 3's inference code must load the scaler and transform input features **before** passing them to the model. Binary features (`has_*`, `has_any_ac`, `high_occupancy`, `partial_month`) must be excluded from scaling.

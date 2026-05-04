# README — Team 1: Data Preprocessing
### BESCOM Electricity Consumption Prediction Project

---

## 👤 Owner
**Team 1** — Data Preprocessing & EDA  
Notebook: `Part1_DataPreprocessing.ipynb`

---

## 📋 Overview

This notebook covers the first half of the ML pipeline for predicting monthly electricity consumption (in kWh) for BESCOM households. It prepares a clean, validated dataset that is handed off to Team 2 for feature engineering and model training.

---

## 📁 Files

| File | Description |
|------|-------------|
| `Part1_DataPreprocessing.ipynb` | This notebook — EDA + preprocessing |
| `bescom_syn.csv` | Raw input dataset (required to run) |
| `bescom_preprocessed_final.csv` | **Output** — cleaned dataset for Team 2 |

---

## 🔄 What This Notebook Does

### Part 1 — Dataset Load
- Loads `bescom_syn.csv`
- Prints shape, column inventory, data types, and sample values
- Defines `TRAINING_FEATURES` (22 columns) and `AUDIT_COLS`

### Part 2 — Exploratory Data Analysis (EDA)
- **Cell 2.1** — Data quality audit: nulls, duplicates, zero-variance columns, negative values
- **Cell 2.2** — Target distribution (`actual_units`) and Q-Q normality check
- **Cell 2.3** — Outlier detection via IQR method on key columns (box plots)
- **Cell 2.4** — Appliance ownership rates vs. Indian survey benchmarks (NSS 2024, IRES 2020, CPHS 2019)
- **Cell 2.5** — Correlation heatmap across all 22 training features + target
- **Cell 2.6** — Seasonal consumption patterns, Gruha Jyoti slab distribution, entitlement analysis

### Part 3 — Data Preprocessing
- **Cell 3.1** — Duplicate row removal + missing value verification
- **Cell 3.2** — IQR outlier removal on `actual_units` (target only; feature outliers retained)
- **Cell 3.3** — Drop audit columns: `month` (raw int, cyclical encoding already exists) and `theoretical_units` (data leakage risk)
- **Cell 3.4** — Preprocessing summary with row counts at each step

---

## 📤 Handoff to Team 2

The notebook saves `bescom_preprocessed_final.csv` — this is the input for `Part2_FeatureEngineering.ipynb`.

**State of the data at handoff:**
- Duplicates removed
- IQR outliers on `actual_units` removed
- Audit columns (`month`, `theoretical_units`) dropped
- 22 numeric training features + `actual_units` target
- **Not yet scaled** — scaling must happen inside the model notebook after `train_test_split`

> ⚠️ **Important for Team 2:** Do not fit the scaler on the full dataset. Fit only on `X_train` to avoid test data leakage.

```python
# Correct scaling approach (to be done in model notebook)
X_train, X_test, y_train, y_test = train_test_split(...)
scaler = StandardScaler()
X_train[scale_cols] = scaler.fit_transform(X_train[scale_cols])
X_test[scale_cols]  = scaler.transform(X_test[scale_cols])
```

---

## 📦 Dependencies

```
pandas
numpy
matplotlib
seaborn
scipy
scikit-learn
```

Install with:
```bash
pip install pandas numpy matplotlib seaborn scipy scikit-learn
```

---

## ▶️ How to Run

1. Place `bescom_syn.csv` in the same directory as the notebook
2. Run all cells top to bottom (`Kernel → Restart & Run All`)
3. Verify output: `bescom_preprocessed_final.csv` is created
4. Hand off the CSV to Team 2

---

## 🎯 Target Variable

`actual_units` — monthly electricity consumption in kWh (real-world, deviates from the physics formula due to behavioral and seasonal factors).

---

## 📊 Key Findings from EDA

- Dataset is **complete** — zero missing values
- `actual_units` shows a right-skewed distribution with a notable spike near the **200-unit Gruha Jyoti cliff**
- Seasonal summer spike (Mar–May) is visible in actual vs. theoretical consumption
- `hist_avg_units` and `baseload_kwh` show the strongest correlation with target
- Physics formula alone achieves R² ≈ 0.85 — XGBoost is expected to reach ~0.92–0.95

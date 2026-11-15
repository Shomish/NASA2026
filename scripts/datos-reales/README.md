# Real reference data converters

These scripts convert public datasets into the JSON format accepted by
`npm run db:importar`. Raw datasets go in `data/externos/` (ignored by git);
converted JSON goes in `data/convertidos/` (ignored by git). Only these scripts
are committed.

The datasets describe healthy people on Earth. They are **not** astronaut data
and are labeled in the app as reference data.

## 1. Non-EEG (PhysioNet)

- Source: https://physionet.org/content/noneeg/1.0.0/
- Download: `noneeg-1.0.0.zip` into `data/externos/`.
- Output: first 5 subjects, 4 protocol phases -> 20 vital-sign records.
- Temperature is imported as `temperatura_piel_c` (skin temperature), not as core
  temperature, to avoid false hypothermia alerts.

```bash
python -I scripts/datos-reales/noneeg.py \
  --entrada data/externos/noneeg-1.0.0.zip \
  --salida data/convertidos/noneeg.json
```

## 2. BIG IDEAs Lab (PhysioNet)

- Source: https://physionet.org/content/big-ideas-glycemic-wearable/1.1.2/
- The full ZIP is about 5 GB. The converter expects these extracted files in
  `data/externos/`:
  - `bigideas_Demographics.csv`
  - `bigideas_001_Dexcom_001.csv`
  - `bigideas_002_Dexcom_002.csv`
  - `bigideas_003_Dexcom_003.csv`
- Output: 3 subjects, daily minimum glucose. `ayunas = false` because the data
  is continuous glucose monitoring. Only low-glucose alerts apply (< 70 and < 54).

```bash
python -I scripts/datos-reales/bigideas.py \
  --entrada data/externos \
  --salida data/convertidos/bigideas.json
```

## 3. MMASH (PhysioNet)

- Source: https://physionet.org/content/mmash/1.0.0/
- Download and extract `mmash-1.0.0.zip`; the inner `MMASH.zip` is the input.
- Output: one night per subject (subject 11 has no sleep data) -> 21 sleep records.

```bash
python -I scripts/datos-reales/mmash.py \
  --entrada data/externos/extract/mmash/multilevel-monitoring-of-activity-and-sleep-in-healthy-people-1.0.0/MMASH.zip \
  --salida data/convertidos/mmash.json
```

## 4. NHANES 2021–2023 (CDC)

- BPXO_L: https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2021/DataFiles/BPXO_L.xpt
- DPQ_L: https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2021/DataFiles/DPQ_L.xpt
- GLU_L: https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2021/DataFiles/GLU_L.xpt
- Output: 2 people with valid BP, PHQ-9, and fasting glucose.
- DPQ_L answers 7 (refused) and 9 (don't know) are discarded; all nine items must
  be valid. Empty BP readings are discarded.

```bash
python -I scripts/datos-reales/nhanes.py \
  --entrada data/externos \
  --salida data/convertidos/nhanes.json
```

## 5. Import

Always run a dry-run first:

```bash
npm run db:importar -- data/convertidos/noneeg.json --dry-run
npm run db:importar -- data/convertidos/noneeg.json
```

The importer is idempotent for records with the same crew member, type, timestamp,
and origin. It generates alerts with the same thresholds used by the app.

## Licenses

- Non-EEG: PhysioNet; cite Birjandtalab et al. (2016).
- BIG IDEAs: ODC-BY 1.0; cite Cho, Kim, Bent, and Dunn.
- MMASH: PhysioNet; follow the dataset license.
- NHANES: public domain (CDC).
- Always cite PhysioNet: Goldberger et al. (2000), Circulation 101(23), e215–e220.

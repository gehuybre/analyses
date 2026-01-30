# Gemeentelijke Investeringen Analyse

## Databronnen

De data komt van gemeentelijke meerjarenplannen voor drie legislaturen:
- **2014-2019**: Rapportjaar 2014 (boekjaren 2014-2020)
- **2020-2025**: Rapportjaar 2020 (boekjaren 2020-2027)
- **2026-2031**: Rapportjaar 2026 (boekjaren 2026-2033)

## Data Indeling

Er zijn twee classificatiesystemen:

### 1. REK: Economische rekening
Investeringen ingedeeld volgens economische categorieën:
- **Niveau 1**: I Investeringsverrichtingen
- **Niveau 2**: I.1 Investeringsuitgaven
- **Niveau 3**:
  - I.1.A Investeringen in financiële vaste activa
  - I.1.B Investeringen in materiële vaste activa
  - I.1.C Investeringen in immateriële vaste activa
  - I.1.D Toegestane investeringssubsidies
- **Alg. rekening**: Gedetailleerde rekening codes (bijv. REK2802)

### 2. BV: Beleidsdomein
Investeringen ingedeeld volgens beleidsvelden:
- **BV_domein**: Hoofddomein (bijv. "0 Algemene financiering", "1 Maatschappelijke participatie")
- **BV_subdomein**: Subdomein (bijv. "02 Zich verplaatsen en mobiliteit", "011 Algemene diensten")
- **Beleidsveld**: Gedetailleerd beleidsveld (bijv. "0020 Fiscale aangelegenheden")

## Data Structuur

Beide output bestanden bevatten:
- **NIS_code**: Gemeentecode
- **Rapportjaar**: Start van legislatuur (2014, 2020, 2026)
- **Boekjaar**: Jaar van investering
- **Totaal**: Totale investeringsuitgave in euro
- **Per_inwoner**: Uitgave per inwoner in euro

## Visualisatie Doelen

Het blogbericht moet twee hoofdsecties bevatten:

### Sectie 1: Per Beleidsdomein (BV)
- **Filters**: BV_domein → BV_subdomein → Beleidsveld (hierarchisch)
- **Visualisatie**: Per gemeente investeringen over 3 legislaturen
  - X-as: Rapportjaar (2014, 2020, 2026)
  - Y-as: Totale uitgave of uitgave per inwoner
  - Per lijn: 1 gemeente

### Sectie 2: Per Economische Rekening (REK)
- **Filters**: Niveau_3 → Alg_rekening (hierarchisch)
- **Visualisatie**: Per gemeente investeringen over 3 legislaturen
  - X-as: Rapportjaar (2014, 2020, 2026)
  - Y-as: Totale uitgave of uitgave per inwoner
  - Per lijn: 1 gemeente

## Data Processing

Verwerk bronbestanden met:
```bash
python3 src/process_investments.py
```

Dit genereert:
- `results/investments_rek.parquet` (0.81 MB)
- `results/investments_bv.parquet` (0.40 MB)

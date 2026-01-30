"""
Data consistency check: Controleer of inwonersaantallen consistent zijn per gemeente per jaar.
"""

import pandas as pd
import os

# Pad naar de data
RESULTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'results')
INPUT_FILE = os.path.join(RESULTS_DIR, 'investments_tidy.csv')

# Lees de data
df = pd.read_csv(INPUT_FILE)

print(f"Dataset geladen: {df.shape}")
print(f"Kolommen: {list(df.columns)}\n")

# Bereken het aantal inwoners voor elke rij
# Inwoners = Totaal / Per_inwoner
# Let op: vermijd deling door nul
df['Berekende_inwoners'] = df.apply(
    lambda row: row['Totaal'] / row['Per_inwoner'] if row['Per_inwoner'] != 0 else None,
    axis=1
)

print("Berekende inwoners toegevoegd\n")

# Groepeer per gemeente en jaar en check de variatie in berekende inwoners
print("="*80)
print("CONSISTENTIE CHECK: Inwonersaantallen per gemeente per jaar")
print("="*80)

# Groepeer per gemeente en rapportjaar
grouped = df.groupby(['Gemeente', 'Rapportjaar'])['Berekende_inwoners'].agg(['mean', 'std', 'min', 'max', 'count'])

# Vind groepen met significante variatie (std > 1 betekent meer dan 1 persoon variatie)
inconsistent = grouped[grouped['std'] > 1].copy()
inconsistent['verschil'] = inconsistent['max'] - inconsistent['min']
inconsistent = inconsistent.sort_values('verschil', ascending=False)

if len(inconsistent) > 0:
    print(f"\n⚠️  GEVONDEN: {len(inconsistent)} gemeente-jaar combinaties met inconsistente inwonersaantallen")
    print(f"\nTop 20 grootste inconsistenties:")
    print(inconsistent.head(20).to_string())
    
    # Detail voor de grootste afwijking
    if len(inconsistent) > 0:
        top_issue = inconsistent.iloc[0]
        gemeente = inconsistent.index[0][0]
        jaar = inconsistent.index[0][1]
        
        print(f"\n{'='*80}")
        print(f"DETAIL VOOR GROOTSTE AFWIJKING: {gemeente} ({jaar})")
        print(f"{'='*80}")
        
        detail = df[(df['Gemeente'] == gemeente) & (df['Rapportjaar'] == jaar)][
            ['BV_domein', 'BV_subdomein', 'Totaal', 'Per_inwoner', 'Berekende_inwoners']
        ].copy()
        detail = detail.sort_values('Berekende_inwoners')
        
        print(f"\nAantal rubrieken: {len(detail)}")
        print(f"Min inwoners: {detail['Berekende_inwoners'].min():.2f}")
        print(f"Max inwoners: {detail['Berekende_inwoners'].max():.2f}")
        print(f"Verschil: {detail['Berekende_inwoners'].max() - detail['Berekende_inwoners'].min():.2f}")
        
        print(f"\nEerste 10 rijen (laagste inwonersaantallen):")
        print(detail.head(10).to_string())
        
        print(f"\nLaatste 10 rijen (hoogste inwonersaantallen):")
        print(detail.tail(10).to_string())
else:
    print("\n✅ GEEN INCONSISTENTIES GEVONDEN")
    print("Alle gemeente-jaar combinaties hebben consistente inwonersaantallen!")

# Algemene statistieken
print(f"\n{'='*80}")
print("ALGEMENE STATISTIEKEN")
print(f"{'='*80}")

print(f"\nGemiddelde inwonersaantal per gemeente (over alle jaren):")
avg_per_gemeente = df.groupby('Gemeente')['Berekende_inwoners'].mean().sort_values(ascending=False)
print(f"\nTop 10 grootste gemeenten:")
print(avg_per_gemeente.head(10).to_string())

print(f"\nTop 10 kleinste gemeenten:")
print(avg_per_gemeente.tail(10).to_string())

# Check voor rijen waar per_inwoner = 0 maar totaal != 0
zero_per_inw = df[(df['Per_inwoner'] == 0) & (df['Totaal'] != 0)]
if len(zero_per_inw) > 0:
    print(f"\n{'='*80}")
    print(f"⚠️  WAARSCHUWING: {len(zero_per_inw)} rijen met Per_inwoner=0 maar Totaal≠0")
    print(f"{'='*80}")
    print(zero_per_inw[['Gemeente', 'Rapportjaar', 'BV_domein', 'Totaal', 'Per_inwoner']].head(20))

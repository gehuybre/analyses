# Git LFS

We gebruiken Git LFS om grote data-bestanden uit de repository-geschiedenis te houden. Dit voorkomt trage clones en keeps de Git-history licht.

## Wat staat er nu in LFS

De huidige LFS-regels staan in `.gitattributes`:

- `embuild-analyses/public/data/**/*.json` (publieke, gechunkte JSON-data)
- `embuild-analyses/analyses/**/results/*.json` (grote analyse-output)
- `embuild-analyses/public/maps/*.json` (GeoJSON kaarten)

## Gebruik

Installeer en activeer LFS (eenmalig per machine):

```sh
git lfs install
```

LFS-bestanden binnenhalen na een clone:

```sh
git lfs pull
```

LFS-status controleren:

```sh
git lfs ls-files
```

## Alternatief: data buiten deze repo (GitHub Pages)

Als deploys traag zijn of LFS-bandwidth op is, kun je grote data-bestanden verplaatsen naar een aparte data-repo en die via GitHub Pages publiceren.

Kort stappenplan:

1. Maak een nieuwe repo (bv. `data-blog-data`).
2. Kopieer de public data:
   - `embuild-analyses/public/data/**` → `data/**`
   - `embuild-analyses/public/analyses/**` → `analyses/**`
   - `embuild-analyses/analyses/**/results/**` → `analyses/**/results/**`
3. Zet GitHub Pages aan op die repo (root).
4. Zet `NEXT_PUBLIC_DATA_BASE_URL` in je build/deploy naar:
   - `https://<github-user>.github.io/<data-repo>`
   - In GitHub Actions kan dit via repo variable `DATA_BASE_URL`.
5. Deploy de site opnieuw.

Met `NEXT_PUBLIC_DATA_BASE_URL` haalt de site data van de data-repo (runtime fetch). Zonder die variabele blijft alles lokaal werken.

## Nieuwe LFS-regels toevoegen

1. Voeg een pattern toe in `.gitattributes`.
2. Commit `.gitattributes`.
3. Voeg de bestanden opnieuw toe zodat ze door LFS worden opgepakt:

```sh
git add path/to/file
```

Tip: als je bestaande, grote bestanden naar LFS wil migreren, overleg even, zodat we een gecontroleerde rewrite kunnen doen.

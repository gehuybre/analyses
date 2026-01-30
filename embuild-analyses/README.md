This is the Embuild blog website (Next.js).

Data is served from the separate `gehuybre/data` GitHub Pages repo and fetched at runtime via:
`NEXT_PUBLIC_DATA_BASE_URL` (example: `https://gehuybre.github.io/data`).

## Getting Started

First, set the data base URL (local dev):

```bash
echo "NEXT_PUBLIC_DATA_BASE_URL=https://gehuybre.github.io/data" > .env.local
```

Install dependencies:

```bash
npm install --legacy-peer-deps
```

Then run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Data updates

Generate or update analysis results in the `analyses` repo, then export to the data repo:

```bash
cd ../
python scripts/export_data_repo.py --clean
```

Commit + push the `data` repo, and GitHub Pages will serve the new JSON.

## Deploy on GitHub Pages

This repo is configured for GitHub Pages via `.github/workflows/pages.yml`.

Steps:
1) Enable Pages in the GitHub repo settings (Source: GitHub Actions).
2) Push to `main` — the workflow will build and deploy automatically.

The site will be available at:
`https://gehuybre.github.io/analyses`

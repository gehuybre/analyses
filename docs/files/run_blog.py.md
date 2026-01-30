---
kind: file
path: run_blog.py
role: Entrypoint
workflows:
  - WF-project-setup
inputs: []
last_reviewed: 2026-01-17
---

# run_blog.py

A Python script to start the Next.js development server and open the blog in the default web browser.

## Usage

Run from the root of the repository:

```bash
python run_blog.py
```

It executes `npm run dev` in the `embuild-analyses` directory and opens `http://localhost:3000`.

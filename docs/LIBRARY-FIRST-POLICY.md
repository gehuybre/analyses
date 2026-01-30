# Library-First Policy 📚

**Goal:** Prefer well-maintained libraries over bespoke utilities for non-trivial functionality, to reduce bugs, improve security, and speed development.

## Rules ✅

- **No Reinventing Wheels.** Before writing any utility function longer than 10 lines, search for an existing, well-maintained npm package.
- **Dependency Audit.** Every 5th prompt when interacting with the assistant run a "Dependency Check" (see below).
- **Cost-Benefit.** Prefer established libraries for security, data validation, and complex CLI handling.
- **Exceptions.** Small, trivial helpers (1–10 lines) that are readable and well-tested may remain custom.

---

## How we enforce this in the repo 🔧

- ESLint rule: `max-lines-per-function` is configured (warn at >10 effective lines).
- `scripts/library_audit.js` is added to scan for long functions and suggest packages.
- There is no GitHub workflow for the audit; run the audit locally with `npm run library-audit-triage` which runs the audit and generates the triage report (`out/library-audit.json` + `docs/files/library-audit-triage.md`).

### Interpreting the report

- The audit is heuristic and conservative: it highlights *areas to review*, not mandatory fixes.
- Each finding includes file, start/end lines, an effective line count, and package suggestions.
- To enforce (fail CI) on suggestions, maintainers can opt into `--fail-on-suggestions` in the workflow.

---

## How to run locally 🧭

- Run the audit: `npm run library-audit`
- Run an interactive upgrade check: `npm run ncu` (uses `npm-check-updates` via npx)

---

## "Dependency Check" & "Optimization Vibe"

- Every 5th chat prompt with the assistant: perform a "Dependency Check".
- Use the prompt: "I want to do a Library Audit. Look through the src folder and identify any custom logic I've written that could be replaced by a standard npm package..."
- The `library_audit` script produces suggestions; review them and decide before refactoring.

---

## Recommended packages (examples)

- Dates: `date-fns` — modern, tree-shakable utilities. Benefit: concise, well-tested formatting/parsing helpers (format, parse, compare), strong i18n/locale support. Docs: https://github.com/date-fns/date-fns
- Validation: `zod` — TypeScript-first schema validation. Benefit: expressive schemas, type-safe parsing (.parse/.safeParse), refinements and async validation for robust runtime checks. Docs: https://github.com/colinhacks/zod
- Utilities: `lodash` — stable utility belt (or `lodash-es` for ESM). Benefit: battle-tested helpers for arrays/objects (groupBy, uniq, get, pick) that cover many edge cases and save boilerplate. Docs: https://github.com/lodash/lodash
- Concurrency: `p-limit` — simple promise concurrency control. Benefit: tiny API to limit simultaneous async operations (ideal for batching network/IO work). Docs: https://github.com/sindresorhus/p-limit
- File upload: `multer` — battle-tested multipart/form-data handler for Express. Benefit: flexible disk or memory storage, file filters, limits and field-level controls to avoid reinventing upload parsing. Docs: https://github.com/expressjs/multer

---

## Package summaries (Context7 highlights)

- `date-fns` — Provides immutable, tree-shakable functions for date manipulation, formatting, and parsing in JavaScript. Emphasizes functional programming with pure functions that don't mutate input dates, supports internationalization through locales, and offers consistent formatting tokens. Best practices include importing specific functions for better tree-shaking, using ISO date strings for parsing, and leveraging locale options for user-friendly formatting. Docs: https://github.com/date-fns/date-fns

- `zod` — TypeScript-first schema validation library that enables runtime type checking and data validation with a fluent API. Supports parsing data with .parse() for throwing errors or .safeParse() for error handling, and includes built-in validators for strings, numbers, objects, and more. Best practices involve defining schemas with descriptive error messages, chaining refinements for complex validation, and using inferred types for type safety. Docs: https://github.com/colinhacks/zod

- `lodash` — Utility library delivering consistent, performant methods for manipulating arrays, objects, strings, and other data types. Handles edge cases robustly, supports chaining for complex operations, and offers both mutable and immutable variants. Best practices emphasize cherry-picking imports for smaller bundles, preferring lodash methods over native implementations for reliability, and using the FP variant for functional programming styles. Docs: https://github.com/lodash/lodash

- `p-limit` — Lightweight utility for controlling the concurrency of promise-returning functions, preventing resource exhaustion in async operations. Creates a limiter function that queues excess promises until earlier ones resolve, with options for custom concurrency levels. Best practices involve setting concurrency based on system capabilities or API limits, using it with Promise.all for batch processing, and monitoring active/pending counts for debugging. Docs: https://github.com/sindresorhus/p-limit

- `multer` — Express middleware for multipart/form-data: `upload.single()`, `upload.array()`, `upload.fields()`, `upload.none()`, memory/disk storage config, `fileFilter` and `limits` options to protect against large uploads. Docs: https://github.com/expressjs/multer

---

## Opencode Agents & How to use 🚀

We added dedicated OpenCode agents to automate the Library-First workflow:

- `@raptor-library` — orchestrator: runs audits, updates the policy, and creates triage suggestions.
- `@raptor-library-audit` — runs `npm run library-audit` and ensures `out/library-audit.json` exists.
- `@raptor-library-context7` — fetches package docs and small examples from Context7 and appends them to the policy.
- `@raptor-library-policy` — updates `docs/LIBRARY-FIRST-POLICY.md` with snippets and clarifications.
- `@raptor-library-triage` — generates `docs/files/library-audit-triage.md` (prioritized top-10 findings).

Typical commands (in OpenCode):
- `@raptor-library run audit and produce triage` — runs audit + triage and writes `docs/files/library-audit-triage.md`.
- `@raptor-library-context7 summarize zod and date-fns and add snippets` — fetches docs and snippets and appends them to the policy.

> Tip: review the triage output before making edits or PRs. Agents prepare the work; a human should approve any replace-or-refactor.

## Notes

- This is guidance, not an absolute ban; if a custom solution is justified, document the reasons in the PR description.


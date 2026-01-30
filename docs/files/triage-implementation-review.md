---
kind: file
path: docs/files/library-audit-triage.md
role: Implementation review for library audit triage
workflows: []
inputs: []
outputs: []
interfaces: []
stability: experimental
owner: Unknown
safe_to_delete_when: When triage items are implemented or archived
superseded_by: null
last_reviewed: 2026-01-25
---

# Triage Implementation Review

This document reviews the top 10 triage items from the library audit for potential implementation of suggested libraries to reduce long functions.

## 1. embuild-analyses/src/components/analyses/prijsherziening/PrijsherzieningDashboard.tsx:82-712
**Suggested libraries:** date-fns, zod  
**Lines:** 577  
**Review:** Large dashboard component with state management, date formatting, and price calculations. date-fns can simplify date operations (e.g., formatMonth function). zod can validate input states and calculations.  
**Feasibility:** High (straightforward replacements)  
**Effort:** Medium (refactor calculations and validation)  
**Impact:** High (reduces 577 lines significantly)

## 2. embuild-analyses/src/components/analyses/gemeentelijke-investeringen/InvesteringenEmbed.tsx:171-781
**Suggested libraries:** date-fns, zod  
**Lines:** 505  
**Review:** Embed component with complex data processing and rendering. date-fns for date handling, zod for data validation schemas.  
**Feasibility:** High  
**Effort:** Medium  
**Impact:** High

## 3. embuild-analyses/src/app/embed/[slug]/[section]/EmbedClient.tsx:125-679
**Suggested libraries:** zod  
**Lines:** 450  
**Review:** Client-side embed logic with extensive validation. zod schemas can replace manual validation checks.  
**Feasibility:** High  
**Effort:** Medium  
**Impact:** High

## 4. embuild-analyses/src/components/analyses/gemeentelijke-investeringen/InvesteringenBVSection.tsx:108-642
**Suggested libraries:** zod, lodash  
**Lines:** 436  
**Review:** Data section with validation and utility operations. zod for schemas, lodash for data manipulation.  
**Feasibility:** High  
**Effort:** Medium  
**Impact:** High

## 5. embuild-analyses/src/components/analyses/gemeentelijke-investeringen/InvesteringenREKSection.tsx:104-639
**Suggested libraries:** zod, lodash  
**Lines:** 422  
**Review:** Similar to above, REK section with validation and data utils.  
**Feasibility:** High  
**Effort:** Medium  
**Impact:** High

## 6. embuild-analyses/src/components/analyses/betaalbaar-arr/CorrelatiesSection.tsx:53-481
**Suggested libraries:** zod  
**Lines:** 403  
**Review:** Correlations section with data validation logic. zod for schema validation.  
**Feasibility:** High  
**Effort:** Medium  
**Impact:** High

## 7. embuild-analyses/src/components/analyses/gemeentelijke-investeringen/InvesteringenBVTopFieldsSection.tsx:88-540
**Suggested libraries:** zod  
**Lines:** 384  
**Review:** Top fields section with validation. zod implementation straightforward.  
**Feasibility:** High  
**Effort:** Medium  
**Impact:** High

## 8. embuild-analyses/src/components/analyses/bouwprojecten-gemeenten/ProjectBrowser.tsx:20-450
**Suggested libraries:** date-fns, zod  
**Lines:** 371  
**Review:** Project browser with date handling and validation. Both libraries applicable.  
**Feasibility:** High  
**Effort:** Medium  
**Impact:** High

## 9. embuild-analyses/src/components/analyses/vergunningen-goedkeuringen/VergunningenDashboard.tsx:36-462
**Suggested libraries:** date-fns  
**Lines:** 359  
**Review:** Dashboard with date manipulation. date-fns for formatting and calculations.  
**Feasibility:** High  
**Effort:** Low (mainly date utils)  
**Impact:** Medium

## 10. embuild-analyses/src/components/analyses/bouwondernemers/BouwondernemersEmbed.tsx:111-503
**Suggested libraries:** zod  
**Lines:** 346  
**Review:** Embed component with validation logic. zod schemas to simplify.  
**Feasibility:** High  
**Effort:** Medium  
**Impact:** High

## Recommendations
- Start with items 1-3 for highest impact (longest functions).
- Prioritize zod implementations as they appear most frequently and offer clear validation benefits.
- Total potential line reduction: ~4000+ lines across top 10 items.
- Next step: Implement one item and measure impact before proceeding.</content>
<parameter name="filePath">docs/files/triage-implementation-review.md
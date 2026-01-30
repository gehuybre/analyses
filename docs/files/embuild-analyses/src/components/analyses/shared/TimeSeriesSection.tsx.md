---
kind: file
path: embuild-analyses/src/components/analyses/shared/TimeSeriesSection.tsx
role: UI Component
last_reviewed: 2026-01-17
---

# TimeSeriesSection.tsx

A shared component for rendering time series data analyses that do not require geographical filtering.

## Overview

`TimeSeriesSection` provides a standardized layout for data that evolves over time (e.g., monthly, quarterly, or yearly trends). It includes a section title, export buttons, and a flexible area for filters and charts.

## Usage

```tsx
import { TimeSeriesSection } from "@/components/analyses/shared/TimeSeriesSection"

// ... inside a component
<TimeSeriesSection
  title="My Trend Analysis"
  slug="my-analysis-slug"
  sectionId="trend-section"
>
  {/* Filters and Charts go here */}
</TimeSeriesSection>
```

## Features

- **Standardized Header**: Consistent placement of title and export buttons.
- **Export Integration**: Automatically handles CSV and Embed code generation via the `ExportButtons` component.
- **Responsive Layout**: Designed to work across different screen sizes.

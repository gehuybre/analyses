---
kind: file
path: embuild-analyses/src/components/mdx-content.tsx
role: UI Component
workflows: []
inputs: []
outputs: []
interfaces:
  - MDXContent (React component)
stability: stable
owner: Unknown
safe_to_delete_when: When MDX content rendering is replaced
superseded_by: null
last_reviewed: 2026-01-05
---

# File: embuild-analyses/src/components/mdx-content.tsx

## Role

Wrapper component for rendering Contentlayer-processed MDX content with proper hydration.

## Why it exists

Provides a simple interface for rendering MDX analysis content that has been processed by Contentlayer into executable code. Uses next-contentlayer's useMDXComponent hook to hydrate the MDX code.

## Used by workflows

None. This is a utility component used when rendering analysis blog posts.

## Inputs

Accepts `code` prop containing pre-compiled MDX code string from Contentlayer.

## Outputs

Renders the MDX component with all interactive elements and React components.

## Interfaces

Exports `MDXContent` component accepting code prop.
Uses 'use client' directive for client-side rendering.

## Ownership and lifecycle

Stability: Stable, core component for blog content rendering.
Safe to delete when: MDX rendering approach changes or Contentlayer is replaced.
Superseded by: None.

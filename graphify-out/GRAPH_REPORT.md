# Graph Report - nawavote  (2026-10-08)

## Corpus Check
- 59 files · ~29,766 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 2, .woff 2, .template 1)

## Summary
- 318 nodes · 613 edges · 25 communities (14 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `eaeda66b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- createClient
- VoteWizard.tsx
- package.json
- react
- Nawa Vote Platform Overview
- compilerOptions
- app/layout.tsx
- dependencies
- ResultsClient.tsx
- generate-tokens.js
- manifest.json
- analytics/page.tsx
- sw.js
- NAWA-VOTE Agent Workflow & Guidelines
- extends
- vote/page.tsx
- next.config.mjs
- postcss.config.mjs
- Arcane Crown Glow
- Modular & Dynamic Code Architecture
- UX Excellence & Attention to Detail
- Workflow & Commitment Protocol
- Arcane Vote Glow Icon

## God Nodes (most connected - your core abstractions)
1. `react` - 29 edges
2. `createClient()` - 23 edges
3. `next` - 22 edges
4. `lucide-react` - 17 edges
5. `VoteWizard()` - 16 edges
6. `compilerOptions` - 15 edges
7. `framer-motion` - 13 edges
8. `NawaLogo()` - 11 edges
9. `createClient()` - 11 edges
10. `syncOfflineVotes()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Rule #2: Always Update Graph on Code Changes` --semantically_similar_to--> `Keep Graph Fresh Protocol`  [INFERRED] [semantically similar]
  AGENTS.md → AGENT.md
- `Rule #1: Check graphify-out First` --semantically_similar_to--> `Knowledge Graph First-Reference (graphify-out/)`  [INFERRED] [semantically similar]
  AGENTS.md → AGENT.md
- `Secure Development Practices` --conceptually_related_to--> `Pull Request Process`  [INFERRED]
  SECURITY.md → CONTRIBUTING.md
- `Nawa Vote Platform Overview` --references--> `Contributor Covenant Code of Conduct`  [EXTRACTED]
  README.md → CODE_OF_CONDUCT.md
- `Nawa Vote Platform Overview` --references--> `Contributing Guidelines`  [EXTRACTED]
  README.md → CONTRIBUTING.md

## Import Cycles
- None detected.

## Communities (25 total, 11 thin omitted)

### Community 0 - "createClient"
Cohesion: 0.08
Nodes (38): next, papaparse, Candidate, CandidateEditor(), CandidateEditorProps, AdminCandidatesPage(), dynamic, revalidate (+30 more)

### Community 1 - "VoteWizard.tsx"
Cohesion: 0.17
Nodes (23): LandingPage(), CategorizedCandidate, VoteWizard(), VoteWizardProps, Candidate, CandidateCard(), useOnlineStatus(), loginVoterToken() (+15 more)

### Community 2 - "package.json"
Cohesion: 0.05
Nodes (34): devDependencies, eslint, eslint-config-next, @netlify/plugin-nextjs, postcss, tailwindcss, @types/node, @types/papaparse (+26 more)

### Community 3 - "react"
Cohesion: 0.22
Nodes (16): framer-motion, lucide-react, react, AdminLayout(), LoginForm(), LoginPage(), SuccessPage(), SuccessView() (+8 more)

### Community 4 - "Nawa Vote Platform Overview"
Cohesion: 0.11
Nodes (16): Code of Conduct Enforcement, Contributor Covenant Code of Conduct, Community Pledge, Maintainer Responsibilities, Community Standards of Behavior, Conventional Commits Specification, Contributor Getting Started, Contributing Guidelines (+8 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+9 more)

### Community 6 - "app/layout.tsx"
Cohesion: 0.17
Nodes (11): inter, jetbrainsMono, metadata, plusJakartaSans, RootLayout(), ServiceWorkerRegistration(), Theme, ThemeContext (+3 more)

### Community 7 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, framer-motion, lucide-react, next, papaparse, react, react-dom, react-is (+3 more)

### Community 8 - "ResultsClient.tsx"
Cohesion: 0.12
Nodes (35): COLOR_SLOTS, ColorSlot, JABATAN_LABELS, resolveSlot(), SESSION_BAR_COLOR, SLOT_ORDER, SlotColors, BalloonInterface() (+27 more)

### Community 9 - "generate-tokens.js"
Cohesion: 0.20
Nodes (8): @supabase/supabase-js, { createClient }, envPath, fs, generateToken(), main(), path, supabase

### Community 10 - "manifest.json"
Cohesion: 0.22
Nodes (8): background_color, description, display, icons, name, short_name, start_url, theme_color

### Community 11 - "analytics/page.tsx"
Cohesion: 0.28
Nodes (7): recharts, AnalyticsDashboard(), AnalyticsDashboardProps, DashboardCandidate, AdminAnalyticsPage(), dynamic, revalidate

### Community 13 - "NAWA-VOTE Agent Workflow & Guidelines"
Cohesion: 0.40
Nodes (6): NAWA-VOTE Agent Workflow & Guidelines, Keep Graph Fresh Protocol, Knowledge Graph First-Reference (graphify-out/), AGENTS.md Agent Guidelines, Rule #1: Check graphify-out First, Rule #2: Always Update Graph on Code Changes

### Community 15 - "extends"
Cohesion: 0.50
Nodes (3): extends, next/core-web-vitals, next/typescript

## Knowledge Gaps
- **134 isolated node(s):** `next/core-web-vitals`, `next/typescript`, `nextConfig`, `name`, `version` (+129 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 156 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `createClient`, `VoteWizard.tsx`, `package.json`, `app/layout.tsx`, `ResultsClient.tsx`, `analytics/page.tsx`?**
  _High betweenness centrality (0.173) - this node is a cross-community bridge._
- **Why does `next` connect `createClient` to `VoteWizard.tsx`, `package.json`, `react`, `app/layout.tsx`, `analytics/page.tsx`, `vote/page.tsx`?**
  _High betweenness centrality (0.113) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `react` to `createClient`, `VoteWizard.tsx`, `package.json`, `ResultsClient.tsx`, `analytics/page.tsx`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **What connects `next/core-web-vitals`, `next/typescript`, `nextConfig` to the rest of the system?**
  _134 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `createClient` be split into smaller, more focused modules?**
  _Cohesion score 0.08446455505279035 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._
- **Should `Nawa Vote Platform Overview` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
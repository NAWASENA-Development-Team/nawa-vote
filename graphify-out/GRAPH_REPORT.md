# Graph Report - nawavote  (2026-10-09)

## Corpus Check
- 60 files · ~34,562 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 2, .woff 2, .template 1)

## Summary
- 351 nodes · 696 edges · 27 communities (15 shown, 12 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `26409d47`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- createClient
- syncVotes.ts
- package.json
- VoteWizard.tsx
- Nawa Vote Platform Overview
- compilerOptions
- app/layout.tsx
- devDependencies
- BalloonInterface.tsx
- generate-tokens.js
- manifest.json
- ResultsClient.tsx
- sw.js
- NAWA-VOTE Agent Workflow & Guidelines
- analytics/page.tsx
- extends
- vote/page.tsx
- next.config.mjs
- postcss.config.mjs
- Arcane Crown Glow
- Modular & Dynamic Code Architecture
- UX Excellence & Attention to Detail
- Workflow & Commitment Protocol
- Arcane Vote Glow Icon
- route.ts

## God Nodes (most connected - your core abstractions)
1. `react` - 29 edges
2. `createClient()` - 24 edges
3. `next` - 22 edges
4. `lucide-react` - 17 edges
5. `VoteWizard()` - 16 edges
6. `compilerOptions` - 15 edges
7. `framer-motion` - 14 edges
8. `BalloonInterface()` - 13 edges
9. `createClient()` - 13 edges
10. `NawaLogo()` - 11 edges

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

## Communities (27 total, 12 thin omitted)

### Community 0 - "createClient"
Cohesion: 0.08
Nodes (43): framer-motion, lucide-react, next, papaparse, @supabase/ssr, Candidate, CandidateEditor(), CandidateEditorProps (+35 more)

### Community 1 - "syncVotes.ts"
Cohesion: 0.33
Nodes (12): clearSynced(), getOfflineQueue(), markSynced(), markSyncError(), OfflineVote, readQueue(), saveVoteOffline(), writeQueue() (+4 more)

### Community 2 - "package.json"
Cohesion: 0.06
Nodes (32): dependencies, framer-motion, lucide-react, next, papaparse, react, react-dom, react-is (+24 more)

### Community 3 - "VoteWizard.tsx"
Cohesion: 0.12
Nodes (28): react, AdminLayout(), LoginForm(), LoginPage(), LandingPage(), SuccessPage(), SuccessView(), CategorizedCandidate (+20 more)

### Community 4 - "Nawa Vote Platform Overview"
Cohesion: 0.11
Nodes (16): Code of Conduct Enforcement, Contributor Covenant Code of Conduct, Community Pledge, Maintainer Responsibilities, Community Standards of Behavior, Conventional Commits Specification, Contributor Getting Started, Contributing Guidelines (+8 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+9 more)

### Community 6 - "app/layout.tsx"
Cohesion: 0.24
Nodes (8): inter, jetbrainsMono, metadata, plusJakartaSans, RootLayout(), ServiceWorkerRegistration(), ThemeProvider(), useServiceWorker()

### Community 7 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, @netlify/plugin-nextjs, postcss, tailwindcss, @types/node, @types/papaparse (+3 more)

### Community 8 - "BalloonInterface.tsx"
Cohesion: 0.11
Nodes (34): COLOR_SLOTS, ColorSlot, getShuffledCandidates(), JABATAN_LABELS, resolveSlot(), SESSION_BAR_COLOR, SLOT_ORDER, SlotColors (+26 more)

### Community 9 - "generate-tokens.js"
Cohesion: 0.20
Nodes (8): @supabase/supabase-js, { createClient }, envPath, fs, generateToken(), main(), path, supabase

### Community 10 - "manifest.json"
Cohesion: 0.22
Nodes (8): background_color, description, display, icons, name, short_name, start_url, theme_color

### Community 11 - "ResultsClient.tsx"
Cohesion: 0.14
Nodes (26): run(), CartoonCloud(), CLOUDS, GrassStrip(), InterfaceShell(), InterfaceShellProps, dynamic, PublicResultsPage() (+18 more)

### Community 13 - "NAWA-VOTE Agent Workflow & Guidelines"
Cohesion: 0.40
Nodes (6): NAWA-VOTE Agent Workflow & Guidelines, Keep Graph Fresh Protocol, Knowledge Graph First-Reference (graphify-out/), AGENTS.md Agent Guidelines, Rule #1: Check graphify-out First, Rule #2: Always Update Graph on Code Changes

### Community 14 - "analytics/page.tsx"
Cohesion: 0.28
Nodes (7): recharts, AnalyticsDashboard(), AnalyticsDashboardProps, DashboardCandidate, AdminAnalyticsPage(), dynamic, revalidate

### Community 15 - "extends"
Cohesion: 0.50
Nodes (3): extends, next/core-web-vitals, next/typescript

## Knowledge Gaps
- **140 isolated node(s):** `next/core-web-vitals`, `next/typescript`, `nextConfig`, `name`, `version` (+135 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 166 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `VoteWizard.tsx` to `createClient`, `package.json`, `app/layout.tsx`, `BalloonInterface.tsx`, `ResultsClient.tsx`, `analytics/page.tsx`?**
  _High betweenness centrality (0.183) - this node is a cross-community bridge._
- **Why does `next` connect `createClient` to `package.json`, `VoteWizard.tsx`, `app/layout.tsx`, `analytics/page.tsx`, `vote/page.tsx`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Why does `framer-motion` connect `createClient` to `BalloonInterface.tsx`, `ResultsClient.tsx`, `package.json`, `VoteWizard.tsx`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **What connects `next/core-web-vitals`, `next/typescript`, `nextConfig` to the rest of the system?**
  _140 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `createClient` be split into smaller, more focused modules?**
  _Cohesion score 0.07743496672716274 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._
- **Should `VoteWizard.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1241565452091768 - nodes in this community are weakly interconnected._
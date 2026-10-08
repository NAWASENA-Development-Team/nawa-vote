# Graph Report - nawavote  (2026-10-08)

## Corpus Check
- Corpus is ~24,699 words - fits in a single context window. You may not need a graph.

## Summary
- 274 nodes · 480 edges · 26 communities (15 shown, 11 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Candidate Management & CSV Parsing
- Voting Wizard & Card UI
- Admin Dashboard Layout & Navigation
- Architecture & Agent Design Principles
- NPM Package Scripts & Configuration
- TypeScript Compiler Configuration
- App Root Layout & Typography
- Production Runtime Dependencies
- Dev Dependencies & Build Tooling
- Supabase Database & Token Generation
- Web App Manifest & PWA Metadata
- Analytics Dashboard & Data Visuals
- Service Worker & PWA Caching
- ESLint Rules & Code Standards
- Vote Page Routing & SSR
- Input Validation Utilities
- Next.js Framework Configuration
- Arcane Crown UI Assets
- Tailwind CSS Configuration
- Arcane Vote Glow UI Asset
- Community 22
- Community 23
- Community 24
- Community 25

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 23 edges
2. `react` - 23 edges
3. `next` - 22 edges
4. `VoteWizard()` - 16 edges
5. `lucide-react` - 16 edges
6. `compilerOptions` - 15 edges
7. `framer-motion` - 11 edges
8. `syncOfflineVotes()` - 10 edges
9. `NawaLogo()` - 9 edges
10. `ThemeToggle()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Rule #1: Check graphify-out First` --semantically_similar_to--> `Knowledge Graph First-Reference (graphify-out/)`  [INFERRED] [semantically similar]
  AGENTS.md → AGENT.md
- `Rule #2: Always Update Graph on Code Changes` --semantically_similar_to--> `Keep Graph Fresh Protocol`  [INFERRED] [semantically similar]
  AGENTS.md → AGENT.md
- `Secure Development Practices` --conceptually_related_to--> `Pull Request Process`  [INFERRED]
  SECURITY.md → CONTRIBUTING.md
- `Nawa Vote Platform Overview` --references--> `Contributor Covenant Code of Conduct`  [EXTRACTED]
  README.md → CODE_OF_CONDUCT.md
- `Nawa Vote Platform Overview` --references--> `Contributing Guidelines`  [EXTRACTED]
  README.md → CONTRIBUTING.md

## Import Cycles
- None detected.

## Communities (26 total, 11 thin omitted)

### Community 0 - "Candidate Management & CSV Parsing"
Cohesion: 0.09
Nodes (37): framer-motion, lucide-react, next, Candidate, CandidateEditor(), CandidateEditorProps, AdminCandidatesPage(), dynamic (+29 more)

### Community 1 - "Voting Wizard & Card UI"
Cohesion: 0.17
Nodes (23): LandingPage(), CategorizedCandidate, VoteWizard(), VoteWizardProps, Candidate, CandidateCard(), useOnlineStatus(), castSplitVote() (+15 more)

### Community 2 - "Admin Dashboard Layout & Navigation"
Cohesion: 0.07
Nodes (24): name, packageManager, private, scripts, build, dev, lint, start (+16 more)

### Community 3 - "Architecture & Agent Design Principles"
Cohesion: 0.21
Nodes (15): react, AdminLayout(), LoginForm(), LoginPage(), SuccessPage(), SuccessView(), NawaLogo(), NawaLogoProps (+7 more)

### Community 4 - "NPM Package Scripts & Configuration"
Cohesion: 0.11
Nodes (16): Code of Conduct Enforcement, Contributor Covenant Code of Conduct, Community Pledge, Maintainer Responsibilities, Community Standards of Behavior, Conventional Commits Specification, Contributor Getting Started, Contributing Guidelines (+8 more)

### Community 5 - "TypeScript Compiler Configuration"
Cohesion: 0.11
Nodes (17): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+9 more)

### Community 6 - "App Root Layout & Typography"
Cohesion: 0.24
Nodes (8): inter, jetbrainsMono, metadata, plusJakartaSans, RootLayout(), ServiceWorkerRegistration(), ThemeProvider(), useServiceWorker()

### Community 7 - "Production Runtime Dependencies"
Cohesion: 0.18
Nodes (11): dependencies, framer-motion, lucide-react, next, papaparse, react, react-dom, react-is (+3 more)

### Community 8 - "Dev Dependencies & Build Tooling"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, @netlify/plugin-nextjs, postcss, tailwindcss, @types/node, @types/papaparse (+3 more)

### Community 9 - "Supabase Database & Token Generation"
Cohesion: 0.20
Nodes (8): @supabase/supabase-js, { createClient }, envPath, fs, generateToken(), main(), path, supabase

### Community 10 - "Web App Manifest & PWA Metadata"
Cohesion: 0.22
Nodes (8): background_color, description, display, icons, name, short_name, start_url, theme_color

### Community 11 - "Analytics Dashboard & Data Visuals"
Cohesion: 0.28
Nodes (7): recharts, AnalyticsDashboard(), AnalyticsDashboardProps, DashboardCandidate, AdminAnalyticsPage(), dynamic, revalidate

### Community 13 - "ESLint Rules & Code Standards"
Cohesion: 0.40
Nodes (6): NAWA-VOTE Agent Workflow & Guidelines, Keep Graph Fresh Protocol, Knowledge Graph First-Reference (graphify-out/), AGENTS.md Agent Guidelines, Rule #1: Check graphify-out First, Rule #2: Always Update Graph on Code Changes

### Community 14 - "Vote Page Routing & SSR"
Cohesion: 0.47
Nodes (4): Candidate, LeaderboardClient(), PublicResultsPage(), revalidate

### Community 15 - "Input Validation Utilities"
Cohesion: 0.50
Nodes (3): extends, next/core-web-vitals, next/typescript

## Knowledge Gaps
- **127 isolated node(s):** `Candidate`, `CandidateEditorProps`, `DashboardCandidate`, `DashboardConsoleProps`, `DashboardControlsProps` (+122 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 148 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Candidate Management & CSV Parsing` to `Voting Wizard & Card UI`, `Admin Dashboard Layout & Navigation`, `Architecture & Agent Design Principles`, `App Root Layout & Typography`, `Analytics Dashboard & Data Visuals`, `Next.js Framework Configuration`?**
  _High betweenness centrality (0.142) - this node is a cross-community bridge._
- **Why does `react` connect `Architecture & Agent Design Principles` to `Candidate Management & CSV Parsing`, `Voting Wizard & Card UI`, `Admin Dashboard Layout & Navigation`, `App Root Layout & Typography`, `Analytics Dashboard & Data Visuals`, `Vote Page Routing & SSR`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Production Runtime Dependencies` to `Admin Dashboard Layout & Navigation`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **What connects `Candidate`, `CandidateEditorProps`, `DashboardCandidate` to the rest of the system?**
  _127 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Candidate Management & CSV Parsing` be split into smaller, more focused modules?**
  _Cohesion score 0.09176470588235294 - nodes in this community are weakly interconnected._
- **Should `Admin Dashboard Layout & Navigation` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Should `NPM Package Scripts & Configuration` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
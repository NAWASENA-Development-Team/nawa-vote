# NAWA-VOTE — Agent Workflow & Guidelines

This document outlines the architectural standards, UI/UX principles, and workflow rules for AI agents and developers modifying the NAWA-VOTE codebase.

---

## 1. Modular & Dynamic Code Architecture

- **Reusable Components**: Keep UI components decoupled and reusable across views (e.g., `CandidateCard`, `ThemeProvider`, `ThemeToggle`).
- **Dynamic Props & Type Safety**: Always define TypeScript interfaces for component props and data models (e.g., `Candidate`, `VoterToken`). Avoid static hardcoded data in UI templates.
- **Clean Layer Separation**:
  - **Server Actions** (`src/lib/actions/`): Encapsulate Supabase database operations, authentication routines, and mutation logic.
  - **Client Components** (`'use client'`): Handle user interactions, framer-motion animations, and local UI state.
  - **Styles & Tokens**: Use standard Tailwind utility classes backed by CSS variables defined in `src/app/globals.css`.

---

## 2. UX Excellence & Attention to Detail

- **Civic & Institutional Identity**: The app serves Indonesian student elections (Pilketos). Maintain an official, trustworthy tone (`brand-navy` deep blue + `brand-amber` gold palette) with `Plus Jakarta Sans` headings and `Inter` body typography.
- **Hydration-Safe Dark Mode**:
  - Every component must support both Light and Dark modes.
  - Always pair light background/text utilities with explicit `dark:` counterparts (e.g., `bg-brand-navy-50 dark:bg-slate-950`, `text-brand-navy-900 dark:text-white`, `border-brand-navy-100 dark:border-slate-800`).
  - Avoid combining CSS classes with static `background: white` rules (like `.app-card`) on containers intended to carry dark utility backgrounds.
- **Smooth Micro-Interactions**:
  - Maintain fluid CSS color transitions (`transition-colors duration-200`).
  - Ensure interactive buttons, modals, badges, and form controls feature active states, clear disabled indicators, and smooth entry/exit animations via `framer-motion`.

---

## 3. Workflow & Commitment Protocol

- **Package Manager**: Use `bun` for all package scripts (`bun run build`, `bun dev`, etc.).
- **Build Verification**: Before declaring tasks complete, always execute `bun run build` to verify zero TypeScript errors, syntax breaks, or route compilation issues.
- **Git Commit Routine**: Always commit changes immediately after completing a functional unit or edit set using conventional commit format (imperative subject, $\le 50$ chars, e.g., `fix(ui): ...`, `feat(admin): ...`).

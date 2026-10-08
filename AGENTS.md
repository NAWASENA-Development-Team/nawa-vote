# AGENTS.md — Agent Workflow & Guidelines

This repository uses [`graphify`](file:///C:/Users/Stark/.gemini/config/skills/graphify/SKILL.md) to maintain an indexed, clustered knowledge graph under [`graphify-out/`](file:///C:/Users/Stark/Documents/nawavote/graphify-out/).

---

## 0. Rule #1: Check `graphify-out/` First (Save Tokens, No Blind Search)

**DO NOT** blindly scan, glob, or grep files across the codebase. That burns context tokens and misses cross-module relationships.

Whenever you need to understand the architecture, inspect dependencies, or locate files:
1. **Read Audit & Map First**: Check [`graphify-out/GRAPH_REPORT.md`](file:///C:/Users/Stark/Documents/nawavote/graphify-out/GRAPH_REPORT.md).
   - Review **God Nodes** (central abstractions like `createClient()`, `VoteWizard()`, `syncOfflineVotes()`).
   - Review **Community Hubs** (Candidate Management, Voting Wizard, Service Worker, Supabase).
2. **Query the Graph**:
   - Run `/graphify query "<question>"` or inspect [`graphify-out/graph.json`](file:///C:/Users/Stark/Documents/nawavote/graphify-out/graph.json).
   - Use `/graphify path "<Source>" "<Target>"` to trace paths between symbols without opening dozens of files.

---

## 1. Rule #2: Always Update Graph on Code Changes

When you add, edit, or delete files:
1. **Incremental Update**: Run `/graphify --update` (or `graphify update`).
   - Re-extracts only modified or new files.
   - Keeps graph and reports in sync.
2. **Automated Commit Hook**: Run `graphify hook install` to rebuild AST after every `git commit`.

---

## 2. Core Project Guidelines

See [AGENT.md](file:///C:/Users/Stark/Documents/nawavote/AGENT.md) for full project standards:
- **Package Manager**: Use `bun` (`bun run build`, `bun dev`).
- **Layers**: Server Actions (`src/lib/actions/`), Client components (`'use client'`), Tailwind styling (`src/app/globals.css`).
- **Verification**: Always run `bun run build` before finishing tasks.
- **Commits & Push (Mandatory)**: Follow conventional commits (`feat:`, `fix:`, `refactor:`). Agents MUST ALWAYS commit and `git push` to remote after completing changes—never finish a turn leaving changes uncommitted or unpushed.


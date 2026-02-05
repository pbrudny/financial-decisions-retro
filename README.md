# Financial Decisions Retrospective

An app for couples (person A and B) to jointly review past financial decisions. Each person independently assesses decisions — the partner's answers are hidden until both assessments are locked.

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS v4 + TanStack Query
- **Backend**: Express + TypeScript + better-sqlite3
- **Shared**: Zod schemas + TypeScript types (npm workspaces monorepo)

## Getting Started

```bash
npm install
npm run build:shared
npm run dev              # server (3001) + client (5173)
```

Or separately:

```bash
npm run dev:server       # Express at http://localhost:3001
npm run dev:client       # Vite at http://localhost:5173
```

## Testing

Open two browsers (or one incognito) and log in as person A and B.

## Flow

1. **Proposal** — one person adds a decision to the retrospective
2. **Approval** — the other person confirms the decision actually took place
3. **Assessment** — each person independently fills in: rating 1-5, pros/cons, biggest ignored risk, responsibility
4. **Lock** — once complete, the person locks their assessment (irreversible)
5. **Waiting** — polls every 3s, auto-redirects when both are locked
6. **Comparison** — split view with difference highlighting (green/yellow/red)
7. **Shared conclusion** — the pair formulates conclusions together
8. **Meta-conclusions** — cognitive biases, rules, red flags

## Reveal Mechanism

The `/compare` endpoint returns the partner's assessment **only** when both assessments have status `locked`. There is no unlock endpoint. No data leakage path before locking.

## Project Structure

```
├── shared/          # Types, Zod schemas, constants
├── server/          # Express API + SQLite
│   └── src/
│       ├── db/          # Connection + migration
│       ├── middleware/   # Auth (X-User-Id), error handler
│       ├── repositories/ # SQL queries
│       ├── services/     # Business logic (reveal guard, lock)
│       └── routes/       # API endpoints
└── client/          # React + Vite
    └── src/
        ├── api/         # Fetch wrapper + endpoints
        ├── context/     # AuthContext (A|B)
        ├── components/  # AppShell, AuthGuard, ErrorBoundary
        ├── pages/       # 9 pages
        └── lib/         # Polish labels, utilities
```

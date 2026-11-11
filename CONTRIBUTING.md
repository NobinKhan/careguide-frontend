# Contributing to Care Guide BD Frontend

Thank you for your interest in contributing to Care Guide BD!

## Prerequisites

- [Bun](https://bun.sh/) (v1.1 or higher)
- Node.js environment compatible with Vite

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/NobinKhan/careguide-frontend.git
   cd careguide-frontend
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Configure environment:
   Create a `.env` or `.env.local` if custom backend URL is needed:
   ```env
   VITE_API_URL=http://localhost:3000
   ```

4. Start development server:
   ```bash
   bun run dev
   ```

## Development & Code Quality Guidelines

- **SolidJS v2 Semantics:** Never destructure props. Use pure Solid v2 primitives (`createSignal`, `createMemo`, `createEffect`, `onSettled`).
- **No Test Files:** Per `AGENTS.md` §1.2 and §7, do **NOT** generate or commit `*.test.ts`, `*.spec.ts`, or test runners.
- **Verification:** Before opening a pull request, ensure typecheck and build pass cleanly:
  ```bash
  bun run typecheck
  bun run build
  ```
- **Security:** Never commit production credentials, `.env` files, or secrets into source code.

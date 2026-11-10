# Care Guide BD — Frontend (`careguide-frontend`)

Role-based dashboard built with **SolidJS v2 (`solid-js@2.0.0-rc.21`, `@solidjs/web@2.0.0-rc.21`)** and **Tailwind CSS** (Cloudflare Pages ready).

## Features
- **1-Click Live Interview Demo Switcher:** Instant switching between `Admin`, `User 1 (Nazrul)`, `User 2 (Rahim)`, and `User 3 (Karim)`.
- **My Notes & Interests:** Update personal `interests` array (`PATCH /api/users/me/interests`) and manage private notes (`GET/POST/PATCH/DELETE /api/notes`).
- **Public Posts:** Publish and browse paginated public posts (`GET/POST /api/posts`).
- **MongoDB Aggregations Lab:**
  - **Scenario 1 (`GET /api/aggregations/users-by-interest`):** Users grouped by interests via single aggregation pipeline.
  - **Scenario 2 (`GET /api/aggregations/user-posts/:userId`):** Paginated posts for a selected user via single `$lookup` aggregation pipeline.
- **Admin Panel (`admin` role only):**
  - Manage all users (`GET/POST/PATCH/DELETE /api/users`) with an interactive **Delete User Prompt Modal** asking whether to keep (`keepData=true`) or cascade-delete (`keepData=false`) the user's notes and posts.
  - View and manage everyone's private notes (`GET /api/notes/all`).

## Quick Start

```bash
cp .env.example .env
bun install
bun run dev
```

## Build for Cloudflare Pages

```bash
bun run typecheck
bun run build
```
- **Build command:** `bun run build`
- **Build output directory:** `dist`
- **Environment variable:** `VITE_API_URL=https://your-backend-domain.com`

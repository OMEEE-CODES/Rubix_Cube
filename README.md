# Rubix Cube

Frontend prototype for an AI-assisted Rubik's Cube solver. Phase 1 is focused on the user experience: capture cube photos, review detected sticker colors, and preview the solver insights that the backend will return later.

## Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS v4
- shadcn-style UI foundation (`components.json`, reusable primitives, `cn` utility)
- Lucide icons

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Current scope

- Responsive landing and workspace UI
- Guided cube-face capture queue
- Manual sticker correction grid
- Solver-response preview cards
- Frontend roadmap for backend and deployment

## Planned next phases

### Phase 2 backend

- Accept six uploaded cube-face photos
- Detect stickers with a vision pipeline
- Validate cube state and reject impossible arrangements
- Convert the state into solver notation
- Return shortest path, alternative solution families, and confidence

### Phase 3 deployment

- Frontend on Vercel
- Solver and vision API on Railway, Render, or Fly.io
- Uploaded image storage via an S3-compatible bucket

# CodeCollab

Real-time collaborative code editor with AI-powered code review. Built for portfolio/demo use — deploy the frontend + serverless APIs on Vercel, run the WebSocket collab server on Railway or Render.

![Stack](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Vite](https://img.shields.io/badge/Vite-6-purple) ![Groq](https://img.shields.io/badge/AI-Groq-orange)

## Features

- **Real-time collaboration** — Multiple users edit the same C++ file via WebSockets (Socket.io)
- **AI code review** — Groq-powered side panel scores code and surfaces bugs, style issues, and fixes
- **AI chat** — Ask follow-up questions about your code in context
- **Remote compilation** — Run C++ code via RapidAPI compiler
- **Modern stack** — Vite, React, TypeScript, Monaco Editor, Tailwind CSS

## Architecture

```
┌─────────────────────┐     ┌──────────────────────────┐
│  Vercel (Frontend)  │────▶│  Vercel Serverless APIs  │
│  React + Monaco     │     │  /api/review  (Groq)     │
│  AI Side Panel      │     │  /api/chat    (Groq)     │
└──────────┬──────────┘     │  /api/compile (RapidAPI) │
           │ WebSocket      └──────────────────────────┘
           ▼
┌─────────────────────┐
│  Railway / Render   │
│  collab-server/     │  ← Socket.io rooms
└─────────────────────┘
```

## Quick Start (Local)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in:
- `GROQ_API_KEY` — from [console.groq.com](https://console.groq.com)
- `VITE_SOCKET_URL` — `http://localhost:3001` for local dev

Code compilation uses the free [Judge0 CE](https://ce.judge0.com) API (no key required). Optionally set `RAPIDAPI_KEY` if you subscribe to Judge0 on RapidAPI.

### 3. Run all services (3 terminals)

```bash
# Terminal 1 — WebSocket collab server
npm run collab

# Terminal 2 — Local API server (proxied by Vite)
npm run dev:api

# Terminal 3 — Frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Deploy to Vercel

### Frontend + APIs

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables:
   - `GROQ_API_KEY`
   - `VITE_SOCKET_URL` (your collab server URL)
4. Deploy — Vercel auto-detects Vite and deploys `/api` serverless functions

### Collab server (Railway / Render)

Deploy the `collab-server/` folder as a Node service:

- **Start command:** `node index.js`
- **Port:** `3001` (or set `PORT` env var)
- Set `VITE_SOCKET_URL` in Vercel to your Railway URL (e.g. `https://your-app.railway.app`)

## Project Structure

```
├── api/                  # Vercel serverless functions
│   ├── review.js         # AI code review (Groq)
│   ├── chat.js           # AI follow-up chat
│   └── compile.js        # C++ compilation
├── collab-server/        # Socket.io server (Railway/Render)
├── src/
│   ├── components/
│   │   ├── AISidePanel.tsx
│   │   ├── CodeEditor.tsx
│   │   └── Client.tsx
│   └── pages/
│       ├── Home.tsx
│       └── EditorPage.tsx
└── scripts/dev-api.mjs   # Local API server for development
```

## CV Highlights

- Split architecture: static frontend on Vercel, serverless AI APIs, dedicated WebSocket service
- Integrated Groq LLM for structured code review with severity-tagged feedback
- Real-time collaborative editing with Socket.io room sync
- Secured API keys server-side with rate-limit-ready serverless endpoints

## License

MIT

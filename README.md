# VineTrack Pro – MVP Starter (Netlify + React + Vite)

- Frontend: React (Vite)
- Hosting: Netlify (free tier)
- Serverless: Netlify Functions (`/.netlify/functions/forecast`)
- AI: OpenAI Chat Completions (`gpt-4o-mini`) via `OPENAI_API_KEY`

## Quick Start (Local)

```bash
npm ci
npm run dev
```

## Deploy on Netlify

1. Set environment variable `OPENAI_API_KEY` in Site settings → Environment.
2. Build command: `npm ci && npm run build`
3. Publish folder: `dist`
4. Functions folder: `netlify/functions`

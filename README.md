# Motivation Dice — Gemini motivation roller

**Live AI app:** <https://motivation-dice.onrender.com/>. The GitHub Pages root redirects to this Render service.

[Deploy to Render](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2Faniogdayer-a11y%2FMotivation-Dice)

## Run online on Render

1. Open **Deploy to Render** above and sign in to your Render account.
2. Review the `motivation-dice` **Web Service** on the **Free** plan. The included `render.yaml` supplies the build, start, health check, and Node settings.
3. Enter your new Gemini key in the **GEMINI_API_KEY** secret field. It is kept in Render's environment settings, never in GitHub or browser code.
4. Deploy, then open the actual `https://…onrender.com` URL shown in your Render dashboard. The app and `/api/motivation` run together at that address.

If creating the service manually: use this repo's `main` branch, leave Root Directory empty, choose Node, set Build Command to `npm test`, Start Command to `npm start`, Health Check Path to `/healthz`, and add `GEMINI_API_KEY`, `GEMINI_MODEL=gemini-3.5-flash-lite`, and `NODE_VERSION=24.18.0` in Environment.

The server binds to Render's assigned `PORT` on `0.0.0.0`. Render provides `RENDER_EXTERNAL_URL`, which the server uses to accept its own HTTPS origin. GitHub Pages redirects to the verified live Render URL above.

The Free plan sleeps after 15 idle minutes; its first request afterward can take about a minute to wake. See [Render's Free service limits](https://render.com/docs/free). Blueprint automatic deployments are off; deploy subsequent changes from the Render dashboard.

Choose your mood, choose a reason, and optionally describe what happened. Gemini prepares one encouragement in **English, Tagalog, and Taglish together**. The page shows a loading screen until all three are ready. Changing language uses the already prepared versions; Reload asks for a new set.

Questions, choices, and guides stay in English. The language buttons affect only the motivation.

## Add your key

1. Create a Gemini API key in [Google AI Studio](https://aistudio.google.com/apikey).
2. Open `.env` in this folder, next to `server.mjs`. Copy `.env.example` to `.env` first; your private `.env` is not included in this repository.
3. Fill in the key:

   ```env
   GEMINI_API_KEY=your_actual_key_here
   GEMINI_MODEL=gemini-3.5-flash-lite
   PORT=8000
   ```

4. Save the file. The running server reads the key and model again on the next generation request, so there is no need to restart after adding or changing the key.

The key stays on the local server. `.env` is ignored by Git and cannot be downloaded through the website. Do not put the key in `dist/`, browser code, or chat.

The default model is [Gemini 3.5 Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite). You can change `GEMINI_MODEL` if your project uses another compatible Gemini text model. Model access, quota, and billing depend on your Google project.

## Start

Use Node.js 22 or later. There are no packages to install.

```sh
npm start
```

Visit <http://localhost:8000>. Use this Node server for the AI version; a static Python server cannot provide the API endpoint. If port 8000 is occupied, stop the older server or change `PORT` and restart.

## Behavior

- One server request generates all three equivalent language versions with a structured JSON response.
- The mood and topic are the main context. The optional note is sent to Gemini to add nuance.
- Back cancels a pending request and preserves your answer when returning to the reason step.
- AI-generated messages stay in browser memory; the app does not put them or personal notes in local storage.
- The local server does not log notes, generated messages, or keys.
- An unavailable key, quota limit, timeout, or incomplete response shows a clear retry option.
- **Use saved messages** is an explicit fallback. These are labeled **Saved message** and use the existing local, non-repeating message pools. **Try AI again** returns to Gemini generation.

## Verify

```sh
npm test
```

The tests use simulated Gemini responses and never use your live key. They cover input validation, three-language output, key privacy, secret-file protection, local-only requests, upstream failures, timeout, and saved message coverage.

The Windows browser check uses installed Google Chrome:

```sh
node tools/browser-check.mjs
```

It intercepts the AI endpoint with synthetic fixtures to check loading, language switching, errors, cancellation, saved fallback, mobile layout, and dark mode without calling Gemini.

This repository contains the Node server and website source for localhost and Render. GitHub Pages cannot run the Gemini backend; the online AI app must use the Render Web Service URL.

## GitHub Pages

The root entry redirects to the live Render app for AI generation. The separate `/dist/` path on GitHub Pages still offers labeled saved messages without calling a backend. Personal notes and API keys are never forwarded in the redirect.

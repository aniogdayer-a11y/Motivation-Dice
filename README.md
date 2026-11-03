# Motivation roller — local Gemini integration

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

This repository contains the local Node server and website source. GitHub Pages cannot run the Gemini backend. Run locally using the steps above; publishing the repository does not deploy a working AI website.

## GitHub Pages

The root entry redirects to `dist/`. On GitHub Pages, the app uses labeled saved messages without calling the local-only API. AI remains available through the Node server; public AI hosting is pending configuration.

# Motivation Dice

A personal motivation roller made by **Dayer Aniog**. Choose your mood, optionally share why, and get encouragement that brings both into the same message.

## Features

- Eight moods: Happy, Okay, Sad, Anxious, Tired, Overwhelmed, Unmotivated, and Lonely.
- Optional reason choices and a short explanation in your own words.
- Motivations in Taglish, English, or Tagalog; questions and guides stay in English.
- 240 base responses, combined with guidance specific to each mood and reason.
- Shuffled response cycles with separate history for each mood, reason, and language.
- Light/dark mode and a layout that adapts to phones and desktop screens.
- Back navigation that keeps your answer when returning to the reason step.

Free-text matching recognizes a small set of common English and Filipino topic words. An explicit reason choice takes priority. Unclear or mixed topics get mood-based encouragement without guessing a cause.

## Run locally

Open `index.html` directly in a browser, or serve this folder:

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Then visit <http://localhost:8000>.

The app uses plain HTML, CSS, and JavaScript. No installation, build step, or API key is needed.

## Verify

With Node.js installed:

```sh
npm test
```

The checks cover the mood/reason flow, response matching, non-repeating cycles, language behavior, Back navigation, and unavailable or corrupted browser storage.

## Privacy

Personal explanations stay in memory and are cleared on refresh. The app makes no API requests. Language, theme, and shuffled response history are stored in the browser when storage is available. The mood question is asked again on each visit.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure and controls |
| `style.css` | Responsive light and dark themes |
| `app.js` | Navigation, choices, and response history |
| `mood-responses.js` | Base encouragement for each mood and language |
| `reasons.js` | English questions, choices, and guide text |
| `personalization.js` | Mood/reason guidance and cautious topic matching |
| `tests/verify.cjs` | Functional checks without dependencies |

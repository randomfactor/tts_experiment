# Deepgram TTS Experiment

This project is a React app with a Bun proxy server for text-to-speech using Deepgram.

The browser app sends text to the local Bun server. The Bun server calls Deepgram with your API key and returns audio to the browser for playback or download. This keeps the API key out of browser JavaScript.

## Features

- Text input for speech generation
- Deepgram voice/model selection
- Playback controls: Speak, Pause, Resume, Stop
- Volume control
- Save audio to local file
- Save filename format based on project rules

## Architecture

- Frontend: React (Create React App)
- Backend proxy: Bun server
- Upstream TTS provider: Deepgram

Request flow:

1. Browser calls local proxy endpoint `/speak`
2. Bun server injects `Authorization: Token <DEEPGRAM_API_KEY>`
3. Bun server forwards to Deepgram `/v1/speak`
4. Bun server returns MP3 bytes to the browser
5. Browser plays audio and can download it

## Project Structure

- `src/App.js`: UI, playback controls, save audio behavior
- `src/App.css`: app styling
- `server/index.js`: Bun proxy server for Deepgram API requests
- `package.json`: scripts and dependencies
- `.env.local`: local environment variables (not for commit)
- `RULES.md`: naming and feature rules

## Prerequisites

- Node.js and npm
- Bun
- Deepgram API key

## Environment Setup

Create or update `.env.local` in the project root:

```env
DEEPGRAM_API_KEY=your_deepgram_api_key
REACT_APP_PROXY_URL=http://localhost:3001
```

Notes:

- `DEEPGRAM_API_KEY` is read by Bun server only.
- `REACT_APP_PROXY_URL` is optional; default is `http://localhost:3001`.
- Do not commit real secrets.

## Install

```bash
npm install
```

## Run (Development)

Start the Bun proxy in one terminal:

```bash
npm run server
```

Start React in a second terminal:

```bash
npm start
```

Open:

- App: http://localhost:3000
- Proxy: http://localhost:3001

## Build

```bash
npm run build
```

Output is generated in `build/`.

## Save Audio Filename Rule

When saving audio, filenames follow this pattern:

`tts_YYYYMMDD_HHmmss_first_four_words.mp3`

Where:

- `YYYYMMDD` is date
- `HHmmss` is 24-hour time to seconds
- `first_four_words` comes from the first four words of the text input, normalized for filename safety

## Troubleshooting

- If the app cannot generate speech, verify the Bun server is running and `DEEPGRAM_API_KEY` is set.
- If requests fail with auth errors, validate your Deepgram key.
- If CORS errors appear, ensure requests go through the local Bun proxy and not directly to Deepgram from the browser.

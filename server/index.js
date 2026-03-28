import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
const PORT = Number(process.env.PROXY_PORT || 3001);
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';
const BUILD_DIR = resolve(process.cwd(), 'build');
const BUILD_INDEX = resolve(BUILD_DIR, 'index.html');

if (!DEEPGRAM_API_KEY) {
  console.error('DEEPGRAM_API_KEY is not set. Add it to .env.local.');
  process.exit(1);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

Bun.serve({
  port: PORT,

  async fetch(req) {
    const url = new URL(req.url);

    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (req.method === 'POST' && url.pathname === '/speak') {
      const params = url.searchParams.toString();
      const upstream = `https://api.deepgram.com/v1/speak${params ? '?' + params : ''}`;

      try {
        const body = await req.text();

        const dgResponse = await fetch(upstream, {
          method: 'POST',
          headers: {
            Authorization: `Token ${DEEPGRAM_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body,
        });

        if (!dgResponse.ok) {
          const errorText = await dgResponse.text();
          return new Response(JSON.stringify({ error: errorText }), {
            status: dgResponse.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const audioData = await dgResponse.arrayBuffer();
        return new Response(audioData, {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': dgResponse.headers.get('Content-Type') || 'audio/mpeg',
          },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (req.method === 'GET' || req.method === 'HEAD') {
      if (!existsSync(BUILD_INDEX)) {
        return new Response('React build not found. Run "npm run build" first.', {
          status: 503,
        });
      }

      const cleanPath = url.pathname === '/' ? '/index.html' : url.pathname;
      const requestedFile = resolve(BUILD_DIR, `.${cleanPath}`);
      const isInsideBuildDir = requestedFile.startsWith(BUILD_DIR);

      if (isInsideBuildDir && existsSync(requestedFile)) {
        return new Response(Bun.file(requestedFile));
      }

      // SPA fallback: send index.html for non-API routes.
      return new Response(Bun.file(BUILD_INDEX));
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });
  },
});

console.log(`Deepgram server listening on http://localhost:${PORT}`);

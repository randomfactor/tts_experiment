# Bug List

- High – Unauthenticated /speak proxy allows any network client to spend the Deepgram API key; there is no auth, rate limiting, or key scoping, so exposure leads to free use of your paid quota. [server/index.js](server/index.js#L21-L69)
- ~~Medium – /speak accepts arbitrary, unbounded request bodies and forwards them directly upstream without validation, enabling large-payload DoS or cost amplification. [server/index.js](server/index.js#L31-L69)~~ **Resolved** — Added 10,000 character body size cap (HTTP 413).
- Low – Upstream error bodies are returned verbatim to clients, which can leak provider details or user text content in error cases. [server/index.js](server/index.js#L47-L53)

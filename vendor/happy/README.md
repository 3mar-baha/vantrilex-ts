# vendor/happy — Self-Hosted Happy Coder Relay Integration

Mobile pairing follows the Happy architecture (`slopus/happy` client
bridge + `slopus/happy-server` relay), self-hosted so code, agent
commands, and tokens never reach third-party clouds.

## Sources

- Client bridge: `https://github.com/slopus/happy`
- Relay: `https://github.com/slopus/happy-server` (serves the pairing,
  push, and approval endpoints under `/v1/`)

## Layout

- `src/engine/mobile/pairing.ts` — QR handshake, tokens, state machine.
- `src/engine/mobile/relay.ts` — `HappyRelay` client honoring
  `HAPPY_SERVER_URL` (default `http://127.0.0.1:8787`).
- `src/engine/mobile/push.ts` — approval queue with relay forwarding.

## Self-hosting invariant

Every request carries a session Bearer token to the configured relay
only. No traffic defaults to any hosted endpoint. Fork and deploy the
two upstream repos, point `HAPPY_SERVER_URL` at the deployment, and pair
with the QR payload from `mobile:qr:generate`.

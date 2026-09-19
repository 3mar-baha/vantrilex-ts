# 19 — Mobile Pairing — Vantrilex Next-Gen Agentic Workbench & Launcher

## Purpose

Phone as a second screen: notifications, voice notes, step approvals.

## Status

Self-hosted relay only. No third-party key custody.

## Schema

### Relay

Fork of `slopus/happy` (CLI plus mobile app) and `slopus/happy-server`
vendored under `vendor/happy/`. `HAPPY_SERVER_URL` points at the
deployed relay. Vendor auth abstraction covers Claude, Codex, and Gemini
CLIs.

### Pairing

`mobile:pair()` issues a QR payload with a short-lived token. The phone
scans, the relay binds device to session, push enables. Tokens expire;
re-pairing re-issues.

### Channels

Push notifications on agent completion, voice-note upload for
transcription, and step-approval prompts with allow or deny decisions
routed back to the session.

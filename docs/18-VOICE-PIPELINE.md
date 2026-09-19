# 18 — Voice Pipeline — Vantrilex Next-Gen Agentic Workbench & Launcher

## Purpose

Speech synthesis and transcription for the non-technical owner.

## Status

Direct provider APIs only. No OpenRouter in the audio path.

## Schema

### Synthesis (Fish Audio)

Model `s2.1-pro-free` via the Fish Audio API with the keyring bearer
key. Ogg/Opus stream, 60s timeout, one retry. Audio captures to the
session cache and plays on desktop speakers.

### Transcription (Groq Whisper)

Groq Whisper endpoint with the keyring bearer key. Used for voice input
and mobile voice notes. Text returns to the session; audio is retained
only in the session cache.

### Flow

Speak panel → TTS stream → cache → playback. Mic input → Whisper →
session text. Mobile voice notes arrive via the Happy channel and follow
the same transcription path.

# Witness

**Nobody forgets a promise made on the record.**

Witness doesn't summarize meetings — it cross-references every meeting against the last
one and tells you, before you walk back into the room, exactly who said they'd do what,
and whether they did. Most meeting AI is a one-shot notetaker; Witness is a memory layer
that persists commitments across a *series* of meetings and catches the ones that quietly
slip through the cracks. It can also send a bot into your next call to capture it
automatically, and answer plain-language questions over the whole ledger.

Built for the **OpenAI × NamasteDev Codex Hackathon**, July 2026.

## The problem

Every recurring team has the same failure mode: someone commits to something in a
meeting, it doesn't happen, and three weeks later everyone's pretending it's a surprise.
Meeting notetakers summarize what was *said*. Nobody tracks what was *promised* across
meetings, or flags it before the next one starts.

## How it works

1. **Capture** — get a transcript into Witness three ways: paste text directly, upload a
   recording (transcribed with Whisper), or send a real bot into a Zoom/Meet/Teams call
   (self-hosted [Attendee](https://github.com/attendee-labs/attendee)) that joins,
   records, and hands back the transcript when the meeting ends — no human required.
2. **Extract** — each transcript is run through a structured-output LLM pass that pulls
   out explicit personal commitments (who, what, by when), not general chatter.
3. **Reconcile** — every following transcript is cross-referenced against the still-open
   commitment ledger. The model decides, per commitment, whether it was *fulfilled*,
   *reaffirmed* (mentioned again, still pending), or *silent* (never came up).
4. **Derive** — status (on track / at risk / broken / fulfilled) is computed
   deterministically from that evidence and the due date — the model supplies evidence,
   the app decides what it means. This keeps the state trustworthy instead of being
   another LLM guess.
5. **Brief & ask** — generate a pre-meeting briefing from everything at risk or broken,
   ranked by how many meetings it's slipped, ending in one blunt line on how to open the
   meeting. Or just ask Witness directly — "who's slipping the most?", "what does Meera
   still owe?" — answered in plain language, grounded only in the real ledger.

## Try it

Click **Load demo scenario** to queue three scripted weekly-sync transcripts for a
4-person team, then **Process next meeting** through all three, one at a time, watching
the accountability board update live — including a live evidence "pulse" per commitment
you can hover over. Then try **Ask Witness** with a real question. Or open **Add your own
meeting** to paste real transcripts, upload a recording, or send Witness to a live call.

## Stack

- Next.js 16 (App Router, TypeScript), Tailwind v4
- OpenAI structured outputs (`zodResponseFormat`) for extraction, reconciliation, and chat
- OpenAI Whisper for audio/video transcription
- Self-hosted [Attendee](https://github.com/attendee-labs/attendee) (Django + Postgres +
  Redis, MIT licensed) for the meeting-bot integration — joins Zoom/Google Meet/Teams and
  transcribes for free via the platform's built-in closed captions
- Client-side state only — no database. This is a working prototype; a real deployment
  would persist the commitment ledger per workspace instead of per browser session.

## Local setup

```bash
npm install
cp .env.local.example .env.local   # add OPENAI_API_KEY (or OPENROUTER_API_KEY)
npm run dev
```

The client also accepts `OPENROUTER_API_KEY` as a drop-in alternative to
`OPENAI_API_KEY` (routes through `https://openrouter.ai/api/v1`, model names prefixed
with `openai/`) — set `WITNESS_MODEL` accordingly if you switch providers.

### Enabling the audio upload feature

OpenRouter doesn't proxy the Whisper audio endpoint, so uploads need either a native
`OPENAI_API_KEY`, or a free local transcription server (no API key at all):

```bash
cd local-whisper
pip install -r requirements.txt
python server.py   # downloads the base Whisper model on first run, serves :8765
```

Set `LOCAL_WHISPER_URL=http://localhost:8765` in `.env.local` — Witness prefers it over
OpenAI whenever it's set.

### Enabling the meeting-bot feature

The "send Witness to this meeting" feature needs a running
[Attendee](https://github.com/attendee-labs/attendee) instance:

```bash
git clone https://github.com/attendee-labs/attendee.git
cd attendee
python init_env.py > .env   # generates encryption/secret keys
docker compose -f dev.docker-compose.yaml up -d
docker compose -f dev.docker-compose.yaml exec attendee-app-local python manage.py migrate
```

Sign up at `http://localhost:8000`, create a project API key, and set
`ATTENDEE_BASE_URL` / `ATTENDEE_API_KEY` in `.env.local`. Witness uses Attendee's free
closed-caption transcription mode, so no third-party transcription provider key is
required.

## What's next

- Persist workspaces (Supabase/Postgres) so the ledger survives across real, separate
  meetings instead of one browser session
- Webhook-driven bot updates instead of polling, once deployed behind HTTPS
- Slack/email delivery of the pre-meeting briefing

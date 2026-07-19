# Witness — 3 minute demo script

Two recordings: **A** = hosted site (witness-ten.vercel.app), **B** = local screen (meeting-bot
join). Cut between them where marked. Total target: 2:50–3:00.

---

## [0:00–0:20] The problem (talk to camera or voiceover, no screen yet)

> "Every recurring team has the same failure: someone promises something in a meeting, it
> doesn't happen, and three weeks later everyone's pretending it's a surprise. Meeting
> notetakers summarize what was *said*. Nobody tracks what was *promised* — across
> meetings — or flags it before the next one starts. That's Witness."

---

## [0:20–1:00] **[Recording A — hosted]** Core loop

1. Land on the hero. One line: *"This is live — nothing here is faked."*
2. Scroll to **Get started** → click **Load demo scenario**.
3. Click **Process next: "Sprint Planning"** — narrate while it runs:
   > "It reads the transcript and pulls out real commitments — who, what, by when."
4. Click through the next two meetings quickly (speed up in edit if needed).
5. Land on the board:
   > "Meera's AWS-credits promise — made three weeks ago — is now Broken. Dev's own
   > roadmap draft slipped too. It caught both without anyone asking it to."

## [1:00–1:30] **[Recording A]** Briefing + chat

1. Click **Generate briefing** — read the output on screen:
   > "One paragraph, tells you exactly who to press before the meeting starts."
2. Click **Ask Witness**, type/click *"Who's slipping the most?"*
   > "You can just ask it — grounded only in what's actually in the ledger."

## [1:30–2:10] **[Recording A]** Slack — the autonomous part

1. Click **Nudge via Slack** on the Broken card.
   > "Now the interesting part — it doesn't wait for you to check back. It DMs the person."
2. Switch to Slack (show real DM arriving).
3. Reply in Slack, live: *"yeah just sent it"*
4. Switch back, click **Check for reply**.
   > "It reads the reply and updates itself. Nobody opened the app for that to happen."
5. Show the card flip to Fulfilled / status change on screen.

## [2:10–2:40] **[Recording B — local screen]** Meeting-bot

1. Cut to local recording: paste a real Google Meet link into the (local-only) bot field.
   > "It can also join the call itself — no transcript to paste at all."
2. Show it joining in the Meet window + `joined_recording` status in Witness.
3. Cut to the resulting transcript flowing into the same extraction pipeline.
   > "Same engine, same board — it just got there on its own."

## [2:40–3:00] Close

> "That's Witness — commitments extracted, not summarized. Cross-meeting memory, not
> one-shot notes. And it chases people down for you, so you don't have to. Full source,
> and the meeting-bot package, are both on GitHub."

Show: GitHub URL on screen (`github.com/maanas1234/Witness`) + hosted URL
(`witness-ten.vercel.app`).

---

### Notes for recording
- Do a dry run of the Slack reply exchange once before the real take — timing matters.
- If a step lags (model latency), cut the dead air in editing, don't narrate through it.
- Keep Recording A on the actual hosted URL, not localhost — judges should see it's the
  live deployment, not your dev server.

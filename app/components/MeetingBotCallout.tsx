export function MeetingBotCallout() {
  return (
    <div className="mt-4 rounded-md border border-dashed border-wire/40 px-4 py-4">
      <p className="text-sm text-paper">
        Witness can send a real bot into your Zoom / Google Meet / Teams call — it joins,
        records, and transcribes automatically, no copy-pasting required.
      </p>
      <p className="mt-1 text-xs text-paper-dim">
        That runs on a local meeting-bot server, so it&apos;s not part of this hosted demo.
        Grab the full project to run it yourself:
      </p>
      <a
        href="https://github.com/maanas1234/Witness"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block rounded-md bg-wire px-4 py-2 text-sm font-semibold text-paper transition hover:brightness-110"
      >
        Download the full package
      </a>
    </div>
  );
}

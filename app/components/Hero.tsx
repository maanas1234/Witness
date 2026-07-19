export function Hero() {
  return (
    <div className="relative overflow-hidden border-b border-ink-line">
      <div className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="flex items-center gap-2 font-mono-tight text-xs uppercase tracking-widest text-paper-dim">
          <span className="h-1.5 w-1.5 rounded-full bg-red pulse-dot" />
          Recording
        </div>
        <h1 className="font-display mt-6 max-w-3xl text-5xl leading-[1.05] text-paper md:text-6xl">
          Nobody forgets a promise made <span className="text-amber">on the record.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-paper-dim">
          Witness doesn&apos;t summarize meetings. It cross-references every meeting against
          the last one, and tells you — before you walk back into the room — exactly who
          said they&apos;d do what, and whether they did.
        </p>
        <div className="mt-8 flex flex-wrap gap-6 font-mono-tight text-xs text-paper-dim">
          <span>01 — commitments extracted, not summarized</span>
          <span>02 — cross-meeting memory, not one-shot notes</span>
          <span>03 — a briefing before you walk in, not after</span>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <div className="relative overflow-hidden border-b border-ink-line">
      <div className="mx-auto w-full max-w-6xl px-6 py-16">
        <h1 className="font-display max-w-2xl text-4xl leading-[1.1] text-paper md:text-5xl">
          Nobody forgets a promise made <span className="text-amber">on the record.</span>
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-paper-dim">
          Give Witness your meeting notes. Next meeting, it tells you who kept their word —
          and who didn&apos;t, before you have to ask.
        </p>
        <a
          href="#get-started"
          className="mt-6 inline-block rounded-md bg-amber px-5 py-2.5 text-sm font-semibold text-ink transition hover:brightness-110"
        >
          Try it now
        </a>
      </div>
    </div>
  );
}

import { Hero } from "./components/Hero";
import { Workspace } from "./components/Workspace";

export default function Home() {
  const attendeeEnabled = Boolean(process.env.ATTENDEE_API_KEY);

  return (
    <main className="flex-1 pb-10">
      <Hero />
      <div className="pt-10">
        <Workspace attendeeEnabled={attendeeEnabled} />
      </div>
      <footer className="mx-auto mt-16 w-full max-w-6xl px-6 font-mono-tight text-xs text-paper-dim">
        Witness — built for the OpenAI × NamasteDev Codex Hackathon.
      </footer>
    </main>
  );
}

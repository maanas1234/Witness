import React from "react";

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${keyPrefix}-${i}`} className="text-paper font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={`${keyPrefix}-${i}`}>{part}</React.Fragment>;
  });
}

export function MarkdownLite({ text }: { text: string }) {
  const lines = text.trim().split("\n").filter((l) => l.trim().length > 0);
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <div key={i} className="flex gap-2 text-sm leading-relaxed">
              <span className="text-amber mt-0.5">—</span>
              <span>{renderInline(trimmed.slice(2), `l${i}`)}</span>
            </div>
          );
        }
        return (
          <p key={i} className="text-sm leading-relaxed">
            {renderInline(trimmed, `l${i}`)}
          </p>
        );
      })}
    </div>
  );
}

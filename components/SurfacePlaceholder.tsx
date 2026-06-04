import Link from "next/link";

export default function SurfacePlaceholder({
  index,
  title,
  phase,
  summary,
  capabilities,
}: {
  index: string;
  title: string;
  phase: string;
  summary: string;
  capabilities: string[];
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center gap-3 text-sm text-muted">
        <span className="font-mono">{index}</span>
        <span className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs">
          Arrives in {phase}
        </span>
      </div>
      <h1 className="mt-3 text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-muted">{summary}</p>

      <div className="mt-6 rounded-xl border border-border bg-surface p-5">
        <div className="text-sm font-medium">What this surface will do</div>
        <ul className="mt-3 space-y-2">
          {capabilities.map((c) => (
            <li key={c} className="flex gap-2 text-sm text-foreground/80">
              <span className="text-accent">→</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </div>

      <Link
        href="/"
        className="mt-6 inline-block text-sm text-accent-strong hover:underline"
      >
        ← Back to the flywheel
      </Link>
    </div>
  );
}

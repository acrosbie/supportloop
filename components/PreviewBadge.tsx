/**
 * Honest marker on surfaces whose chrome is built but whose live data / AI is
 * wired in a later phase. Keeps the demo from over-claiming.
 */
export default function PreviewBadge({ phase }: { phase: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Preview · live data in {phase}
    </span>
  );
}

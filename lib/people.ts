// Deterministic, friendly display names from a stable seed (e.g. a row id), so
// community posts and threads read like real people without storing PII.
const FIRST = [
  "Alex", "Sam", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Quinn", "Cameron",
  "Drew", "Skyler", "Hayden", "Reese", "Emerson", "Rowan", "Sage", "Devon", "Lena", "Mateo",
  "Priya", "Noah", "Mia", "Owen", "Zoe", "Kai", "Nina", "Theo", "Ivy", "Marco",
];
const LAST = [
  "Carter", "Nguyen", "Patel", "Garcia", "Kim", "Okafor", "Rossi", "Silva", "Hansen", "Brooks",
  "Mehta", "Diaz", "Walsh", "Cohen", "Park", "Ali", "Romano", "Fischer", "Lopez", "Reyes",
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** A consistent "Alex C." style handle for a given seed. */
export function personaName(seed: string): string {
  const h = hash(seed);
  return `${FIRST[h % FIRST.length]} ${LAST[(h >> 4) % LAST.length].charAt(0)}.`;
}

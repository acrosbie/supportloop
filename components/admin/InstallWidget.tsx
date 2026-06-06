"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function InstallWidget({ snippet }: { snippet: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-medium">Install the chat widget</div>
          <div className="text-xs text-muted">
            Paste this before &lt;/body&gt; on your site. The assistant answers from this workspace&apos;s knowledge and
            opens a ticket when it can&apos;t.
          </div>
        </div>
        <button
          onClick={copy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs font-medium hover:border-accent"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="mt-3 overflow-x-auto rounded-lg bg-surface-2 px-3 py-2 text-xs text-foreground/80">
        <code>{snippet}</code>
      </pre>
    </div>
  );
}

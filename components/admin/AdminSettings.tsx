"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";

interface Settings {
  accent?: string;
  tagline?: string;
  threshold?: number;
  domain?: string;
  assistant?: boolean;
  liveChat?: boolean;
  community?: boolean;
  webhookSecret?: string;
  apiKey?: string;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-2 text-sm">
      <span className="text-foreground/80">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        aria-label={label}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "bg-accent" : "bg-border-strong"}`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? "left-[18px]" : "left-0.5"}`} />
      </button>
    </label>
  );
}

export default function AdminSettings({ initial, slug }: { initial: Settings; slug: string }) {
  const [accent, setAccent] = useState(initial.accent || "#5e6ad2");
  const [tagline, setTagline] = useState(initial.tagline || "");
  const [threshold, setThreshold] = useState(initial.threshold ?? 0.6);
  const [domain, setDomain] = useState(initial.domain || "");
  const [assistant, setAssistant] = useState(initial.assistant !== false);
  const [liveChat, setLiveChat] = useState(initial.liveChat !== false);
  const [community, setCommunity] = useState(initial.community !== false);
  const [webhookSecret, setWebhookSecret] = useState(initial.webhookSecret || "");
  const [apiKey, setApiKey] = useState(initial.apiKey || "");
  const [busy, setBusy] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  async function save() {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ settings: { accent, tagline, threshold, domain, assistant, liveChat, community, webhookSecret, apiKey } }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Failed");
      toast.success("Settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">Brand accent</span>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              aria-label="Accent color"
              className="h-9 w-12 shrink-0 rounded border border-border bg-surface"
            />
            <input value={accent} onChange={(e) => setAccent(e.target.value)} className="field" />
          </div>
          <span className="mt-1 block text-xs text-muted">Re-skins your hosted help center + widget.</span>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Help center tagline</span>
          <input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="How can we help?"
            className="field mt-1"
          />
        </label>
      </div>
      <label className="block">
        <span className="text-sm font-medium">Answer confidence threshold · {threshold.toFixed(2)}</span>
        <input
          type="range"
          min={0.4}
          max={0.8}
          step={0.01}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="mt-2 w-full accent-accent"
        />
        <span className="mt-1 block text-xs text-muted">
          Higher = the assistant answers only when very confident (more escalations).
        </span>
      </label>

      <div className="space-y-2.5 border-t border-border pt-4">
        <span className="text-sm font-medium">Customer site components</span>
        <Toggle label="AI assistant (chatbot)" checked={assistant} onChange={setAssistant} />
        <Toggle label="Live chat escalation" checked={liveChat} onChange={setLiveChat} />
        <Toggle label="Community" checked={community} onChange={setCommunity} />
        <span className="block text-xs text-muted">Turn customer-facing pieces on or off for your help center.</span>
      </div>

      <label className="block border-t border-border pt-4">
        <span className="text-sm font-medium">Custom domain</span>
        <input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="help.yourcompany.com"
          className="field mt-1"
        />
        <span className="mt-1.5 block text-xs leading-relaxed text-muted">
          Add a CNAME record pointing <code className="rounded bg-surface-2 px-1">{domain || "help.yourcompany.com"}</code> →{" "}
          <code className="rounded bg-surface-2 px-1">cname.supportloop.app</code>. Until it&apos;s verified, your help
          center stays at <code className="rounded bg-surface-2 px-1">/help/{slug}</code>.
        </span>
      </label>

      <div className="space-y-2 border-t border-border pt-4">
        <span className="text-sm font-medium">Inbound webhook</span>
        <p className="text-xs text-muted">
          Let an external system open tickets here. Set a secret, then POST to your endpoint — the `webhook.received`
          workflow triages + routes it automatically.
        </p>
        <input
          value={webhookSecret}
          onChange={(e) => setWebhookSecret(e.target.value)}
          placeholder="bearer secret (a long random string)"
          className="field font-mono text-xs"
        />
        <div className="rounded-lg bg-surface-2 p-2.5 font-mono text-[11px] leading-relaxed text-muted">
          <div className="break-all">POST {origin}/api/hooks/{slug}</div>
          <div>Authorization: Bearer {webhookSecret || "<secret>"}</div>
          <div>{`{"subject":"Order delayed","body":"…","email":"you@co.com"}`}</div>
        </div>
      </div>

      <div className="space-y-2 border-t border-border pt-4">
        <span className="text-sm font-medium">API access</span>
        <p className="text-xs text-muted">
          A bearer key for the provisioning API — create/update accounts, customers, and tickets from your systems.
        </p>
        <input
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="api key (a long random string)"
          className="field font-mono text-xs"
        />
        <div className="rounded-lg bg-surface-2 p-2.5 font-mono text-[11px] leading-relaxed text-muted">
          <div className="break-all">POST {origin}/api/v1/customers</div>
          <div>Authorization: Bearer {apiKey || "<api-key>"}</div>
          <div>{`{"email":"sam@acme.com","name":"Sam","account":"Acme"}`}</div>
        </div>
      </div>

      <Button size="sm" onClick={save} disabled={busy}>
        {busy ? "Saving…" : "Save settings"}
      </Button>
    </div>
  );
}

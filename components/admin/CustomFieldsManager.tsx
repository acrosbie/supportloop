"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";

interface Def {
  id: string;
  entity: string;
  key: string;
  label: string;
  type: string;
  options: string[];
  required: boolean;
}

const ENTITIES = [
  { key: "customer", label: "Customers" },
  { key: "account", label: "Accounts" },
  { key: "ticket", label: "Tickets" },
  { key: "doc", label: "Docs" },
];
const TYPES = ["text", "number", "select", "date", "checkbox"];

function AddRow({
  entity,
  busy,
  onAdd,
}: {
  entity: string;
  busy: boolean;
  onAdd: (entity: string, label: string, type: string, options: string, required: boolean) => void;
}) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState("text");
  const [options, setOptions] = useState("");
  const [required, setRequired] = useState(false);

  return (
    <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-border pt-3">
      <label className="block">
        <span className="text-[10px] uppercase tracking-wide text-muted">Label</span>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Field name" className="field mt-1 w-40" />
      </label>
      <label className="block">
        <span className="text-[10px] uppercase tracking-wide text-muted">Type</span>
        <select value={type} onChange={(e) => setType(e.target.value)} className="field mt-1 w-28">
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      {type === "select" && (
        <label className="block">
          <span className="text-[10px] uppercase tracking-wide text-muted">Options (comma-sep)</span>
          <input value={options} onChange={(e) => setOptions(e.target.value)} placeholder="A, B, C" className="field mt-1 w-44" />
        </label>
      )}
      <label className="flex items-center gap-1 pb-2 text-xs text-muted">
        <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} className="h-3.5 w-3.5 accent-accent" />
        required
      </label>
      <Button
        size="sm"
        disabled={busy || !label.trim()}
        onClick={() => {
          onAdd(entity, label.trim(), type, options, required);
          setLabel("");
          setOptions("");
        }}
      >
        Add
      </Button>
    </div>
  );
}

export default function CustomFieldsManager({ defs }: { defs: Def[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function add(entity: string, label: string, type: string, options: string, required: boolean) {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/custom-fields", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ entity, label, type, options: options.split(",").map((s) => s.trim()).filter(Boolean), required }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Failed");
      toast.success("Field added");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/custom-fields", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Failed");
      toast.success("Field removed");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {ENTITIES.map((ent) => {
        const list = defs.filter((d) => d.entity === ent.key);
        return (
          <div key={ent.key} className="rounded-xl border border-border bg-surface p-4">
            <div className="text-sm font-medium">{ent.label}</div>
            {list.length > 0 ? (
              <ul className="mt-2 space-y-1.5">
                {list.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm"
                  >
                    <span className="min-w-0 truncate">
                      <span className="font-medium">{d.label}</span>{" "}
                      <span className="text-xs text-muted">
                        · {d.type}
                        {d.options.length ? ` (${d.options.join(", ")})` : ""}
                        {d.required ? " · required" : ""}
                      </span>
                    </span>
                    <button
                      onClick={() => remove(d.id)}
                      disabled={busy}
                      aria-label={`Remove ${d.label}`}
                      className="shrink-0 text-muted transition-colors hover:text-danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-muted">No custom fields yet.</p>
            )}
            <AddRow entity={ent.key} busy={busy} onAdd={add} />
          </div>
        );
      })}
    </div>
  );
}

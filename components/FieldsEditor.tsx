"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";

type FieldType = "text" | "number" | "select" | "date" | "checkbox";

export interface EditableField {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  custom?: boolean;
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: EditableField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  if (field.type === "checkbox") {
    return (
      <input
        type="checkbox"
        checked={value === true || value === "true"}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 accent-accent"
      />
    );
  }
  if (field.type === "select") {
    return (
      <select value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} className="field mt-1">
        <option value="">—</option>
        {(field.options ?? []).map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }
  const inputType = field.type === "number" ? "number" : field.type === "date" ? "date" : "text";
  return (
    <input
      type={inputType}
      value={(value as string | number | undefined) ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="field mt-1"
    />
  );
}

export default function FieldsEditor({
  entity,
  id,
  fields,
  initial,
}: {
  entity: string;
  id: string;
  fields: EditableField[];
  initial: Record<string, unknown>;
}) {
  const [values, setValues] = useState<Record<string, unknown>>(initial);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  function set(key: string, v: unknown) {
    setValues((p) => ({ ...p, [key]: v }));
    setDirty(true);
  }

  async function save() {
    setBusy(true);
    try {
      const r = await fetch("/api/fields", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ entity, id, values }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Failed");
      toast.success("Fields saved");
      setDirty(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (fields.length === 0) return <p className="text-sm text-muted">No fields defined.</p>;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((f) => (
          <label key={f.key} className="block">
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
              {f.label}
              {f.custom && (
                <span className="rounded bg-accent-soft px-1 text-[9px] uppercase tracking-wide text-accent-strong">
                  custom
                </span>
              )}
            </span>
            <FieldInput field={f} value={values[f.key]} onChange={(v) => set(f.key, v)} />
          </label>
        ))}
      </div>
      <Button size="sm" onClick={save} disabled={busy || !dirty}>
        {busy ? "Saving…" : "Save fields"}
      </Button>
    </div>
  );
}

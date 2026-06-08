import type { FieldEntity, FieldType } from "./types";

export interface StandardField {
  key: string;
  label: string;
  type: FieldType;
}

// Standard (real-column) editable fields per entity. These map to actual table
// columns; custom fields live in the entity's custom_fields jsonb.
export const STANDARD_FIELDS: Record<FieldEntity, StandardField[]> = {
  customer: [
    { key: "title", label: "Title", type: "text" },
    { key: "phone", label: "Phone", type: "text" },
    { key: "location", label: "Location", type: "text" },
    { key: "timezone", label: "Timezone", type: "text" },
    { key: "locale", label: "Locale", type: "text" },
    { key: "external_id", label: "External ID", type: "text" },
  ],
  account: [
    { key: "domain", label: "Domain", type: "text" },
    { key: "industry", label: "Industry", type: "text" },
    { key: "company_size", label: "Company size", type: "text" },
    { key: "region", label: "Region", type: "text" },
    { key: "arr", label: "ARR", type: "number" },
    { key: "renewal_date", label: "Renewal date", type: "date" },
    { key: "owner", label: "Account owner", type: "text" },
    { key: "external_id", label: "External ID", type: "text" },
  ],
  ticket: [],
  doc: [],
};

export const ENTITY_TABLE: Record<FieldEntity, string> = {
  customer: "customers",
  account: "accounts",
  ticket: "tickets",
  doc: "kb_articles",
};

export const ENTITY_LABEL: Record<FieldEntity, string> = {
  customer: "Customers",
  account: "Accounts",
  ticket: "Tickets",
  doc: "Docs",
};

export const FIELD_ENTITIES: FieldEntity[] = ["customer", "account", "ticket", "doc"];

export function isFieldEntity(x: unknown): x is FieldEntity {
  return x === "customer" || x === "account" || x === "ticket" || x === "doc";
}

const STANDARD_KEYS: Record<FieldEntity, Set<string>> = {
  customer: new Set(STANDARD_FIELDS.customer.map((f) => f.key)),
  account: new Set(STANDARD_FIELDS.account.map((f) => f.key)),
  ticket: new Set(STANDARD_FIELDS.ticket.map((f) => f.key)),
  doc: new Set(STANDARD_FIELDS.doc.map((f) => f.key)),
};

export function isStandardKey(entity: FieldEntity, key: string): boolean {
  return STANDARD_KEYS[entity].has(key);
}

/** Coerce a raw input value to the typed value stored for a given field type. */
export function coerceFieldValue(type: FieldType, raw: unknown): unknown {
  if (raw === "" || raw == null) return null;
  if (type === "number") {
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }
  if (type === "checkbox") return raw === true || raw === "true";
  return String(raw);
}

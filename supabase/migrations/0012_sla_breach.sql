-- 0012_sla_breach.sql — mark when a ticket first breached an SLA, so the sweep
-- fires the sla.breach workflow once per ticket. Run after 0011.
alter table tickets add column if not exists sla_breached_at timestamptz;

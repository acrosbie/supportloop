-- 0010_workflow_conditions.sql — rule conditions on workflows (v2). Run after 0009.
-- A condition is { all: [{ field, op, value }] } evaluated against the run
-- context (ticket / account); an empty object always passes.
alter table workflows add column if not exists condition jsonb not null default '{}';

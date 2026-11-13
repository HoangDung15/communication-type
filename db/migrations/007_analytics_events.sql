CREATE TABLE analytics_events (
  id uuid PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  event_name text NOT NULL CHECK (event_name IN ('page_view', 'quiz_started', 'consult_form_opened')),
  visitor_id uuid NOT NULL,
  session_id uuid NOT NULL,
  path text NOT NULL CHECK (path IN ('/', '/dang-ky')),
  surface text CHECK (surface IN ('modal', 'page')),
  entry_manager_id integer REFERENCES managers(id) ON DELETE SET NULL,
  attributed_manager_id integer REFERENCES managers(id) ON DELETE SET NULL,
  CHECK (
    (event_name = 'consult_form_opened' AND surface IS NOT NULL)
    OR (event_name <> 'consult_form_opened' AND surface IS NULL)
  )
);

CREATE INDEX analytics_events_name_time_idx ON analytics_events (event_name, occurred_at);
CREATE INDEX analytics_events_visitor_time_idx ON analytics_events (visitor_id, occurred_at);
CREATE INDEX analytics_events_manager_time_idx ON analytics_events (attributed_manager_id, occurred_at);
CREATE INDEX analytics_events_entry_time_idx ON analytics_events (entry_manager_id, occurred_at);
CREATE INDEX analytics_events_time_idx ON analytics_events (occurred_at);

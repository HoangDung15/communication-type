ALTER TABLE analytics_events
  DROP CONSTRAINT analytics_events_event_name_check;

ALTER TABLE analytics_events
  DROP CONSTRAINT analytics_events_check;

ALTER TABLE analytics_events
  ADD CONSTRAINT analytics_events_event_name_check
  CHECK (event_name IN ('page_view', 'quiz_completed', 'registration_opened'));

ALTER TABLE analytics_events
  ADD CONSTRAINT analytics_events_check
  CHECK (
    (event_name = 'registration_opened' AND surface IS NOT NULL)
    OR (event_name <> 'registration_opened' AND surface IS NULL)
  );

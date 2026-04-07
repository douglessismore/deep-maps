-- Push notifications for new location suggestions via ntfy.sh
-- Subscribe at: https://ntfy.sh/deepmaps-suggestions (browser or phone app)

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.notify_new_suggestion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  moment_name TEXT;
  user_name TEXT;
BEGIN
  SELECT name INTO moment_name FROM moments WHERE id = NEW.moment_id LIMIT 1;
  SELECT display_name INTO user_name FROM user_profiles WHERE id = NEW.user_id LIMIT 1;

  PERFORM net.http_post(
    url := 'https://ntfy.sh/deepmaps-suggestions',
    body := json_build_object(
      'topic', 'deepmaps-suggestions',
      'title', 'New location suggestion on Deep Maps',
      'message', COALESCE(user_name, 'Someone') || ' suggested a more accurate location for "' || COALESCE(moment_name, NEW.moment_id) || '" (' || NEW.accuracy_level || ')',
      'tags', ARRAY['world_map', 'pin'],
      'click', 'https://deepmaps.app'
    )::text,
    headers := json_build_object('Content-Type', 'application/json')::jsonb
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_new_suggestion failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_suggestion ON location_suggestions;
CREATE TRIGGER on_new_suggestion
  AFTER INSERT ON location_suggestions
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_suggestion();

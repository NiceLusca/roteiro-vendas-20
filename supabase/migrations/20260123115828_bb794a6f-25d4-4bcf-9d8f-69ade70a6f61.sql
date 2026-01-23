-- Remove trigger that causes error when moving leads
-- The mv_pipeline_metrics was moved to extensions schema but trigger still references public schema
-- Also, automatic refresh on every lead move doesn't scale well for 100k+ leads
-- Use scheduled/on-demand refresh instead

DROP TRIGGER IF EXISTS trigger_update_pipeline_metrics ON lead_pipeline_entries;

-- Update the refresh function to use correct schema and handle errors gracefully
CREATE OR REPLACE FUNCTION public.refresh_pipeline_metrics()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Try to refresh from extensions schema where view was moved
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY extensions.mv_pipeline_metrics;
  EXCEPTION WHEN OTHERS THEN
    -- If view doesn't exist or other error, just log and continue
    RAISE NOTICE 'Could not refresh mv_pipeline_metrics: %', SQLERRM;
  END;
END;
$function$;

-- Update trigger function to not fail operations
CREATE OR REPLACE FUNCTION public.trigger_refresh_pipeline_metrics()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Don't auto-refresh on every change - too expensive at scale
  -- Metrics will be refreshed on-demand when dashboard is accessed
  RETURN NULL;
END;
$function$;
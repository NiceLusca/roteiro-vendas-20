-- Backfill orders.closer using leads.closer when current value is sentinel/empty
-- Sentinel values: NULL, "", "-", "Não atribuído" (case + accent insensitive)

-- Step 1: copy real closer from leads when order's closer is sentinel and lead has a real one
UPDATE public.orders o
SET closer = btrim(l.closer)
FROM public.leads l
WHERE o.lead_id = l.id
  AND (
    o.closer IS NULL
    OR btrim(o.closer) = ''
    OR lower(btrim(o.closer)) IN (
      'nao atribuido','não atribuído','nao atribuído','não atribuido',
      '-','n/a','na','none','null','undefined'
    )
  )
  AND l.closer IS NOT NULL
  AND btrim(l.closer) <> ''
  AND lower(btrim(l.closer)) NOT IN (
    'nao atribuido','não atribuído','nao atribuído','não atribuido',
    '-','n/a','na','none','null','undefined'
  );

-- Step 2: any remaining sentinel-valued orders.closer -> NULL
UPDATE public.orders
SET closer = NULL
WHERE closer IS NOT NULL
  AND lower(btrim(closer)) IN (
    'nao atribuido','não atribuído','nao atribuído','não atribuido',
    '-','n/a','na','none','null','undefined'
  );
-- Mover materialized view para schema private para não expor na API pública
ALTER MATERIALIZED VIEW mv_pipeline_metrics SET SCHEMA extensions;
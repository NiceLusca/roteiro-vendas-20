-- Drop the problematic trigger that causes recursive update conflicts
DROP TRIGGER IF EXISTS trigger_reorder_pipeline_stages ON pipeline_stages;

-- Drop the function that was causing issues
DROP FUNCTION IF EXISTS reorder_pipeline_stages();
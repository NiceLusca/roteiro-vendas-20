-- Alter the origem column from enum to text for free-form input
ALTER TABLE public.leads 
ALTER COLUMN origem TYPE text USING origem::text;

-- Drop the origem_lead enum type as it's no longer needed
DROP TYPE IF EXISTS origem_lead;
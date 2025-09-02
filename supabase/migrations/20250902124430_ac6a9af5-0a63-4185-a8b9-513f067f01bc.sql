-- Fix security warning for function search path
CREATE OR REPLACE FUNCTION public.assign_default_data_to_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Update pipeline to belong to new user if it doesn't have an owner
    UPDATE public.pipelines 
    SET user_id = NEW.id 
    WHERE nome = 'Geral (Primário)' AND user_id IS NULL;
    
    -- Update product to belong to new user if it doesn't have an owner
    UPDATE public.products 
    SET user_id = NEW.id 
    WHERE nome = 'Indefinido' AND user_id IS NULL;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
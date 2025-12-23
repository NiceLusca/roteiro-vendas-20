-- 1. Corrigir a função handle_new_user para atribuir 'user' em vez de 'admin'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Inserir perfil se não existir
  INSERT INTO public.profiles (user_id, email, nome)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Atribuir role USER ao novo usuário (não admin!)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 2. Remover role admin de usuários que não deveriam ter
-- Manter apenas: Samuel, Clayderman, Igor, Lucas Nascimento
DELETE FROM public.user_roles 
WHERE role = 'admin' 
AND user_id NOT IN (
  SELECT user_id FROM public.profiles 
  WHERE LOWER(nome) LIKE '%samuel%'
     OR LOWER(nome) LIKE '%clayderman%'
     OR LOWER(nome) LIKE '%igor%'
     OR (LOWER(nome) LIKE '%lucas%' AND LOWER(nome) LIKE '%nascimento%')
     OR LOWER(full_name) LIKE '%samuel%'
     OR LOWER(full_name) LIKE '%clayderman%'
     OR LOWER(full_name) LIKE '%igor%'
     OR (LOWER(full_name) LIKE '%lucas%' AND LOWER(full_name) LIKE '%nascimento%')
);

-- 3. Garantir que usuários que perderam admin tenham role 'user'
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'user'::app_role
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = p.user_id AND ur.role = 'user'
)
ON CONFLICT (user_id, role) DO NOTHING;
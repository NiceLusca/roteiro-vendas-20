-- Criar nova política permissiva para permitir que usuários autenticados vejam todos os perfis
-- Isso é necessário para o sistema de responsáveis funcionar corretamente
CREATE POLICY "Authenticated users can view all profiles for responsible selection"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);
-- Grant admin role to carol@gmail.com (full access to all features)
INSERT INTO public.user_roles (user_id, role)
VALUES ('ffa306b3-f5f1-4da5-be5f-4f967e6f2227', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- Ensure profile exists
INSERT INTO public.profiles (user_id, email, nome)
VALUES ('ffa306b3-f5f1-4da5-be5f-4f967e6f2227', 'carol@gmail.com', 'carol@gmail.com')
ON CONFLICT (user_id) DO NOTHING;
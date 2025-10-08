-- Drop the restrictive admin-only policy for tags
DROP POLICY IF EXISTS "Admins can manage tags" ON public.tags;

-- Allow authenticated users to create tags
CREATE POLICY "Authenticated users can create tags"
ON public.tags
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update tags
CREATE POLICY "Authenticated users can update tags"
ON public.tags
FOR UPDATE
TO authenticated
USING (true);

-- Only admins can delete tags
CREATE POLICY "Admins can delete tags"
ON public.tags
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
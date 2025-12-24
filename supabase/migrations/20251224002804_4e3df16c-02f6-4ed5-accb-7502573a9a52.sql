-- Add policy to allow users with edit access to reorder stages
CREATE POLICY "Users with edit access can update stages" 
ON pipeline_stages 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_pipeline_access(auth.uid(), pipeline_id, 'edit'::text)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_pipeline_access(auth.uid(), pipeline_id, 'edit'::text)
);
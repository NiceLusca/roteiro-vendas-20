import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContextSecure';

export type AccessLevel = 'none' | 'view' | 'edit' | 'manage' | 'admin';

interface PipelineAccess {
  id: string;
  user_id: string;
  pipeline_id: string;
  access_level: 'view' | 'edit' | 'manage';
  created_at: string;
}

interface PipelineAccessWithDetails extends PipelineAccess {
  pipelines?: {
    id: string;
    nome: string;
    slug: string;
  };
}

export function usePipelineAccess() {
  const { user } = useAuth();
  const [accessList, setAccessList] = useState<PipelineAccessWithDetails[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAccess = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Check if user is admin
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      const userIsAdmin = !!roleData;
      setIsAdmin(userIsAdmin);

      if (userIsAdmin) {
        // Admins have access to all pipelines
        setAccessList([]);
      } else {
        // Fetch user's specific pipeline access
        const { data: accessData, error } = await supabase
          .from('pipeline_access')
          .select(`
            id,
            user_id,
            pipeline_id,
            access_level,
            created_at,
            pipelines (id, nome, slug)
          `)
          .eq('user_id', user.id);

        if (error) throw error;
        setAccessList((accessData || []) as PipelineAccessWithDetails[]);
      }
    } catch (error) {
      console.error('Error fetching pipeline access:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAccess();
  }, [fetchAccess]);

  // Get access level for a specific pipeline
  const getAccessLevel = useCallback((pipelineId: string): AccessLevel => {
    if (isAdmin) return 'admin';
    
    const access = accessList.find(a => a.pipeline_id === pipelineId);
    return access?.access_level || 'none';
  }, [isAdmin, accessList]);

  // Check if user has at least a certain access level
  const hasAccess = useCallback((pipelineId: string, minLevel: AccessLevel = 'view'): boolean => {
    if (isAdmin) return true;
    
    const currentLevel = getAccessLevel(pipelineId);
    
    if (currentLevel === 'none') return false;
    
    const levelHierarchy: Record<AccessLevel, number> = {
      none: 0,
      view: 1,
      edit: 2,
      manage: 3,
      admin: 4
    };
    
    return levelHierarchy[currentLevel] >= levelHierarchy[minLevel];
  }, [isAdmin, getAccessLevel]);

  // Check if user can access a pipeline (view or higher)
  const canAccessPipeline = useCallback((pipelineId: string): boolean => {
    return hasAccess(pipelineId, 'view');
  }, [hasAccess]);

  // Check if user can edit leads in a pipeline
  const canEditPipeline = useCallback((pipelineId: string): boolean => {
    return hasAccess(pipelineId, 'edit');
  }, [hasAccess]);

  // Check if user can manage a pipeline (stages, settings)
  const canManagePipeline = useCallback((pipelineId: string): boolean => {
    return hasAccess(pipelineId, 'manage');
  }, [hasAccess]);

  // Get list of accessible pipeline IDs
  const accessiblePipelineIds = useMemo(() => {
    if (isAdmin) return null; // null means all pipelines
    return accessList.map(a => a.pipeline_id);
  }, [isAdmin, accessList]);

  return {
    isAdmin,
    loading,
    accessList,
    getAccessLevel,
    hasAccess,
    canAccessPipeline,
    canEditPipeline,
    canManagePipeline,
    accessiblePipelineIds,
    refetch: fetchAccess
  };
}

// Hook for managing pipeline access (admin only)
export function usePipelineAccessManager() {
  const [allAccess, setAllAccess] = useState<PipelineAccess[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllAccess = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pipeline_access')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllAccess((data || []) as PipelineAccess[]);
    } catch (error) {
      console.error('Error fetching all pipeline access:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllAccess();
  }, [fetchAllAccess]);

  const grantAccess = useCallback(async (
    userId: string, 
    pipelineId: string, 
    accessLevel: 'view' | 'edit' | 'manage'
  ) => {
    const { error } = await supabase
      .from('pipeline_access')
      .upsert({
        user_id: userId,
        pipeline_id: pipelineId,
        access_level: accessLevel
      }, {
        onConflict: 'user_id,pipeline_id'
      });

    if (error) throw error;
    await fetchAllAccess();
  }, [fetchAllAccess]);

  const revokeAccess = useCallback(async (userId: string, pipelineId: string) => {
    const { error } = await supabase
      .from('pipeline_access')
      .delete()
      .eq('user_id', userId)
      .eq('pipeline_id', pipelineId);

    if (error) throw error;
    await fetchAllAccess();
  }, [fetchAllAccess]);

  const getUserAccess = useCallback((userId: string): PipelineAccess[] => {
    return allAccess.filter(a => a.user_id === userId);
  }, [allAccess]);

  const getPipelineAccess = useCallback((pipelineId: string): PipelineAccess[] => {
    return allAccess.filter(a => a.pipeline_id === pipelineId);
  }, [allAccess]);

  return {
    allAccess,
    loading,
    grantAccess,
    revokeAccess,
    getUserAccess,
    getPipelineAccess,
    refetch: fetchAllAccess
  };
}

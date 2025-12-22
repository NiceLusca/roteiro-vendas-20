import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContextSecure';

export type AppRole = 'admin' | 'moderator' | 'user';

interface UseUserRoleResult {
  role: AppRole | null;
  isAdmin: boolean;
  isModerator: boolean;
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useUserRole(): UseUserRoleResult {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = useCallback(async () => {
    if (!user?.id) {
      setRole(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Check for admin role first (highest priority)
      const { data: adminRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (adminRole) {
        setRole('admin');
        return;
      }

      // Check for moderator role
      const { data: modRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'moderator')
        .maybeSingle();

      if (modRole) {
        setRole('moderator');
        return;
      }

      // Default to user
      setRole('user');
    } catch (error) {
      console.error('Error fetching user role:', error);
      setRole('user'); // Default to user on error
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  return {
    role,
    isAdmin: role === 'admin',
    isModerator: role === 'moderator',
    loading,
    refetch: fetchRole
  };
}

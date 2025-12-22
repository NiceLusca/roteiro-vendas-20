import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContextSecure';
import { useUserRole } from '@/hooks/useUserRole';
import { EnhancedLoading } from '@/components/ui/enhanced-loading';
import { toast } from 'sonner';
import { useEffect, useRef } from 'react';

interface AdminRouteProps {
  children: ReactNode;
  requireAdmin?: boolean; // true = apenas admin, false = admin ou moderator
}

export function AdminRoute({ children, requireAdmin = false }: AdminRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isModerator, loading: roleLoading } = useUserRole();
  const toastShownRef = useRef(false);

  const loading = authLoading || roleLoading;
  const hasAccess = requireAdmin ? isAdmin : (isAdmin || isModerator);

  useEffect(() => {
    if (!loading && user && !hasAccess && !toastShownRef.current) {
      toastShownRef.current = true;
      toast.error('Acesso restrito', {
        description: requireAdmin 
          ? 'Esta página é exclusiva para administradores.'
          : 'Esta página é exclusiva para administradores e moderadores.'
      });
    }
  }, [loading, user, hasAccess, requireAdmin]);

  if (loading) {
    return (
      <EnhancedLoading loading={true}>
        <></>
      </EnhancedLoading>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

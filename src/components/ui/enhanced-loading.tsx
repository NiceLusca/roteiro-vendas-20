import { useState, useEffect } from 'react';
import { Loader2, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';

interface EnhancedLoadingProps {
  loading: boolean;
  error?: Error | null;
  children: React.ReactNode;
  skeleton?: React.ReactNode;
  fallback?: React.ReactNode;
  timeout?: number;
  retry?: () => void;
  className?: string;
}

export function EnhancedLoading({
  loading,
  error,
  children,
  skeleton,
  fallback,
  timeout = 10000,
  retry,
  className
}: EnhancedLoadingProps) {
  const [showTimeout, setShowTimeout] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (loading && timeout > 0) {
      const timer = setTimeout(() => {
        setShowTimeout(true);
      }, timeout);

      return () => {
        clearTimeout(timer);
        setShowTimeout(false);
      };
    }
  }, [loading, timeout]);

  if (error) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-8 text-center', className)}>
        <div className="mb-4 text-destructive">
          {!isOnline ? <WifiOff className="h-8 w-8" /> : <div className="h-8 w-8 rounded-full bg-destructive/20 flex items-center justify-center">!</div>}
        </div>
        <h3 className="text-lg font-medium mb-2">
          {!isOnline ? 'Sem conexão' : 'Erro ao carregar'}
        </h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
          {!isOnline 
            ? 'Verifique sua conexão com a internet e tente novamente.'
            : error.message || 'Ocorreu um erro inesperado.'
          }
        </p>
        {retry && (
          <button
            onClick={retry}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Tentar novamente
          </button>
        )}
      </div>
    );
  }

  if (loading) {
    if (showTimeout && retry) {
      return (
        <div className={cn('flex flex-col items-center justify-center py-8 text-center', className)}>
          <Loader2 className="h-8 w-8 animate-spin mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Carregando...</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            Isso está demorando mais que o esperado.
          </p>
          <button
            onClick={retry}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    if (skeleton) {
      return <div className={className}>{skeleton}</div>;
    }

    if (fallback) {
      return <div className={className}>{fallback}</div>;
    }

    return (
      <div className={cn('flex flex-col items-center justify-center py-8', className)}>
        <Loader2 className="h-8 w-8 animate-spin mb-2 text-primary" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return <>{children}</>;
}

// Smart skeleton that adapts to content
interface SmartSkeletonProps {
  lines?: number;
  avatar?: boolean;
  actions?: boolean;
  className?: string;
  variant?: 'card' | 'list' | 'table' | 'form';
}

export function SmartSkeleton({ 
  lines = 3, 
  avatar = false, 
  actions = false, 
  className,
  variant = 'card'
}: SmartSkeletonProps) {
  if (variant === 'table') {
    return (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: lines }, (_, i) => (
          <div key={i} className="flex items-center space-x-4">
            {avatar && <Skeleton className="h-10 w-10 rounded-full" />}
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            {actions && <Skeleton className="h-8 w-20" />}
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: lines }, (_, i) => (
          <div key={i} className="flex items-start space-x-3">
            {avatar && <Skeleton className="h-8 w-8 rounded-full" />}
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'form') {
    return (
      <div className={cn('space-y-6', className)}>
        {Array.from({ length: lines }, (_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        {actions && (
          <div className="flex gap-2 pt-4">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-16" />
          </div>
        )}
      </div>
    );
  }

  // Default card variant
  return (
    <div className={cn('space-y-4 p-4 border rounded-lg', className)}>
      {avatar && (
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      )}
      <div className="space-y-2">
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton 
            key={i} 
            className={cn(
              'h-4',
              i === lines - 1 ? 'w-2/3' : 'w-full'
            )} 
          />
        ))}
      </div>
      {actions && (
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" />
        </div>
      )}
    </div>
  );
}

// Progressive loading component
interface ProgressiveLoadingProps {
  stages: {
    name: string;
    duration: number;
    component?: React.ReactNode;
  }[];
  onComplete?: () => void;
  className?: string;
}

export function ProgressiveLoading({ 
  stages, 
  onComplete, 
  className 
}: ProgressiveLoadingProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (currentStage >= stages.length) {
      onComplete?.();
      return;
    }

    const stage = stages[currentStage];
    const timer = setTimeout(() => {
      setCurrentStage(prev => prev + 1);
      setProgress(((currentStage + 1) / stages.length) * 100);
    }, stage.duration);

    return () => clearTimeout(timer);
  }, [currentStage, stages, onComplete]);

  if (currentStage >= stages.length) {
    return null;
  }

  const currentStageData = stages[currentStage];

  return (
    <div className={cn('flex flex-col items-center justify-center py-8', className)}>
      <div className="w-full max-w-md space-y-4">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm font-medium">{currentStageData.name}</span>
        </div>
        
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="text-xs text-muted-foreground text-center">
          {currentStage + 1} de {stages.length} etapas
        </div>

        {currentStageData.component && (
          <div className="mt-4">
            {currentStageData.component}
          </div>
        )}
      </div>
    </div>
  );
}
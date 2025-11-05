import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageLoadingProps {
  message?: string;
  className?: string;
}

/**
 * Standardized page loading component
 * Use this for full-page loading states
 */
export function PageLoading({ 
  message = 'Carregando...', 
  className 
}: PageLoadingProps) {
  return (
    <div 
      className={cn(
        'flex flex-col items-center justify-center min-h-[400px] w-full',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

interface SectionLoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Standardized section loading component
 * Use this for section-level loading states within a page
 */
export function SectionLoading({ 
  message = 'Carregando...', 
  size = 'md',
  className 
}: SectionLoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div 
      className={cn(
        'flex flex-col items-center justify-center py-8',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <Loader2 className={cn(sizeClasses[size], 'animate-spin text-primary mb-2')} />
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  );
}

interface InlineLoadingProps {
  message?: string;
  className?: string;
}

/**
 * Standardized inline loading component
 * Use this for inline loading states (buttons, etc)
 */
export function InlineLoading({ 
  message = 'Carregando...', 
  className 
}: InlineLoadingProps) {
  return (
    <span 
      className={cn('inline-flex items-center gap-2', className)}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm">{message}</span>
    </span>
  );
}

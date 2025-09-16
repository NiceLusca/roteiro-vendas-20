import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuccessAnimationProps {
  show: boolean;
  message: string;
  onComplete?: () => void;
}

export function SuccessAnimation({ show, message, onComplete }: SuccessAnimationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div 
        className={cn(
          "bg-success text-success-foreground px-6 py-4 rounded-lg shadow-lg",
          "flex items-center gap-3 animate-scale-in",
          visible && "animate-fade-in"
        )}
      >
        <div className="w-8 h-8 bg-success-foreground/20 rounded-full flex items-center justify-center animate-pulse">
          <Check className="w-5 h-5" />
        </div>
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
}
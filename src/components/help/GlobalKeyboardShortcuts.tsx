import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function GlobalKeyboardShortcuts() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {

    const handleKeyDown = (event: KeyboardEvent) => {
      // Help shortcuts
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === '?') {
        event.preventDefault();
        navigate('/help');
        return;
      }

      // Navigation shortcuts - only for number keys
      if (event.altKey && !event.ctrlKey && !event.metaKey) {
        const key = event.key;
        
        // Only handle number keys, let other Alt combinations pass through
        // (e.g., Alt+C for Ç on Mac keyboards)
        const navigationKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
        if (!navigationKeys.includes(key)) {
          return;
        }
        
        event.preventDefault();
        
        switch (key) {
          case '1':
            navigate('/');
            break;
          case '2':
            navigate('/pipelines');
            break;
          case '3':
            navigate('/leads');
            break;
          case '4':
            navigate('/agenda');
            break;
          case '5':
            navigate('/deals');
            break;
          case '6':
            navigate('/orders');
            break;
          case '7':
            navigate('/reports');
            break;
          case '8':
            navigate('/analytics');
            break;
          case '9':
            navigate('/settings');
            break;
          case '0':
            navigate('/help');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate, location]);

  return null; // This component doesn't render anything
}
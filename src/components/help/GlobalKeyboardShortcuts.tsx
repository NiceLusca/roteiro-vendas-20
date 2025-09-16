import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function GlobalKeyboardShortcuts() {
  const navigate = useNavigate();
  const location = useLocation();

  // Only enable shortcuts when router context is available
  const isRouterAvailable = Boolean(location);

  useEffect(() => {
    if (!isRouterAvailable) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Help shortcuts
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === '?') {
        event.preventDefault();
        navigate('/help');
        return;
      }

      // Navigation shortcuts
      if (event.altKey && !event.ctrlKey && !event.metaKey) {
        const key = event.key;
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
          default:
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate, isRouterAvailable]);

  return null; // This component doesn't render anything
}
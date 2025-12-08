import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, User, Search, Command } from 'lucide-react';
import { BreadcrumbNavigation } from '@/components/ui/breadcrumb-navigation';
import { CommandPalette } from '@/components/ui/command-palette';
import { KeyboardShortcutsHelp } from '@/components/ui/keyboard-shortcuts-help';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { useSLANotifications } from '@/hooks/useSLANotifications';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContextSecure';
import { useNavigate } from 'react-router-dom';

export function AppLayout() {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Initialize SLA notifications monitoring
  useSLANotifications();

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in form elements
      const activeElement = document.activeElement as HTMLElement;
      const isFormElement = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.tagName === 'SELECT' ||
        activeElement.isContentEditable ||
        activeElement.closest('[role="combobox"]') ||
        activeElement.closest('[role="textbox"]')
      );

      // Command palette (always works)
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }
      
      // Keyboard shortcuts help (always works)
      if (e.key === '/' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShortcutsHelpOpen(true);
        return;
      }

      // Skip navigation shortcuts when typing in forms
      if (isFormElement) {
        return;
      }

      // Global navigation shortcuts (only when not in form elements)
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'd':
            e.preventDefault();
            navigate('/');
            break;
          case 'p':
            e.preventDefault();
            navigate('/pipelines');
            break;
          case 'l':
            e.preventDefault();
            navigate('/leads');
            break;
          case 'a':
            e.preventDefault();
            navigate('/agenda');
            break;
          case 'n':
            e.preventDefault();
            navigate('/deals');
            break;
          case 'v':
            e.preventDefault();
            navigate('/orders');
            break;
          case 'r':
            e.preventDefault();
            navigate('/reports');
            break;
          case ',':
            e.preventDefault();
            navigate('/settings');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen for custom events
  useEffect(() => {
    const handleOpenCommandPalette = () => setCommandPaletteOpen(true);
    const handleOpenKeyboardShortcuts = () => setShortcutsHelpOpen(true);

    window.addEventListener('open-command-palette', handleOpenCommandPalette);
    window.addEventListener('open-keyboard-shortcuts', handleOpenKeyboardShortcuts);

    return () => {
      window.removeEventListener('open-command-palette', handleOpenCommandPalette);
      window.removeEventListener('open-keyboard-shortcuts', handleOpenKeyboardShortcuts);
    };
  }, []);

  const handleCreateLead = () => {
    navigate('/leads');
    // Dispatch event immediately - React Router handles timing
    const event = new CustomEvent('open-create-lead-dialog');
    window.dispatchEvent(event);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Enhanced Header */}
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 flex items-center justify-between px-6 sticky top-0 z-[9]">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="hidden md:block">
                <BreadcrumbNavigation />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Quick Search */}
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => setCommandPaletteOpen(true)}
              >
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Buscar...</span>
                <kbd className="hidden sm:inline-flex pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-2">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>

              {/* Command Palette Trigger */}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setCommandPaletteOpen(true)}
                className="hidden md:flex"
              >
                <Command className="h-4 w-4" />
              </Button>
              
              {/* Create Lead */}
              <Button size="sm" className="gap-2" onClick={handleCreateLead}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Novo Lead</span>
              </Button>
              
              {/* Notifications */}
              <NotificationCenter />
              
              {/* User Menu */}
              <Button variant="ghost" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                {user && (
                  <span className="hidden sm:inline text-sm">
                    {user.email?.split('@')[0]}
                  </span>
                )}
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 relative">
            <Outlet />
          </main>
        </div>

        {/* Global Components */}
        <CommandPalette 
          open={commandPaletteOpen} 
          onOpenChange={setCommandPaletteOpen} 
        />
        
        <KeyboardShortcutsHelp 
          open={shortcutsHelpOpen} 
          onOpenChange={setShortcutsHelpOpen} 
        />
      </div>
    </SidebarProvider>
  );
}
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Bell, User, Search, Command } from 'lucide-react';
import { BreadcrumbNavigation } from '@/components/ui/breadcrumb-navigation';
import { CommandPalette } from '@/components/ui/command-palette';
import { KeyboardShortcutsHelp } from '@/components/ui/keyboard-shortcuts-help';
import { CommunicationHub } from '@/components/communication/CommunicationHub';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function AppLayout() {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);
  const { user } = useAuth();

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command palette
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      
      // Keyboard shortcuts help
      if (e.key === '/' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShortcutsHelpOpen(true);
      }

      // Global navigation shortcuts
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'd':
            e.preventDefault();
            window.location.href = '/';
            break;
          case 'p':
            e.preventDefault();
            window.location.href = '/pipelines';
            break;
          case 'l':
            e.preventDefault();
            window.location.href = '/leads';
            break;
          case 'a':
            e.preventDefault();
            window.location.href = '/agenda';
            break;
          case 'n':
            e.preventDefault();
            window.location.href = '/deals';
            break;
          case 'v':
            e.preventDefault();
            window.location.href = '/orders';
            break;
          case 'r':
            e.preventDefault();
            window.location.href = '/reports';
            break;
          case ',':
            e.preventDefault();
            window.location.href = '/settings';
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
    const event = new CustomEvent('open-create-lead-dialog');
    window.dispatchEvent(event);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Enhanced Header */}
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 flex items-center justify-between px-6 sticky top-0 z-50">
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
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full" />
              </Button>
              
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
          <main className="flex-1 overflow-auto relative">
            <div className="p-6">
              <Outlet />
            </div>
            
            {/* Communication Hub - Fixed Position */}
            <CommunicationHub compact={true} />
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
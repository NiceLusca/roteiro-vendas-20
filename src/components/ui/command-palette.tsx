import React, { useState, useEffect } from 'react';
import { 
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { 
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  Search,
  GitBranch,
  Users,
  TrendingUp,
  ShoppingCart,
  BarChart3,
  LayoutDashboard,
  Plus,
  Filter,
  BookOpen,
  Keyboard,
  Palette
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContextSecure';
import { useSupabaseLeads } from '@/hooks/useSupabaseLeads';
import { useSupabasePipelines } from '@/hooks/useSupabasePipelines';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CommandAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  group: string;
  action: () => void;
  keywords?: string[];
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { leads } = useSupabaseLeads();
  const { pipelines } = useSupabasePipelines();
  const [searchTerm, setSearchTerm] = useState('');

  // Navigation actions
  const navigationActions: CommandAction[] = [
    {
      id: 'nav-dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      shortcut: '⌘ + D',
      group: 'Navegação',
      action: () => navigate('/'),
      keywords: ['home', 'início', 'dashboard', 'principal']
    },
    {
      id: 'nav-pipelines',
      label: 'Pipelines',
      icon: GitBranch,
      shortcut: '⌘ + P',
      group: 'Navegação',
      action: () => navigate('/pipelines'),
      keywords: ['pipeline', 'funil', 'processo']
    },
    {
      id: 'nav-leads',
      label: 'Leads',
      icon: Users,
      shortcut: '⌘ + L',
      group: 'Navegação',
      action: () => navigate('/leads'),
      keywords: ['leads', 'prospects', 'clientes']
    },
    {
      id: 'nav-agenda',
      label: 'Agenda',
      icon: Calendar,
      shortcut: '⌘ + A',
      group: 'Navegação',
      action: () => navigate('/agenda'),
      keywords: ['agenda', 'calendário', 'agendamentos']
    },
    {
      id: 'nav-deals',
      label: 'Negociações',
      icon: TrendingUp,
      shortcut: '⌘ + N',
      group: 'Navegação',
      action: () => navigate('/deals'),
      keywords: ['negociações', 'deals', 'vendas']
    },
    {
      id: 'nav-orders',
      label: 'Vendas',
      icon: ShoppingCart,
      shortcut: '⌘ + V',
      group: 'Navegação',
      action: () => navigate('/orders'),
      keywords: ['vendas', 'pedidos', 'orders']
    },
    {
      id: 'nav-reports',
      label: 'Relatórios',
      icon: BarChart3,
      shortcut: '⌘ + R',
      group: 'Navegação',
      action: () => navigate('/reports'),
      keywords: ['relatórios', 'analytics', 'reports']
    },
    {
      id: 'nav-settings',
      label: 'Configurações',
      icon: Settings,
      shortcut: '⌘ + ,',
      group: 'Navegação',
      action: () => navigate('/settings'),
      keywords: ['configurações', 'settings', 'config']
    }
  ];

  // Quick actions
  const quickActions: CommandAction[] = [
    {
      id: 'create-lead',
      label: 'Criar Novo Lead',
      icon: Plus,
      shortcut: '⌘ + Shift + L',
      group: 'Ações Rápidas',
      action: () => {
        navigate('/leads');
        // Trigger create lead dialog
        setTimeout(() => {
          const event = new CustomEvent('open-create-lead-dialog');
          window.dispatchEvent(event);
        }, 100);
      },
      keywords: ['criar', 'novo', 'lead', 'prospect']
    },
    {
      id: 'create-appointment',
      label: 'Agendar Reunião',
      icon: Calendar,
      shortcut: '⌘ + Shift + A',
      group: 'Ações Rápidas',
      action: () => {
        navigate('/agenda');
        setTimeout(() => {
          const event = new CustomEvent('open-create-appointment-dialog');
          window.dispatchEvent(event);
        }, 100);
      },
      keywords: ['agendar', 'reunião', 'appointment', 'meeting']
    },
    {
      id: 'search-leads',
      label: 'Buscar Leads',
      icon: Search,
      shortcut: '⌘ + Shift + F',
      group: 'Ações Rápidas',
      action: () => {
        navigate('/leads');
        setTimeout(() => {
          const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
        }, 100);
      },
      keywords: ['buscar', 'procurar', 'search', 'find']
    }
  ];

  // System actions
  const systemActions: CommandAction[] = [
    {
      id: 'toggle-theme',
      label: 'Alternar Tema',
      icon: Palette,
      shortcut: '⌘ + Shift + T',
      group: 'Sistema',
      action: () => {
        const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.classList.remove(currentTheme);
        document.documentElement.classList.add(newTheme);
        localStorage.setItem('theme', newTheme);
      },
      keywords: ['tema', 'theme', 'dark', 'light', 'escuro', 'claro']
    },
    {
      id: 'keyboard-shortcuts',
      label: 'Atalhos do Teclado',
      icon: Keyboard,
      group: 'Sistema',
      action: () => {
        const event = new CustomEvent('open-keyboard-shortcuts');
        window.dispatchEvent(event);
      },
      keywords: ['atalhos', 'shortcuts', 'keyboard', 'teclado']
    },
    {
      id: 'help',
      label: 'Ajuda',
      icon: BookOpen,
      group: 'Sistema',
      action: () => {
        const event = new CustomEvent('open-help-center');
        window.dispatchEvent(event);
      },
      keywords: ['ajuda', 'help', 'suporte', 'support']
    }
  ];

  // Dynamic data actions (recent leads, pipelines, etc.)
  const dataActions: CommandAction[] = [
    ...leads.slice(0, 5).map(lead => ({
      id: `lead-${lead.id}`,
      label: `Lead: ${lead.nome}`,
      icon: User,
      group: 'Leads Recentes',
      action: () => navigate(`/leads/${lead.id}`),
      keywords: [lead.nome, lead.email || '', 'lead']
    })),
    ...pipelines.slice(0, 3).map(pipeline => ({
      id: `pipeline-${pipeline.id}`,
      label: `Pipeline: ${pipeline.nome}`,
      icon: GitBranch,
      group: 'Pipelines',
      action: () => navigate(`/pipelines/${pipeline.slug}`),
      keywords: [pipeline.nome, 'pipeline', 'funil']
    }))
  ];

  const allActions = [
    ...navigationActions,
    ...quickActions,
    ...systemActions,
    ...dataActions
  ];

  const filteredActions = allActions.filter(action => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      action.label.toLowerCase().includes(searchLower) ||
      action.keywords?.some(keyword => keyword.toLowerCase().includes(searchLower))
    );
  });

  const groupedActions = filteredActions.reduce((acc, action) => {
    if (!acc[action.group]) {
      acc[action.group] = [];
    }
    acc[action.group].push(action);
    return acc;
  }, {} as Record<string, CommandAction[]>);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  const runCommand = (action: CommandAction) => {
    onOpenChange(false);
    action.action();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Digite um comando ou pesquise..." 
        value={searchTerm}
        onValueChange={setSearchTerm}
      />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        
        {Object.entries(groupedActions).map(([group, actions], index) => (
          <React.Fragment key={group}>
            {index > 0 && <CommandSeparator />}
            <CommandGroup heading={group}>
              {actions.map((action) => (
                <CommandItem
                  key={action.id}
                  onSelect={() => runCommand(action)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <action.icon className="h-4 w-4" />
                    <span>{action.label}</span>
                  </div>
                  {action.shortcut && (
                    <Badge variant="outline" className="text-xs">
                      {action.shortcut}
                    </Badge>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </React.Fragment>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
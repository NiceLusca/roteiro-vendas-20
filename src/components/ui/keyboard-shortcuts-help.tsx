import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Command, 
  Search, 
  Navigation, 
  Zap,
  Keyboard,
  LayoutDashboard,
  GitBranch,
  Users,
  Calendar,
  TrendingUp,
  ShoppingCart,
  BarChart3,
  Settings,
  Plus,
  Filter,
  Palette
} from 'lucide-react';

interface KeyboardShortcut {
  category: string;
  shortcuts: Array<{
    keys: string;
    description: string;
    icon?: React.ComponentType<{ className?: string }>;
  }>;
}

const keyboardShortcuts: KeyboardShortcut[] = [
  {
    category: 'Geral',
    shortcuts: [
      {
        keys: '⌘ + K',
        description: 'Abrir Paleta de Comandos',
        icon: Command
      },
      {
        keys: '⌘ + /',
        description: 'Mostrar Atalhos de Teclado',
        icon: Keyboard
      },
      {
        keys: 'Esc',
        description: 'Fechar Dialogs/Modais'
      }
    ]
  },
  {
    category: 'Navegação',
    shortcuts: [
      {
        keys: '⌘ + D',
        description: 'Ir para Dashboard',
        icon: LayoutDashboard
      },
      {
        keys: '⌘ + P',
        description: 'Ir para Pipelines',
        icon: GitBranch
      },
      {
        keys: '⌘ + L',
        description: 'Ir para Leads',
        icon: Users
      },
      {
        keys: '⌘ + A',
        description: 'Ir para Agenda',
        icon: Calendar
      },
      {
        keys: '⌘ + N',
        description: 'Ir para Negociações',
        icon: TrendingUp
      },
      {
        keys: '⌘ + V',
        description: 'Ir para Vendas',
        icon: ShoppingCart
      },
      {
        keys: '⌘ + R',
        description: 'Ir para Relatórios',
        icon: BarChart3
      },
      {
        keys: '⌘ + ,',
        description: 'Ir para Configurações',
        icon: Settings
      }
    ]
  },
  {
    category: 'Ações Rápidas',
    shortcuts: [
      {
        keys: '⌘ + Shift + L',
        description: 'Criar Novo Lead',
        icon: Plus
      },
      {
        keys: '⌘ + Shift + A',
        description: 'Agendar Reunião',
        icon: Calendar
      },
      {
        keys: '⌘ + Shift + F',
        description: 'Buscar Leads',
        icon: Search
      },
      {
        keys: '⌘ + F',
        description: 'Filtrar Resultados',
        icon: Filter
      }
    ]
  },
  {
    category: 'Interface',
    shortcuts: [
      {
        keys: '⌘ + Shift + T',
        description: 'Alternar Tema (Claro/Escuro)',
        icon: Palette
      },
      {
        keys: '⌘ + B',
        description: 'Alternar Sidebar'
      },
      {
        keys: '⌘ + ↑',
        description: 'Voltar ao Topo'
      },
      {
        keys: '⌘ + ↓',
        description: 'Ir para o Final'
      }
    ]
  },
  {
    category: 'Tabelas e Listas',
    shortcuts: [
      {
        keys: '↑ ↓',
        description: 'Navegar entre itens'
      },
      {
        keys: 'Enter',
        description: 'Selecionar item'
      },
      {
        keys: 'Space',
        description: 'Marcar/Desmarcar item'
      },
      {
        keys: '⌘ + A',
        description: 'Selecionar todos'
      }
    ]
  },
  {
    category: 'Formulários',
    shortcuts: [
      {
        keys: 'Tab',
        description: 'Próximo campo'
      },
      {
        keys: 'Shift + Tab',
        description: 'Campo anterior'
      },
      {
        keys: '⌘ + Enter',
        description: 'Salvar formulário'
      },
      {
        keys: 'Esc',
        description: 'Cancelar edição'
      }
    ]
  }
];

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsHelp({ open, onOpenChange }: KeyboardShortcutsHelpProps) {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  const formatKeys = (keys: string) => {
    if (!isMac) {
      return keys.replace(/⌘/g, 'Ctrl');
    }
    return keys;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Atalhos de Teclado
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6">
            {keyboardShortcuts.map((category, index) => (
              <div key={category.category}>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  {category.category === 'Geral' && <Command className="h-4 w-4" />}
                  {category.category === 'Navegação' && <Navigation className="h-4 w-4" />}
                  {category.category === 'Ações Rápidas' && <Zap className="h-4 w-4" />}
                  {category.category}
                </h3>
                
                <div className="space-y-2">
                  {category.shortcuts.map((shortcut, shortcutIndex) => (
                    <div
                      key={shortcutIndex}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {shortcut.icon && (
                          <shortcut.icon className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm">{shortcut.description}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {formatKeys(shortcut.keys).split(' + ').map((key, keyIndex) => (
                          <React.Fragment key={keyIndex}>
                            {keyIndex > 0 && (
                              <span className="text-xs text-muted-foreground mx-1">+</span>
                            )}
                            <Badge variant="outline" className="text-xs font-mono">
                              {key}
                            </Badge>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                {index < keyboardShortcuts.length - 1 && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-center pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Pressione <Badge variant="outline" className="mx-1">⌘ + /</Badge> a qualquer momento para abrir esta ajuda
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
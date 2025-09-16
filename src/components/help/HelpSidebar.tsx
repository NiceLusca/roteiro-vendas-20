import { helpSections } from './helpData';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface HelpSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function HelpSidebar({ activeSection, onSectionChange }: HelpSidebarProps) {
  return (
    <div className="sticky top-24">
      <div className="bg-card rounded-lg border p-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
          Navegação
        </h3>
        
        <nav className="space-y-1">
          {helpSections.map((section) => (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={cn(
                'w-full flex items-start gap-3 px-3 py-2.5 rounded-md text-left transition-colors',
                activeSection === section.id
                  ? 'bg-primary/10 text-primary border-l-2 border-primary'
                  : 'hover:bg-accent text-foreground'
              )}
            >
              <section.icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{section.title}</div>
                <div className="text-xs text-muted-foreground line-clamp-2">
                  {section.description}
                </div>
                {section.items && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {section.items.length} tópicos
                  </Badge>
                )}
              </div>
            </button>
          ))}
        </nav>

        {/* Quick Actions */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="font-medium text-sm mb-3">Ações Rápidas</h4>
          <div className="space-y-2 text-sm">
            <button className="w-full text-left text-muted-foreground hover:text-foreground transition-colors">
              📊 Ver métricas da plataforma
            </button>
            <button className="w-full text-left text-muted-foreground hover:text-foreground transition-colors">
              ⚙️ Configurações rápidas
            </button>
            <button className="w-full text-left text-muted-foreground hover:text-foreground transition-colors">
              💡 Dicas de produtividade
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
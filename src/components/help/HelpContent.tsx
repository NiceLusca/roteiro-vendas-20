import { HelpSection } from './HelpSection';
import { helpSections } from './helpData';
import { HelpFeedback } from './HelpFeedback';
import { Badge } from '@/components/ui/badge';
import { Clock, Users } from 'lucide-react';

interface HelpContentProps {
  activeSection: string;
  searchQuery: string;
}

export function HelpContent({ activeSection, searchQuery }: HelpContentProps) {
  const section = helpSections.find(s => s.id === activeSection);

  if (!section) {
    return (
      <div className="bg-card rounded-lg border p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">Seção não encontrada</h2>
        <p className="text-muted-foreground">
          A seção solicitada não está disponível.
        </p>
      </div>
    );
  }

  // Filter items based on search query
  const filteredItems = searchQuery
    ? section.items?.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : section.items;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <section.icon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-foreground">{section.title}</h1>
              <Badge variant="secondary">{section.difficulty}</Badge>
            </div>
            <p className="text-muted-foreground text-lg mb-4">
              {section.description}
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Tempo estimado: {section.estimatedTime}
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                Para: {section.audience}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Results Info */}
      {searchQuery && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {filteredItems?.length || 0} resultado(s) encontrado(s) para "{searchQuery}"
          </p>
        </div>
      )}

      {/* Content Items */}
      {filteredItems && filteredItems.length > 0 ? (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <HelpSection key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-lg border p-8 text-center">
          <h3 className="text-lg font-semibold mb-2">
            {searchQuery ? 'Nenhum resultado encontrado' : 'Conteúdo em desenvolvimento'}
          </h3>
          <p className="text-muted-foreground">
            {searchQuery
              ? 'Tente ajustar sua busca ou explore outras seções.'
              : 'Esta seção está sendo preparada com conteúdo detalhado.'}
          </p>
        </div>
      )}

      {/* Feedback */}
      <HelpFeedback sectionId={activeSection} />
    </div>
  );
}
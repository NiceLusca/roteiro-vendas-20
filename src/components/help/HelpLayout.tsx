import { useState } from 'react';
import { HelpSidebar } from './HelpSidebar';
import { HelpContent } from './HelpContent';
import { HelpSearch } from './HelpSearch';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function HelpLayout() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Central de Ajuda</h1>
                <p className="text-sm text-muted-foreground">
                  Aprenda a usar a plataforma de forma eficiente
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <HelpSearch onSearch={handleSearch} />
              <Button variant="outline" size="sm" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                Suporte
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <HelpSidebar
              activeSection={activeSection}
              onSectionChange={setActiveSection}
            />
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <HelpContent
              activeSection={activeSection}
              searchQuery={searchQuery}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
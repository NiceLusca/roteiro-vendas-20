import { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface HelpItem {
  id: string;
  title: string;
  description: string;
  content: string;
  type: 'tutorial' | 'guide' | 'reference' | 'video';
  keywords?: string[];
  relatedLinks?: Array<{ title: string; url: string }>;
}

interface HelpSectionProps {
  item: HelpItem;
}

export function HelpSection({ item }: HelpSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const typeColors = {
    tutorial: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    guide: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    reference: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    video: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  };

  const typeIcons = {
    tutorial: '📚',
    guide: '🎯',
    reference: '📖',
    video: '🎥'
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="bg-card rounded-lg border overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 text-left hover:bg-accent/50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg">{typeIcons[item.type]}</span>
                  <h3 className="text-lg font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <Badge className={typeColors[item.type]}>
                    {item.type}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm line-clamp-2">
                  {item.description}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                {item.type === 'video' && (
                  <Button size="sm" variant="outline" className="gap-1">
                    <Play className="h-3 w-3" />
                    Assistir
                  </Button>
                )}
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 border-t border-border">
            <div className="pt-4">
              {/* Content */}
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div 
                  dangerouslySetInnerHTML={{ __html: item.content }}
                  className="text-foreground space-y-3"
                />
              </div>

              {/* Keywords */}
              {item.keywords && item.keywords.length > 0 && (
                <div className="mt-6 pt-4 border-t border-border">
                  <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                    Palavras-chave:
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {item.keywords.map((keyword) => (
                      <Badge key={keyword} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Links */}
              {item.relatedLinks && item.relatedLinks.length > 0 && (
                <div className="mt-6 pt-4 border-t border-border">
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground">
                    Links relacionados:
                  </h4>
                  <div className="space-y-2">
                    {item.relatedLinks.map((link, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        className="justify-start gap-2 h-auto p-2"
                        asChild
                      >
                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3" />
                          {link.title}
                        </a>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
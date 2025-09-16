import { useState, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { helpSections } from './helpData';

interface HelpSearchProps {
  onSearch: (query: string) => void;
}

export function HelpSearch({ onSearch }: HelpSearchProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Flatten all help content for search
  const searchableItems = helpSections.flatMap(section =>
    section.items?.map(item => ({
      id: `${section.id}-${item.id}`,
      title: item.title,
      description: item.description,
      section: section.title,
      sectionId: section.id,
      keywords: item.keywords || []
    })) || []
  );

  const filteredItems = value
    ? searchableItems.filter(item =>
        item.title.toLowerCase().includes(value.toLowerCase()) ||
        item.description.toLowerCase().includes(value.toLowerCase()) ||
        item.keywords.some(keyword => keyword.toLowerCase().includes(value.toLowerCase()))
      )
    : [];

  const handleSearch = (searchValue: string) => {
    setValue(searchValue);
    onSearch(searchValue);
    if (searchValue.length > 2) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  const clearSearch = () => {
    setValue('');
    onSearch('');
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Buscar na ajuda..."
            value={value}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 pr-10 w-80"
          />
          {value && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandList>
            {filteredItems.length === 0 && value.length > 2 && (
              <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            )}
            
            {filteredItems.length > 0 && (
              <CommandGroup heading="Resultados da busca">
                {filteredItems.slice(0, 8).map((item) => (
                  <CommandItem
                    key={item.id}
                    onSelect={() => {
                      setValue('');
                      onSearch(item.title);
                      setOpen(false);
                    }}
                    className="flex flex-col items-start gap-1 p-3"
                  >
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {item.description}
                    </div>
                    <div className="text-xs text-primary">
                      Em: {item.section}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
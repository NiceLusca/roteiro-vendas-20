import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

const checklistItemSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  ordem: z.number().min(1),
  obrigatorio: z.boolean().default(false),
});

type ChecklistItemFormData = z.infer<typeof checklistItemSchema>;

interface ChecklistItemFormProps {
  item?: Partial<ChecklistItemFormData> | null;
  onSave: (data: ChecklistItemFormData) => void;
  onCancel: () => void;
}

export function ChecklistItemForm({ item, onSave, onCancel }: ChecklistItemFormProps) {
  const form = useForm<ChecklistItemFormData>({
    resolver: zodResolver(checklistItemSchema),
    defaultValues: {
      titulo: item?.titulo || '',
      ordem: item?.ordem || 1,
      obrigatorio: item?.obrigatorio || false,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
        <FormField
          control={form.control}
          name="titulo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ex: Validar interesse do lead" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ordem"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ordem *</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  type="number" 
                  min="1"
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="obrigatorio"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Item obrigatório
                </FormLabel>
                <p className="text-sm text-muted-foreground">
                  O lead não poderá avançar sem completar este item
                </p>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Form>
  );
}
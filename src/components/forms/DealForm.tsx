import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useLeadSearch } from '@/hooks/useLeadSearch';
import { useSupabaseProducts } from '@/hooks/useSupabaseProducts';
import { Deal, StatusDeal } from '@/types/crm';

const dealSchema = z.object({
  lead_id: z.string().min(1, 'Lead é obrigatório'),
  produto_id: z.string().min(1, 'Produto é obrigatório'),
  closer: z.string().optional(),
  valor_proposto: z.number().min(0, 'Valor deve ser positivo'),
  status: z.enum(['Aberta', 'Ganha', 'Perdida', 'Pausada'] as const),
});

type DealFormData = z.infer<typeof dealSchema>;

interface DealFormProps {
  initialData?: Partial<Deal>;
  onSave: (data: DealFormData) => void;
  onCancel: () => void;
}

export function DealForm({ initialData, onSave, onCancel }: DealFormProps) {
  const [leadSearch, setLeadSearch] = useState('');
  const { data: leads = [] } = useLeadSearch({ searchTerm: leadSearch, limit: 20 });
  const { products } = useSupabaseProducts();

  const form = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      lead_id: initialData?.lead_id || '',
      produto_id: initialData?.produto_id || '',
      closer: initialData?.closer || '',
      valor_proposto: initialData?.valor_proposto || 0,
      status: initialData?.status || 'Aberta',
    },
  });

  const onSubmit = (data: DealFormData) => {
    onSave(data);
  };

  const statusOptions: { value: StatusDeal; label: string }[] = [
    { value: 'Aberta', label: 'Aberta' },
    { value: 'Ganha', label: 'Ganha' },
    { value: 'Perdida', label: 'Perdida' },
    { value: 'Pausada', label: 'Pausada' },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="lead_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lead *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um lead" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {leads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.nome} - {lead.whatsapp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

          <FormField
            control={form.control}
            name="produto_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Produto *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {products.filter(p => p.ativo).map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.nome}{product.preco ? ` - R$ ${product.preco.toFixed(2)}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="closer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Closer *</FormLabel>
              <FormControl>
                <Input placeholder="Nome do closer responsável" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="valor_proposto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor Proposto (R$) *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field}) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            Salvar
          </Button>
        </div>
      </form>
    </Form>
  );
}

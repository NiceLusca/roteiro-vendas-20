import { useState, useCallback } from 'react';
import { Lead, Appointment, Interaction, Deal, Order } from '@/types/crm';
import { mockLeads, mockAppointments, mockDeals } from '@/data/mockData';
import { useAudit } from '@/contexts/AuditContext';
import { useToast } from '@/hooks/use-toast';

// Hook for managing lead data operations
export function useLeadData() {
  const { logChange } = useAudit();
  const { toast } = useToast();

  const saveLead = useCallback((leadData: Partial<Lead> & { id?: string }) => {
    if (leadData.id) {
      // Update existing lead
      const existingLead = mockLeads.find(l => l.id === leadData.id);
      if (existingLead) {
        const changes = Object.keys(leadData).reduce((acc, key) => {
          const field = key as keyof Lead;
          if (leadData[field] !== existingLead[field]) {
            acc.push({
              campo: key,
              de: existingLead[field],
              para: leadData[field]
            });
          }
          return acc;
        }, [] as Array<{ campo: string; de: any; para: any }>);

        if (changes.length > 0) {
          logChange({
            entidade: 'Lead',
            entidade_id: leadData.id,
            alteracao: changes
          });
        }
      }
      
      toast({
        title: 'Lead atualizado',
        description: 'As informações do lead foram salvas com sucesso.',
      });
    } else {
      // Create new lead
      const newId = `lead-${Date.now()}`;
      
      logChange({
        entidade: 'Lead',
        entidade_id: newId,
        alteracao: [
          { campo: 'status', de: null, para: 'Criado' }
        ]
      });
      
      toast({
        title: 'Lead criado',
        description: 'Novo lead foi criado com sucesso.',
      });
    }
    
    // TODO: Implement actual data persistence
    console.log('Lead saved:', leadData);
  }, [logChange, toast]);

  const saveAppointment = useCallback((appointmentData: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>) => {
    const newId = `apt-${Date.now()}`;
    
    logChange({
      entidade: 'Appointment',
      entidade_id: newId,
      alteracao: [
        { campo: 'status', de: null, para: appointmentData.status },
        { campo: 'lead_id', de: null, para: appointmentData.lead_id }
      ]
    });

    // TODO: Implement actual data persistence
    console.log('Appointment saved:', { ...appointmentData, id: newId });
  }, [logChange]);

  const saveInteraction = useCallback((interactionData: Omit<Interaction, 'id' | 'timestamp'>) => {
    const newId = `int-${Date.now()}`;
    
    logChange({
      entidade: 'Interaction',
      entidade_id: newId,
      alteracao: [
        { campo: 'canal', de: null, para: interactionData.canal },
        { campo: 'lead_id', de: null, para: interactionData.lead_id }
      ]
    });

    // TODO: Implement actual data persistence  
    console.log('Interaction saved:', { ...interactionData, id: newId });
  }, [logChange]);

  const saveDeal = useCallback((dealData: Partial<Deal> & { id?: string }) => {
    if (dealData.id) {
      // Update existing deal
      const existingDeal = mockDeals.find(d => d.id === dealData.id);
      if (existingDeal) {
        const changes = Object.keys(dealData).reduce((acc, key) => {
          const field = key as keyof Deal;
          if (dealData[field] !== existingDeal[field]) {
            acc.push({
              campo: key,
              de: existingDeal[field],
              para: dealData[field]
            });
          }
          return acc;
        }, [] as Array<{ campo: string; de: any; para: any }>);

        if (changes.length > 0) {
          logChange({
            entidade: 'Deal',
            entidade_id: dealData.id,
            alteracao: changes
          });
        }
      }
    } else {
      // Create new deal
      const newId = `deal-${Date.now()}`;
      
      logChange({
        entidade: 'Deal',
        entidade_id: newId,
        alteracao: [
          { campo: 'status', de: null, para: dealData.status || 'Aberta' }
        ]
      });
    }

    // TODO: Implement actual data persistence
    console.log('Deal saved:', dealData);
  }, [logChange]);

  const saveOrder = useCallback((orderData: Partial<Order> & { id?: string }) => {
    if (orderData.id) {
      // Update existing order
      logChange({
        entidade: 'Order',
        entidade_id: orderData.id,
        alteracao: [
          { campo: 'status', de: 'anterior', para: orderData.status || 'atualizado' }
        ]
      });
    } else {
      // Create new order
      const newId = `order-${Date.now()}`;
      
      logChange({
        entidade: 'Order',
        entidade_id: newId,
        alteracao: [
          { campo: 'status', de: null, para: orderData.status || 'Ativo' }
        ]
      });
    }

    // TODO: Implement actual data persistence
    console.log('Order saved:', orderData);
  }, [logChange]);

  return {
    saveLead,
    saveAppointment,
    saveInteraction,
    saveDeal,
    saveOrder
  };
}
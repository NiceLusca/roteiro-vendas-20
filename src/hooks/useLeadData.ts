import { useState, useCallback } from 'react';
import { Lead, Appointment, Interaction, Deal, Order } from '@/types/crm';
import { useSupabaseLeads } from '@/hooks/useSupabaseLeads';
import { useSupabaseAppointments } from '@/hooks/useSupabaseAppointments';
import { useSupabaseDeals } from '@/hooks/useSupabaseDeals';
import { useSupabaseOrders } from '@/hooks/useSupabaseOrders';
import { useSupabaseInteractions } from '@/hooks/useSupabaseInteractions';
import { useAudit } from '@/contexts/AuditContext';
import { useToast } from '@/hooks/use-toast';

// Hook for managing lead data operations
export function useLeadData() {
  const { logChange } = useAudit();
  const { saveLead: saveLeadToSupabase } = useSupabaseLeads();
  const { saveAppointment: saveAppointmentToSupabase } = useSupabaseAppointments();
  const { saveDeal: saveDealToSupabase } = useSupabaseDeals();
  const { saveOrder: saveOrderToSupabase } = useSupabaseOrders();
  const { saveInteraction: saveInteractionToSupabase } = useSupabaseInteractions();
  const { toast } = useToast();

  const saveLead = useCallback(async (leadData: Partial<Lead> & { id?: string }) => {
    const result = await saveLeadToSupabase(leadData);
    if (result) {
      if (leadData.id) {
        logChange({
          entidade: 'Lead',
          entidade_id: leadData.id,
          alteracao: [{ campo: 'status', de: 'anterior', para: 'atualizado' }]
        });
      } else {
        logChange({
          entidade: 'Lead',
          entidade_id: result.id,
          alteracao: [{ campo: 'status', de: null, para: 'Criado' }]
        });
      }
    }
    return result; // Return the created/updated lead
  }, [saveLeadToSupabase, logChange]);

  const saveAppointment = useCallback(async (appointmentData: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>) => {
    const result = await saveAppointmentToSupabase(appointmentData as any);
    if (result) {
      logChange({
        entidade: 'Appointment',
        entidade_id: result.id,
        alteracao: [
          { campo: 'status', de: null, para: appointmentData.status },
          { campo: 'lead_id', de: null, para: appointmentData.lead_id }
        ]
      });
    }
  }, [saveAppointmentToSupabase, logChange]);

  const saveInteraction = useCallback(async (interactionData: Omit<Interaction, 'id' | 'timestamp'>) => {
    const result = await saveInteractionToSupabase(interactionData);
    if (result) {
      logChange({
        entidade: 'Interaction',
        entidade_id: result.id,
        alteracao: [
          { campo: 'canal', de: null, para: interactionData.canal },
          { campo: 'lead_id', de: null, para: interactionData.lead_id }
        ]
      });
    }
  }, [saveInteractionToSupabase, logChange]);

  const saveDeal = useCallback(async (dealData: Partial<Deal> & { id?: string }) => {
    // Convert Date fields to strings if needed
    const convertedData = {
      ...dealData,
      created_at: dealData.created_at instanceof Date ? dealData.created_at.toISOString() : dealData.created_at,
      updated_at: dealData.updated_at instanceof Date ? dealData.updated_at.toISOString() : dealData.updated_at
    };
    
    const result = await saveDealToSupabase(convertedData as any);
    if (result) {
      logChange({
        entidade: 'Deal',
        entidade_id: result.id,
        alteracao: [
          { campo: 'status', de: 'anterior', para: dealData.status || 'aberto' }
        ]
      });
    }
  }, [saveDealToSupabase, logChange]);

  const saveOrder = useCallback(async (orderData: Partial<Order> & { id?: string }) => {
    // Convert Date fields to strings if needed - only handle existing properties
    const convertedData = {
      ...orderData,
      data_venda: orderData.data_venda instanceof Date ? orderData.data_venda.toISOString() : orderData.data_venda
    };
    
    const result = await saveOrderToSupabase(convertedData as any);
    if (result) {
      logChange({
        entidade: 'Order',
        entidade_id: result.id,
        alteracao: [
          { campo: 'status_pagamento', de: 'anterior', para: orderData.status_pagamento || 'pendente' }
        ]
      });
    }
  }, [saveOrderToSupabase, logChange]);

  return {
    saveLead,
    saveAppointment,
    saveInteraction,
    saveDeal,
    saveOrder
  };
}
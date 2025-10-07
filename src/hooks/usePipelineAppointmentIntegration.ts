import { useToast } from '@/hooks/use-toast';

export function usePipelineAppointmentIntegration() {
  const { toast } = useToast();

  const createAppointmentForStage = async (leadId: string, stageId: string) => {
    return null;
  };

  const createAutomaticAppointment = async (leadId: string, stageId: string) => {
    return null;
  };

  return {
    createAppointmentForStage,
    createAutomaticAppointment
  };
}

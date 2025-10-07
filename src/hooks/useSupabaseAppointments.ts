import { useState } from 'react';

export function useSupabaseAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  const saveAppointment = async () => null;
  const cancelAppointment = async () => {};
  const getAppointmentById = () => null;
  const getUpcomingAppointments = () => [];
  const refetch = async () => {};

  return {
    appointments,
    loading,
    saveAppointment,
    cancelAppointment,
    getAppointmentById,
    getUpcomingAppointments,
    refetch
  };
}

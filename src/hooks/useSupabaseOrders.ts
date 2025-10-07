import { useState } from 'react';

export function useSupabaseOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const saveOrder = async () => null;
  const refetch = async () => {};

  return {
    orders,
    loading,
    saveOrder,
    refetch
  };
}

import { useState } from 'react';

export function useSupabaseChecklistItems(stageId?: string) {
  const [checklistItems, setChecklistItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const saveItem = async () => null;
  const deleteItem = async () => {};
  const refetch = async () => {};

  return {
    checklistItems,
    loading,
    saveItem,
    deleteItem,
    refetch
  };
}

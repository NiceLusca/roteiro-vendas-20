import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UseRealtimeSubscriptionOptions {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
}

export function useRealtimeSubscription({
  table,
  event = '*',
  filter,
  onInsert,
  onUpdate,
  onDelete,
}: UseRealtimeSubscriptionOptions) {
  const { user } = useAuth();

  const handleChange = useCallback((payload: any) => {
    switch (payload.eventType) {
      case 'INSERT':
        onInsert?.(payload);
        break;
      case 'UPDATE':
        onUpdate?.(payload);
        break;
      case 'DELETE':
        onDelete?.(payload);
        break;
    }
  }, [onInsert, onUpdate, onDelete]);

  useEffect(() => {
    if (!user) return;

    const channelName = `realtime-${table}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as any,
        {
          event,
          schema: 'public',
          table,
          ...(filter && { filter })
        },
        handleChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, table, event, filter, handleChange]);
}

// Hook for real-time user presence
export function useUserPresence(roomId: string) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !roomId) return;

    const channel = supabase.channel(`room_${roomId}`);

    const userStatus = {
      user_id: user.id,
      user_email: user.email,
      online_at: new Date().toISOString(),
    };

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        // Handle sync event
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // Handle user join
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // Handle user leave
      })
      .subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') return;
        await channel.track(userStatus);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, roomId]);
}
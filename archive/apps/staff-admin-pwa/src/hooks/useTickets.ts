import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi, TicketsListParams } from '@/api/tickets';
import { TicketCommentCreate, TicketStatusUpdate } from '@/types/ticket';
import { addToOfflineQueue } from '@/lib/storage';

export const useTickets = (params: TicketsListParams = {}) => {
  return useQuery({
    queryKey: ['tickets', params],
    queryFn: () => ticketsApi.list(params),
    staleTime: 30000,
  });
};

export const useTicket = (id: string) => {
  return useQuery({
    queryKey: ['tickets', id],
    queryFn: () => ticketsApi.get(id),
    enabled: !!id,
  });
};

export const useAddTicketComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment: TicketCommentCreate }) => {
      try {
        return await ticketsApi.addComment(id, comment);
      } catch (error) {
        if (!navigator.onLine) {
          await addToOfflineQueue({
            url: `/tickets/${id}/comments`,
            method: 'POST',
            data: comment,
            headers: { 'Content-Type': 'application/json' },
            timestamp: Date.now(),
          });
          throw new Error('Added to offline queue');
        }
        throw error;
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tickets', variables.id] });
    },
  });
};

export const useUpdateTicketStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, update }: { id: string; update: TicketStatusUpdate }) => {
      try {
        return await ticketsApi.updateStatus(id, update);
      } catch (error) {
        if (!navigator.onLine) {
          await addToOfflineQueue({
            url: `/tickets/${id}/status`,
            method: 'PATCH',
            data: update,
            headers: { 'Content-Type': 'application/json' },
            timestamp: Date.now(),
          });
          throw new Error('Added to offline queue');
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.setQueryData(['tickets', data.id], data);
    },
  });
};

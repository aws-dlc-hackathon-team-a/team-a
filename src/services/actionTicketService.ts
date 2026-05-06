import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { FrontendErrorHandler } from '../lib/errorHandler';

interface ActionTicket {
  id: string;
  action: string;
  goalType: 'primary' | 'pivot';
  actionLevel: 'normal' | 'minimal';
  status: 'open' | 'done';
  createdAt: string;
}

// Ticket一覧取得
export const useActionTickets = (userId: string, status?: 'open' | 'done') => {
  return useQuery({
    queryKey: ['actionTickets', userId, status],
    queryFn: async () => {
      try {
        const params = status ? `?status=${status}` : '';
        return await apiClient.get<ActionTicket[]>(`/tickets/${userId}${params}`);
      } catch (error) {
        const apiError = FrontendErrorHandler.handleError(error);
        throw new Error(apiError.message);
      }
    },
    enabled: !!userId,
  });
};

// Ticket Done申告
export const useMarkTicketDone = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticketId: string) => {
      try {
        return await apiClient.patch(`/tickets/${userId}/${ticketId}/done`);
      } catch (error) {
        const apiError = FrontendErrorHandler.handleError(error);
        throw new Error(apiError.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actionTickets', userId] });
      queryClient.invalidateQueries({ queryKey: ['effortPoints', userId] });
    },
  });
};

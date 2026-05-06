import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { FrontendErrorHandler } from '../lib/errorHandler';

interface Goal {
  id: string;
  title: string;
  description: string;
  isPrimary: boolean;
  priority: number;
}

// Goal一覧取得
export const useGoals = (userId: string) => {
  return useQuery({
    queryKey: ['goals', userId],
    queryFn: async () => {
      try {
        return await apiClient.get<Goal[]>(`/users/${userId}/goals`);
      } catch (error) {
        const apiError = FrontendErrorHandler.handleError(error);
        throw new Error(apiError.message);
      }
    },
    enabled: !!userId,
  });
};

// Goal追加
export const useAddGoal = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goal: Omit<Goal, 'id'>) => {
      try {
        return await apiClient.post<Goal>(`/users/${userId}/goals`, goal);
      } catch (error) {
        const apiError = FrontendErrorHandler.handleError(error);
        throw new Error(apiError.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', userId] });
    },
  });
};

// Goal更新
export const useUpdateGoal = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ goalId, updates }: { goalId: string; updates: Partial<Goal> }) => {
      try {
        return await apiClient.put<Goal>(`/users/${userId}/goals/${goalId}`, updates);
      } catch (error) {
        const apiError = FrontendErrorHandler.handleError(error);
        throw new Error(apiError.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', userId] });
    },
  });
};

// Goal削除
export const useDeleteGoal = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goalId: string) => {
      try {
        return await apiClient.delete(`/users/${userId}/goals/${goalId}`);
      } catch (error) {
        const apiError = FrontendErrorHandler.handleError(error);
        throw new Error(apiError.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', userId] });
    },
  });
};

// Primary Goal設定
export const useSetPrimaryGoal = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goalId: string) => {
      try {
        return await apiClient.patch<Goal>(`/users/${userId}/goals/${goalId}/primary`);
      } catch (error) {
        const apiError = FrontendErrorHandler.handleError(error);
        throw new Error(apiError.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', userId] });
    },
  });
};

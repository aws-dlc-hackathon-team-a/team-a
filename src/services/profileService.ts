import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { FrontendErrorHandler } from '../lib/errorHandler';

interface Profile {
  nickname: string;
  age: number;
  occupation: string;
  interests: string[];
  lifeRhythm: 'morning' | 'night';
  concerns: string;
}

interface ProfileUpdateHistory {
  id: string;
  updatedAt: string;
  changes: Partial<Profile>;
}

// Profile取得
export const useProfile = (userId: string) => {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      try {
        return await apiClient.get<Profile>(`/users/${userId}/profiles`);
      } catch (error) {
        const apiError = FrontendErrorHandler.handleError(error);
        throw new Error(apiError.message);
      }
    },
    enabled: !!userId,
  });
};

// Profile更新
export const useUpdateProfile = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      try {
        return await apiClient.put<Profile>(`/users/${userId}/profiles`, updates);
      } catch (error) {
        const apiError = FrontendErrorHandler.handleError(error);
        throw new Error(apiError.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },
  });
};

// Profile更新履歴取得
export const useProfileHistory = (userId: string) => {
  return useQuery({
    queryKey: ['profileHistory', userId],
    queryFn: async () => {
      try {
        return await apiClient.get<ProfileUpdateHistory[]>(`/users/${userId}/profiles/history`);
      } catch (error) {
        const apiError = FrontendErrorHandler.handleError(error);
        throw new Error(apiError.message);
      }
    },
    enabled: !!userId,
  });
};

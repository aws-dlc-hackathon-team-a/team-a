import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { FrontendErrorHandler } from '../lib/errorHandler';

interface EffortPointRecord {
  date: string;
  points: number;
}

interface EffortPointSummary {
  totalPoints: number;
  weeklyPoints: EffortPointRecord[];
  monthlyPoints: EffortPointRecord[];
}

// Effort Point取得
export const useEffortPoints = (userId: string) => {
  return useQuery({
    queryKey: ['effortPoints', userId],
    queryFn: async () => {
      try {
        return await apiClient.get<EffortPointSummary>(`/effort-points/${userId}`);
      } catch (error) {
        const apiError = FrontendErrorHandler.handleError(error);
        throw new Error(apiError.message);
      }
    },
    enabled: !!userId,
  });
};

// 週間Effort Point取得
export const useWeeklyEffortPoints = (userId: string) => {
  return useQuery({
    queryKey: ['weeklyEffortPoints', userId],
    queryFn: async () => {
      try {
        return await apiClient.get<EffortPointRecord[]>(`/effort-points/${userId}/weekly`);
      } catch (error) {
        const apiError = FrontendErrorHandler.handleError(error);
        throw new Error(apiError.message);
      }
    },
    enabled: !!userId,
  });
};

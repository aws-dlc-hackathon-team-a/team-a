import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { FrontendErrorHandler } from '../lib/errorHandler';

interface RecommendationRequest {
  triggerType: 'manual' | 'auto';
  currentMood?: string;
}

interface RecommendationResponse {
  recommendationId: string;
  message: string;
  options: {
    id: string;
    text: string;
    type: 'yes' | 'no' | 'pivot' | 'minimal';
  }[];
}

interface RecommendationAnswerRequest {
  recommendationId: string;
  selectedOptionId: string;
}

// Recommendation生成
export const useGenerateRecommendation = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: RecommendationRequest) => {
      try {
        return await apiClient.post<RecommendationResponse>(
          `/recommendations/${userId}`,
          request
        );
      } catch (error) {
        const apiError = FrontendErrorHandler.handleError(error);
        throw new Error(apiError.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actionTickets', userId] });
    },
  });
};

// Recommendation応答
export const useAnswerRecommendation = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (answer: RecommendationAnswerRequest) => {
      try {
        return await apiClient.post(
          `/recommendations/${userId}/${answer.recommendationId}/answer`,
          { selectedOptionId: answer.selectedOptionId }
        );
      } catch (error) {
        const apiError = FrontendErrorHandler.handleError(error);
        throw new Error(apiError.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actionTickets', userId] });
    },
  });
};

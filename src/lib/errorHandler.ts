import { AxiosError } from 'axios';

export interface APIError {
  message: string;
  code?: string;
  statusCode?: number;
}

// フォールバックメッセージストア
const FALLBACK_MESSAGES = {
  BEDROCK_TIMEOUT: 'AIの応答に時間がかかっています。もう一度お試しください。',
  NETWORK_ERROR: 'ネットワークエラーが発生しました。接続を確認してください。',
  SERVER_ERROR: 'サーバーエラーが発生しました。しばらくしてからお試しください。',
  UNAUTHORIZED: '認証エラーが発生しました。再度ログインしてください。',
  NOT_FOUND: '要求されたリソースが見つかりませんでした。',
  VALIDATION_ERROR: '入力内容に誤りがあります。確認してください。',
  UNKNOWN_ERROR: '予期しないエラーが発生しました。',
};

export class FrontendErrorHandler {
  static handleError(error: unknown): APIError {
    if (error instanceof AxiosError) {
      return this.handleAxiosError(error);
    }

    if (error instanceof Error) {
      return {
        message: error.message || FALLBACK_MESSAGES.UNKNOWN_ERROR,
      };
    }

    return {
      message: FALLBACK_MESSAGES.UNKNOWN_ERROR,
    };
  }

  private static handleAxiosError(error: AxiosError): APIError {
    const statusCode = error.response?.status;
    const errorData = error.response?.data as any;

    // ネットワークエラー
    if (!error.response) {
      return {
        message: FALLBACK_MESSAGES.NETWORK_ERROR,
        code: 'NETWORK_ERROR',
      };
    }

    // ステータスコード別処理
    switch (statusCode) {
      case 401:
        return {
          message: FALLBACK_MESSAGES.UNAUTHORIZED,
          code: 'UNAUTHORIZED',
          statusCode,
        };

      case 404:
        return {
          message: FALLBACK_MESSAGES.NOT_FOUND,
          code: 'NOT_FOUND',
          statusCode,
        };

      case 400:
        return {
          message: errorData?.message || FALLBACK_MESSAGES.VALIDATION_ERROR,
          code: 'VALIDATION_ERROR',
          statusCode,
        };

      case 408:
      case 504:
        // Bedrockタイムアウト
        return {
          message: FALLBACK_MESSAGES.BEDROCK_TIMEOUT,
          code: 'BEDROCK_TIMEOUT',
          statusCode,
        };

      case 500:
      case 502:
      case 503:
        return {
          message: FALLBACK_MESSAGES.SERVER_ERROR,
          code: 'SERVER_ERROR',
          statusCode,
        };

      default:
        return {
          message: errorData?.message || FALLBACK_MESSAGES.UNKNOWN_ERROR,
          code: 'UNKNOWN_ERROR',
          statusCode,
        };
    }
  }

  static getFallbackMessage(code: keyof typeof FALLBACK_MESSAGES): string {
    return FALLBACK_MESSAGES[code];
  }
}

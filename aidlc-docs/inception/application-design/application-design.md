# アプリケーション設計 — だが、それでいい（DagaSoreDeIi_App）

## 設計方針サマリー

| 項目                   | 決定内容                                                                     |
| ---------------------- | ---------------------------------------------------------------------------- |
| **状態管理**           | Zustand（軽量・シンプル）                                                    |
| **Lambda分割**         | 機能ドメイン単位 + アクセスリソース単位が同じものは統合（ProfileGoalLambda） |
| **画面遷移**           | Bottom Tab Navigator + Stack Navigator                                       |
| **Bedrock連携**        | 各Lambdaから直接呼び出し（AWS SDK v3）                                       |
| **DynamoDBテーブル**   | ドメイン単位3テーブル（UserDB / ActionLogDB / SimilarUserDB）                |
| **Cognito認証**        | AWS Amplify Auth                                                             |
| **エラーハンドリング** | 共通ErrorHandler + フォールバックメッセージストア                            |
| **通知コンポーネント** | v1は作成しない（v2で新規追加）                                               |
| **Learning Engine**    | 独立したLambda（週次バッチ: EventBridge毎週月曜0時）                         |
| **APIクライアント**    | React Query（TanStack Query）+ axios                                         |

---

## システムアーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────────┐
│                    Mobile App (React Native)                     │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  Auth    │  │  Home    │  │ Ticket   │  │ Profile  │       │
│  │  Screens │  │  Screen  │  │ Screens  │  │ Screens  │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │              │              │              │             │
│  ┌────▼──────────────▼──────────────▼──────────────▼─────────┐  │
│  │              Service Layer (React Query Hooks)             │  │
│  │  useAuthService / useProfileService / useGoalService       │  │
│  │  useTriggerService / useRecommendationService              │  │
│  │  useActionTicketService / useEffortPointService            │  │
│  └────────────────────────┬──────────────────────────────────┘  │
│                           │                                      │
│  ┌────────────────────────▼──────────────────────────────────┐  │
│  │  ZustandStore  │  APIClient (axios+RQ)  │  AuthService    │  │
│  └────────────────────────┬──────────────────────────────────┘  │
└───────────────────────────┼─────────────────────────────────────┘
                            │ HTTPS / REST
┌───────────────────────────▼─────────────────────────────────────┐
│                      API Gateway (AWS)                           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                   Backend Lambda Functions                       │
│                                                                  │
│  ┌─────────────┐  ┌──────────────────┐  ┌────────────────────┐  │
│  │ AuthLambda  │  │ ProfileGoalLambda│  │ActionTicketLambda  │  │
│  └─────────────┘  └──────────────────┘  └────────────────────┘  │
│  ┌──────────────────────┐  ┌────────────────┐                   │
│  │ RecommendationLambda │  │EffortPointLambda│                  │
│  └──────────────────────┘  └────────────────┘                   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  LearningEngineLambda（週次バッチ: EventBridge）          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  BackendErrorHandler（共通ミドルウェア）                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────┬──────────────────────────────────┬───────────────────┘
           │                                  │
┌──────────▼──────────┐          ┌────────────▼──────────────────┐
│     DynamoDB        │          │       Amazon Bedrock           │
│  ┌───────────────┐  │          │  Recommendation生成            │
│  │    UserDB     │  │          │  Persona_Message生成           │
│  ├───────────────┤  │          │  プロフィールAIサジェスト       │
│  │  ActionLogDB  │  │          │  行動モデル構築                │
│  ├───────────────┤  │          └───────────────────────────────┘
│  │ SimilarUserDB │  │
│  └───────────────┘  │          ┌───────────────────────────────┐
└─────────────────────┘          │    AWS Cognito User Pool       │
                                 │  （Amplify Auth経由）          │
                                 └───────────────────────────────┘
```

---

## コンポーネント構成（詳細は各ドキュメント参照）

### Frontend（React Native）

| コンポーネント        | 役割                               | 参照                |
| --------------------- | ---------------------------------- | ------------------- |
| NavigationComponent   | 画面遷移管理（Bottom Tab + Stack） | components.md #1.1  |
| AuthScreens           | 認証画面群                         | components.md #1.2  |
| OnboardingScreens     | プロフィール登録画面群             | components.md #1.3  |
| HomeScreen            | ホーム画面                         | components.md #1.4  |
| RecommendationScreens | Recommendation・Pivot画面群        | components.md #1.5  |
| ActionTicketScreens   | チケット管理画面群                 | components.md #1.6  |
| ProfileScreens        | プロフィール・Goal管理画面群       | components.md #1.7  |
| StatsScreens          | 統計・グラフ画面群                 | components.md #1.8  |
| ZustandStore          | グローバル状態管理                 | components.md #1.9  |
| APIClient             | HTTP通信（React Query + axios）    | components.md #1.10 |
| AuthService（FE）     | Amplify Auth ラッパー              | components.md #1.11 |
| FrontendErrorHandler  | エラー・フォールバック処理         | components.md #1.12 |

### Backend（AWS Lambda）

| コンポーネント       | 役割                              | 参照               |
| -------------------- | --------------------------------- | ------------------ |
| AuthLambda           | アカウント削除                    | components.md #2.1 |
| ProfileGoalLambda    | Profile・Goal CRUD + AIサジェスト | components.md #2.2 |
| ActionTicketLambda   | Ticket管理・自動破棄              | components.md #2.3 |
| RecommendationLambda | Recommendation・Pivot生成         | components.md #2.4 |
| EffortPointLambda    | Effort_Point計算・集計            | components.md #2.5 |
| LearningEngineLambda | 週次バッチ・行動モデル構築        | components.md #2.6 |
| BackendErrorHandler  | 共通エラーハンドリング            | components.md #2.7 |

### データストア・外部サービス

| コンポーネント       | 役割                             | 参照               |
| -------------------- | -------------------------------- | ------------------ |
| UserDB               | ユーザー関連データ永続化         | components.md #3.1 |
| ActionLogDB          | 行動ログ永続化                   | components.md #3.2 |
| SimilarUserDB        | 類似ユーザーデータ（v1: モック） | components.md #3.3 |
| CognitoUserPool      | 認証・セッション管理             | components.md #4.1 |
| BedrockClient        | LLM API                          | components.md #4.2 |
| EventBridgeScheduler | 定期実行トリガー                 | components.md #4.3 |

---

## サービス層（詳細は services.md 参照）

| サービス                 | 主な責務                          |
| ------------------------ | --------------------------------- |
| useAuthService           | 認証フローオーケストレーション    |
| useProfileService        | プロフィール取得・更新            |
| useGoalService           | Goal管理                          |
| useTriggerService        | Trigger発火・自動Trigger判定      |
| useRecommendationService | Recommendation・Pivot・ActionStep |
| useActionTicketService   | Ticket操作・Done申告              |
| useEffortPointService    | ポイント取得・集計                |

---

## 主要フロー（詳細は component-dependency.md 参照）

1. **アプリ起動フロー**: 認証確認 → プロフィール確認 → Open Ticket確認 → 自動Trigger or ホーム
2. **Recommendationフロー**: Trigger発火 → Bedrock生成 → 4択応答 → Pivot or ActionStep → Ticket生成
3. **Done申告フロー**: Ticket Done → Action_Log記録（リアルタイム）→ Effort_Point付与 → Persona_Message表示
4. **週次バッチフロー**: EventBridge → LearningEngine → 行動モデル更新 → Profile更新 → Future_Self_Model更新

---

## 設計上の重要な決定事項

### Learning Engineは週次バッチ

Action_Logへの書き込みはリアルタイムだが、行動モデルの構築・Profile更新・Future_Self_Model更新は週次バッチ（毎週月曜0時）で処理する。Recommendationは直近バッチで構築済みのモデルを参照する。

### ProfileGoalLambdaの統合

ProfileとGoalはアクセスリソース単位が近く（同じUserDBを参照）、オンボーディングフローで連続して使用されるため1つのLambdaに統合する。

### Bedrockは各Lambdaから直接呼び出し

専用BedrockServiceを作らず、各Lambda（ProfileGoalLambda・RecommendationLambda・LearningEngineLambda）から直接AWS SDK v3でBedrockを呼び出す。共通処理はBackendErrorHandlerのBedrockエラーハンドリングで対応する。

### v1はNotificationコンポーネントなし

アプリ内表示のみのv1ではNotificationコンポーネントを作成しない。v2でプッシュ通知対応時に新規追加する。

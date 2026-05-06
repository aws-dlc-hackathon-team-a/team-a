# アプリケーション設計 — だが、それでいい（DagaSoreDeIi_App）

## 目次

- [設計方針サマリー](#設計方針サマリー)
- [ドメイン構成](#ドメイン構成)
- [システムアーキテクチャ概要](#システムアーキテクチャ概要)
- [コンポーネント構成](#コンポーネント構成)
- [サービス層](#サービス層)
- [主要フロー](#主要フロー)
- [Lambda間依存関係](#lambda間依存関係)
- [設計上の重要な決定事項](#設計上の重要な決定事項)

---

## 設計方針サマリー

| 項目                   | 決定内容                                                              |
| ---------------------- | --------------------------------------------------------------------- |
| **状態管理**           | Zustand（軽量・シンプル）                                             |
| **Lambda分割**         | 機能ドメイン単位 + アクセスリソース単位が同じものは統合（UserLambda） |
| **画面遷移**           | Bottom Tab Navigator + Stack Navigator                                |
| **Bedrock連携**        | 各Lambdaから直接呼び出し（AWS SDK v3）                                |
| **DynamoDBテーブル**   | ドメイン単位3テーブル（UserDB / ActionLogDB / SimilarUserDB）         |
| **Cognito認証**        | AWS Amplify Auth                                                      |
| **エラーハンドリング** | 共通ErrorHandler + フォールバックメッセージストア                     |
| **通知コンポーネント** | v1は作成しない（v2で新規追加）                                        |
| **Learning Engine**    | 独立したLambda（週次バッチ: EventBridge毎週月曜0時）                  |
| **APIクライアント**    | React Query（TanStack Query）+ axios                                  |

---

## ドメイン構成

本システムは以下の5ドメインで構成する。

| ドメイン           | 責務                                                          | 主なLambda / コンポーネント                                          |
| ------------------ | ------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Account**        | 認証・アカウント管理（登録・ログイン・削除）                  | AccountLambda、CognitoUserPool                                       |
| **User**           | プロフィール・Goal管理、AIサジェスト                          | UserLambda、UserDB                                                   |
| **ActionTicket**   | チケット生成・完了申告・自動破棄                              | ActionTicketLambda、ActionLogDB                                      |
| **Recommendation** | Trigger発火・Recommendation生成・Pivot・ActionStep            | RecommendationLambda、BedrockClient                                  |
| **EffortPoint**    | ポイント付与（Done申告時）・日次集計バッチ・集計データ取得API | ActionTicketLambda、DailyAggregationLambda、StatsLambda、ActionLogDB |
| **LearningEngine** | 週次バッチ・行動モデル構築・Future_Self_Model更新             | LearningEngineLambda、BedrockClient、UserDB                          |

---

## システムアーキテクチャ概要

```
┌──────────────────────────────────────────────────────────────────────┐
│                      Mobile App (React Native)                        │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  Screen Layer                                                   │ │
│  │  AuthScreens / OnboardingScreens / HomeScreen                   │ │
│  │  RecommendationScreens / ActionTicketScreens                    │ │
│  │  ProfileScreens / StatsScreens                                  │ │
│  └──────────────────────────────┬──────────────────────────────────┘ │
│                                 │                                     │
│  ┌──────────────────────────────▼──────────────────────────────────┐ │
│  │              Service Layer (React Query Hooks)                  │ │
│  │  useAuthService / useProfileService / useGoalService            │ │
│  │  useTriggerService / useRecommendationService                   │ │
│  │  useActionTicketService / useEffortPointService                 │ │
│  └────────────────────────┬────────────────────────────────────────┘ │
│                           │                                           │
│  ┌────────────────────────▼────────────────────────────────────────┐ │
│  │  Zustand Stores  │  APIClient (axios+RQ)  │  AuthService        │ │
│  └──────────┬─────────────────────┬──────────────────┬────────────┘ │
└─────────────┼─────────────────────┼──────────────────┼──────────────┘
              │ HTTPS / REST        │                  │ Amplify Auth
              ▼                     │                  ▼
┌─────────────────────────┐         │    ┌─────────────────────────────┐
│   API Gateway (AWS)     │         │    │   AWS Cognito User Pool      │
└────────────┬────────────┘         │    │   （サインアップ・サインイン  │
             │                      │    │    パスワードリセット）       │
             ▼                      │    └─────────────────────────────┘
┌────────────────────────────────────────────────────────────────────┐
│                     Backend Lambda Functions                        │
│                                                                     │
│  ┌───────────────┐  ┌─────────────┐  ┌────────────────────┐       │
│  │ AccountLambda │  │ UserLambda  │  │ActionTicketLambda  │       │
│  └───────────────┘  └─────────────┘  └────────────────────┘       │
│  ┌──────────────────────┐  ┌─────────────┐  ┌────────────────┐    │
│  │ RecommendationLambda │  │ StatsLambda │  │BackendError    │    │
│  └──────────────────────┘  └─────────────┘  │Handler        │    │
│                                              └────────────────┘    │
│  ┌───────────────────────────────────────────────────────────┐    │
│  │  LearningEngineLambda（週次バッチ）                        │    │
│  └───────────────────────────────────────────────────────────┘    │
└──────────┬──────────────────────────────────┬─────────────────────┘
           │                                  │
┌──────────▼──────────┐          ┌────────────▼──────────────────┐
│     DynamoDB        │          │       Amazon Bedrock           │
│  ┌───────────────┐  │          │  Recommendation生成            │
│  │    UserDB     │  │          │  Persona_Message生成           │
│  ├───────────────┤  │          │  プロフィールAIサジェスト       │
│  │  ActionLogDB  │  │          │  行動モデル構築                │
│  ├───────────────┤  │          └───────────────────────────────┘
│  │ SimilarUserDB │  │
│  └───────────────┘  │
└─────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    Amazon EventBridge Scheduler                      │
│                                                                      │
│  毎週月曜0時 ──────────────────────────→ LearningEngineLambda       │
│  ユーザー設定の集計時刻 ───────────────→ DailyAggregationLambda     │
│                                          （expireTickets +           │
│                                           runDailyAggregation）      │
└─────────────────────────────────────────────────────────────────────┘
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

| コンポーネント         | 役割                                    | 参照               |
| ---------------------- | --------------------------------------- | ------------------ |
| AccountLambda          | アカウント削除                          | components.md #2.1 |
| UserLambda             | Profile・Goal CRUD + AIサジェスト       | components.md #2.2 |
| ActionTicketLambda     | Ticket管理・Effort_Point付与（API専用） | components.md #2.3 |
| RecommendationLambda   | Recommendation・Pivot生成               | components.md #2.4 |
| DailyAggregationLambda | 日次バッチ（自動破棄・集計）            | components.md #2.5 |
| StatsLambda            | 集計データ取得API                       | components.md #2.6 |
| LearningEngineLambda   | 週次バッチ・行動モデル構築              | components.md #2.7 |
| BackendErrorHandler    | 共通エラーハンドリング                  | components.md #2.8 |

### データストア

| コンポーネント | 役割                             | 参照               |
| -------------- | -------------------------------- | ------------------ |
| UserDB         | ユーザー関連データ永続化         | components.md #3.1 |
| ActionLogDB    | 行動ログ永続化                   | components.md #3.2 |
| SimilarUserDB  | 類似ユーザーデータ（v1: モック） | components.md #3.3 |

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

1. **初期起動フロー**: 新規登録 → メール確認 → オンボーディング（プロフィール登録・AIサジェスト・Pivot_Goal自動生成）→ ホーム
2. **アプリ起動フロー**: 認証確認 → プロフィール確認 → Open Ticket確認 → 自動Trigger or ホーム
3. **Recommendationフロー**: Trigger発火 → Bedrock生成 → 4択応答 → Pivot or ActionStep → Ticket生成
4. **Done申告フロー**: Ticket Done → Action_Log記録（リアルタイム）→ Effort_Point付与 → Persona_Message表示
5. **日次集計・自動破棄フロー**: EventBridge → Open Ticket自動破棄 → DailySummary集計 → Persona_Message表示
6. **週次バッチフロー**: EventBridge → LearningEngine → 行動モデル更新 → Profile更新 → Future_Self_Model更新
7. **アカウント削除フロー**: 確認ダイアログ → 全データ削除（UserDB・ActionLogDB・SimilarUserDB）→ Cognito削除

---

## Lambda間依存関係

```
AccountLambda ──────────────────────────────→ UserDB
                                            → ActionLogDB
                                            → CognitoUserPool

UserLambda ─────────────────────────────────→ UserDB
                                            → Bedrock（AIサジェスト・Pivot_Goal生成）

ActionTicketLambda ─────────────────────────→ ActionLogDB（ActionLogEntry・EffortPointRecord書き込み）

RecommendationLambda ───────────────────────→ UserDB
                                            → ActionLogDB
                                            → Bedrock（Recommendation生成）

DailyAggregationLambda ─────────────────────→ ActionLogDB（expireTickets・DailySummary集計）

StatsLambda ────────────────────────────────→ ActionLogDB（集計データ取得）

LearningEngineLambda ───────────────────────→ UserDB
                                            → ActionLogDB
                                            → Bedrock（行動モデル構築）

EventBridgeScheduler ──[週次・月曜0時]─────→ LearningEngineLambda
                     ──[日次・集計時刻]────→ DailyAggregationLambda
```

---

## 設計上の重要な決定事項

### Learning Engineは週次バッチ

Action_Logへの書き込みはリアルタイムだが、行動モデルの構築・Profile更新・Future_Self_Model更新は週次バッチ（毎週月曜0時）で処理する。Recommendationは直近バッチで構築済みのモデルを参照する。

### AccountLambdaの命名

アカウント削除のみを担うLambdaのため、AccountLambdaとする。サインアップ・サインイン・パスワードリセットはCognito/Amplifyが直接処理するためLambda不要。

### UserLambdaへの統合

ProfileとGoalはどちらもUserに紐づくリソースであり、同じUserDBを参照する。オンボーディングフローでも連続して使用されるため1つのLambdaに統合する。エンドポイントは `users/{userId}/profiles`・`users/{userId}/goals` とする。

### Bedrockは各Lambdaから直接呼び出し

専用BedrockServiceを作らず、各Lambda（UserLambda・RecommendationLambda・LearningEngineLambda）から直接AWS SDK v3でBedrockを呼び出す。共通処理はBackendErrorHandlerのBedrockエラーハンドリングで対応する。

### v1はNotificationコンポーネントなし

アプリ内表示のみのv1ではNotificationコンポーネントを作成しない。v2でプッシュ通知対応時に新規追加する。

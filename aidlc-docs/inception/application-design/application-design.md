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
| **Cognito認証**        | Amplify UI Authenticator（認証UIとロジックを一括提供）                |
| **エラーハンドリング** | 共通ErrorHandler + フォールバックメッセージストア                     |
| **通知コンポーネント** | v1は作成しない（v2で新規追加）                                        |
| **Learning Engine**    | 独立したLambda（週次バッチ: EventBridge毎週月曜0時）                  |
| **APIクライアント**    | React Query（TanStack Query）+ axios                                  |

---

## ドメイン構成

本システムは以下の6ドメインで構成する。

| ドメイン           | 責務                                                          | 主なコンポーネント                                                    |
| ------------------ | ------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Account**        | 認証・アカウント管理（登録・ログイン・削除）                  | AccountLambda、CognitoUserPool                                       |
| **User**           | プロフィール・Goal管理、AIサジェスト                          | UserLambda、UserDB                                                   |
| **ActionTicket**   | チケット生成・完了申告                                        | ActionTicketLambda、ActionLogDB                                      |
| **Recommendation** | Trigger発火・Recommendation生成・Pivot・ActionStep            | RecommendationLambda、BedrockClient                                  |
| **EffortPoint**    | ポイント付与（Done申告時）・集計データ取得API                 | ActionTicketLambda、StatsLambda、ActionLogDB                         |
| **Batch**          | 日次バッチ（Action_Ticket自動破棄・DailySummary集計）・週次バッチ（行動モデル構築・Future_Self_Model更新）| DailyAggregationLambda、LearningEngineLambda、EventBridgeScheduler   |

---

## システムアーキテクチャ概要

本システムは AWS サーバーレスアーキテクチャ上に構築される。フロントエンドは React Native、バックエンドは Lambda + API Gateway + DynamoDB、AIは Amazon Bedrock を利用する。認証は Cognito User Pool への直接通信（Amplify Auth）で行う（原則の例外として許容）。バッチ処理は EventBridge スケジューラによって起動される。

```
┌──────────────────────────────────────────────────────────────────────┐
│                      Mobile App (React Native)                        │
│                                                                       │
│  <Amplify UI Authenticator>（認証UIとフローを一括提供）              │
│    └ 認証後のみ以下を描画                                             │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  Screen Layer                                                   │ │
│  │  OnboardingScreens / HomeScreen                                 │ │
│  │  RecommendationScreens / ActionTicketScreens                    │ │
│  │  ProfileScreens / StatsScreens                                  │ │
│  └──────────────────────────────┬──────────────────────────────────┘ │
│                                 │                                     │
│  ┌──────────────────────────────▼──────────────────────────────────┐ │
│  │                         Service Layer                            │ │
│  │  AccountService / ProfileService / GoalService / TriggerService │ │
│  │  RecommendationService / ActionTicketService / StatsService     │ │
│  └────────────────────────┬────────────────────────────────────────┘ │
│                           │                                           │
│  ┌────────────────────────▼────────────────────────────────────────┐ │
│  │  Zustand Stores  │  APIClient (axios+RQ)                         │ │
│  │  (authStore等)   │  fetchAuthSession() で JWT 取得              │ │
│  └──────────┬─────────────────────┬────────────────────────────────┘ │
└─────────────┼─────────────────────┼──────────────────────────────────┘
              │ HTTPS / REST        │
              ▼                     │  (Amplify UI Authenticator が Cognito と直接通信)
┌─────────────────────────┐         │    ┌─────────────────────────────┐
│   API Gateway (AWS)     │         │    │   AWS Cognito User Pool     │
└────────────┬────────────┘         │    │   （サインアップ・サインイン │
             │                      │    │    パスワードリセット）       │
             ▼                      │    └─────────────────────────────┘
┌────────────────────────────────────────────────────────────────────┐
│                  Backend Lambda Functions（API）                    │
│                                                                     │
│  ┌───────────────┐  ┌─────────────┐  ┌────────────────────┐       │
│  │ AccountLambda │  │ UserLambda  │  │ActionTicketLambda  │       │
│  └───────────────┘  └─────────────┘  └────────────────────┘       │
│  ┌──────────────────────┐  ┌─────────────┐  ┌────────────────┐    │
│  │ RecommendationLambda │  │ StatsLambda │  │ BackendError   │    │
│  └──────────────────────┘  └─────────────┘  │ Handler（共通）│    │
│                                              └────────────────┘    │
└──────────┬──────────────────────────────────┬─────────────────────┘
           │                                  │
┌──────────▼──────────┐          ┌────────────▼──────────────────┐
│     DynamoDB        │          │       Amazon Bedrock           │
│  ┌───────────────┐  │          │  Recommendation生成            │
│  │    UserDB     │  │          │  Persona_Message生成           │
│  ├───────────────┤  │          │  プロフィールAIサジェスト       │
│  │  ActionLogDB  │  │          │  行動モデル構築                │
│  ├───────────────┤  │          └───────────────────────────────┘
│  │ SimilarUserDB │  │                        ▲
│  │ （v1: モック）│  │                        │
│  └───────────────┘  │                        │
└─────────▲───────────┘                        │
          │                                    │
          │  ┌─────────────────────────────────┴──────────────┐
          │  │      バッチ処理（EventBridge Scheduler 配下）  │
          │  │                                                │
          └──┤  ┌───────────────────────────────────────────┐ │
             │  │  DailyAggregationLambda（日次バッチ）     │ │
             │  │    expireTickets + runDailyAggregation    │ │
             │  └───────────────────────────────────────────┘ │
             │  ┌───────────────────────────────────────────┐ │
             │  │  LearningEngineLambda（週次バッチ）       │ │
             │  └───────────────────────────────────────────┘ │
             └────────────────────▲───────────────────────────┘
                                  │
                    ┌─────────────┴──────────┐
                    │ EventBridge Scheduler  │
                    │  毎日0時 → Daily       │
                    │  毎週月曜0時 → Learning│
                    └────────────────────────┘
```

**図の補足**:

- **Amplify UI Authenticator** がアプリのルートを包み、未認証時は認証 UI（サインアップ・サインイン・パスワードリセット・メール確認）を自動表示する。認証成功後にラップされた Screen Layer が描画される
- アカウント削除時の Cognito 削除は AccountLambda 経由で実行される（フロントから直接 Cognito へは削除しない）
- EventBridge は日次バッチ（DailyAggregationLambda）と週次バッチ（LearningEngineLambda）のスケジュール起動専用
- SimilarUserDB は v1 ではモックデータのみ保持し、RecommendationLambda が読み取り専用でアクセスする
- Service 層は内部実装として React Query + axios を使用する（画面コンポーネントからはカスタムフックを通して呼び出される）。詳細なフックインターフェースは services.md / component-methods.md を参照

---

## コンポーネント構成（詳細は各ドキュメント参照）

### Frontend（React Native）

| コンポーネント           | 役割                               | 参照                |
| ------------------------ | ---------------------------------- | ------------------- |
| NavigationComponent      | 画面遷移管理（Bottom Tab + Stack） | components.md #1.1  |
| OnboardingScreens        | プロフィール登録画面群             | components.md #1.2  |
| HomeScreen               | ホーム画面                         | components.md #1.3  |
| RecommendationScreens    | Recommendation・Pivot画面群        | components.md #1.4  |
| ActionTicketScreens      | チケット管理画面群                 | components.md #1.5  |
| ProfileScreens           | プロフィール・Goal管理画面群       | components.md #1.6  |
| StatsScreens             | 統計・グラフ画面群                 | components.md #1.7  |
| ZustandStore             | グローバル状態管理                 | components.md #1.8  |
| APIClient                | HTTP通信（React Query + axios）    | components.md #1.9  |
| FrontendErrorHandler     | エラー・フォールバック処理         | components.md #1.10 |
| Amplify UI Authenticator | 認証UI・フロー一括提供（外部）     | components.md #1.11 |

### Backend（AWS Lambda — API）

| コンポーネント        | 役割                                    | 参照               |
| --------------------- | --------------------------------------- | ------------------ |
| AccountLambda         | アカウント削除                          | components.md #2.1 |
| UserLambda            | Profile・Goal CRUD + AIサジェスト       | components.md #2.2 |
| ActionTicketLambda    | Ticket管理・Effort_Point付与（API専用） | components.md #2.3 |
| RecommendationLambda  | Recommendation・Pivot生成               | components.md #2.4 |
| StatsLambda           | 集計データ取得API                       | components.md #2.5 |
| BackendErrorHandler   | 共通エラーハンドリング                  | components.md #2.6 |

### バッチ処理（EventBridge Scheduler 配下）

| コンポーネント         | 役割                                    | 参照               |
| ---------------------- | --------------------------------------- | ------------------ |
| DailyAggregationLambda | 日次バッチ（自動破棄・集計）            | components.md #3.1 |
| LearningEngineLambda   | 週次バッチ・行動モデル構築              | components.md #3.2 |

### データストア

| コンポーネント | 役割                             | 参照               |
| -------------- | -------------------------------- | ------------------ |
| UserDB         | ユーザー関連データ永続化         | components.md #4.1 |
| ActionLogDB    | 行動ログ永続化                   | components.md #4.2 |
| SimilarUserDB  | 類似ユーザーデータ（v1: モック） | components.md #4.3 |

---

## サービス層（詳細は services.md 参照）

| サービス                | 主な責務                                          |
| ----------------------- | ------------------------------------------------- |
| AccountService          | アカウント削除（Amplify UI が提供しないため独自） |
| ProfileService          | プロフィール取得・更新                            |
| GoalService             | Goal管理・Pivot_Goal昇格候補取得                 |
| TriggerService          | Trigger発火・自動Trigger判定                      |
| RecommendationService   | Recommendation・Pivot・ActionStep                 |
| ActionTicketService     | Ticket操作・Done申告                              |
| StatsService            | Effort_Point・集計データ・破棄メッセージ取得      |

認証フロー（サインアップ・サインイン・パスワードリセット・メール確認）は Amplify UI Authenticator が提供する。アプリ独自の AuthService は不要。

---

## 主要フロー（詳細は component-dependency.md 参照）

1. **初期起動フロー**: 新規登録 → メール確認 → オンボーディング（プロフィール登録・AIサジェスト・Pivot_Goal自動生成）→ ホーム
2. **アプリ起動フロー**: 認証確認 → プロフィール確認 → HomeScreen マウント → Open Ticket確認 → 自動Trigger or ホーム表示
3. **Recommendationフロー**: Trigger発火 → Bedrock生成 → 4択応答 → Pivot or ActionStep生成 → Ticket生成
4. **Done申告フロー**: Ticket Done → Action_Log記録（リアルタイム）→ Effort_Point付与 → Persona_Message表示
5. **日次集計・自動破棄フロー**: EventBridge（毎日0時）→ Open Ticket自動破棄 → DailySummary集計 → 次回アプリ起動時にHomeScreenで破棄メッセージ表示
6. **週次バッチフロー**: EventBridge（毎週月曜0時）→ LearningEngine → 行動モデル更新 → Profile更新 → Future_Self_Model更新 → 昇格候補フラグ更新
7. **アカウント削除フロー**: 確認ダイアログ → JWT claims から userId 取得 → 全データ削除（UserDB・ActionLogDB）→ Cognito削除（SimilarUserDBは匿名化済みのため対象外）
8. **Pivot_Goal昇格提案フロー（FR-07-2）**: HomeScreen マウント → 昇格候補取得 → バナー表示 → ユーザー承認 → Primary_Goal 昇格
9. **破棄メッセージ表示フロー（FR-13-5）**: HomeScreen マウント → 最新 DailySummary.discardMessage 取得 → バナー/ダイアログ表示

---

## Lambda間依存関係

```
AccountLambda ──────────────────────────────→ UserDB
                                            → ActionLogDB
                                            → CognitoUserPool
                                            （SimilarUserDB は匿名化済みのため削除対象外）

UserLambda ─────────────────────────────────→ UserDB
                                            → Bedrock（AIサジェスト・Pivot_Goal生成）

ActionTicketLambda ─────────────────────────→ ActionLogDB（ActionLogEntry・EffortPointRecord書き込み）

RecommendationLambda ───────────────────────→ UserDB
                                            → ActionLogDB
                                            → SimilarUserDB（v1: モック読み取り）
                                            → Bedrock（Recommendation生成）

DailyAggregationLambda ─────────────────────→ ActionLogDB（expireTickets・DailySummary集計・discardMessage書き込み）

StatsLambda ────────────────────────────────→ ActionLogDB（集計データ取得・discardMessage取得）

LearningEngineLambda ───────────────────────→ UserDB
                                            → ActionLogDB
                                            → Bedrock（行動モデル構築）

EventBridgeScheduler ──[週次・月曜0時]─────→ LearningEngineLambda
                     ──[日次・毎日0時]─────→ DailyAggregationLambda
```

---

## 設計上の重要な決定事項

### Learning Engineは週次バッチ

Action_Logへの書き込みはリアルタイムだが、行動モデルの構築・Profile更新・Future_Self_Model更新は週次バッチ（毎週月曜0時）で処理する。Recommendationは直近バッチで構築済みのモデルを参照する。

### AccountLambdaの命名

アカウント削除のみを担うLambdaのため、AccountLambdaとする。サインアップ・サインイン・パスワードリセットはCognito/Amplifyが直接処理するためLambda不要。アカウント削除エンドポイントは `DELETE /me`（path に userId を含まない）で、**JWT claims の `sub`** を userId として使用する。**SimilarUserDB は匿名化済みデータのためアカウント削除対象外**。

### 全Lambdaの認可方針

API Gateway の Cognito Authorizer で JWT の署名・有効期限を検証した上で、各 Lambda は `event.requestContext.authorizer.claims.sub` から認証済みの `userId` を取得する。API エンドポイントは `/me/...` 形式を採用し、URL path に userId を含めない。これにより以下の利点を得る。

- path userId と JWT sub の一致確認（認可チェック）が構造上不要
- 他ユーザーデータへの横アクセスが発生しない（設計レベルで保証）
- Lambda 共通処理として `getUserIdFromToken(event)` ヘルパーを BackendErrorHandler に配置
- バッチ Lambda（DailyAggregationLambda / LearningEngineLambda）は API Gateway を通さない（EventBridge トリガー）ため認可対象外

### UserLambdaへの統合

ProfileとGoalはどちらもUserに紐づくリソースであり、同じUserDBを参照する。オンボーディングフローでも連続して使用されるため1つのLambdaに統合する。エンドポイントは `/me/profile`・`/me/goals` とする（JWT claims の sub から userId を取得するため、path に userId を含まない）。

### Bedrockは各Lambdaから直接呼び出し

専用BedrockServiceを作らず、各Lambda（UserLambda・RecommendationLambda・LearningEngineLambda）から直接AWS SDK v3でBedrockを呼び出す。共通処理はBackendErrorHandlerのBedrockエラーハンドリングで対応する。

### v1はNotificationコンポーネントなし

アプリ内表示のみのv1ではNotificationコンポーネントを作成しない。v2でプッシュ通知対応時に新規追加する。

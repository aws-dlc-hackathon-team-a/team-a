# コンポーネント定義 — だが、それでいい（DagaSoreDeIi_App）

## 目次

- [コンポーネント定義 — だが、それでいい（DagaSoreDeIi_App）](#コンポーネント定義--だがそれでいいdagasoredeii_app)
  - [目次](#目次)
  - [概要](#概要)
  - [コンポーネント一覧サマリー](#コンポーネント一覧サマリー)
  - [1. Mobile Frontend コンポーネント](#1-mobile-frontend-コンポーネント)
    - [1.1 NavigationComponent](#11-navigationcomponent)
    - [1.2 AuthScreens](#12-authscreens)
    - [1.3 OnboardingScreens](#13-onboardingscreens)
    - [1.4 HomeScreen](#14-homescreen)
    - [1.5 RecommendationScreens](#15-recommendationscreens)
    - [1.6 ActionTicketScreens](#16-actionticketscreens)
    - [1.7 ProfileScreens](#17-profilescreens)
    - [1.8 StatsScreens](#18-statsscreens)
    - [1.9 Zustand Stores](#19-zustand-stores)
    - [1.10 APIClient](#110-apiclient)
    - [1.11 AuthService（Frontend）](#111-authservicefrontend)
    - [1.12 FrontendErrorHandler](#112-frontenderrorhandler)
  - [2. Backend Lambda コンポーネント](#2-backend-lambda-コンポーネント)
    - [2.1 AccountLambda](#21-accountlambda)
    - [2.2 UserLambda](#22-userlambda)
    - [2.3 ActionTicketLambda](#23-actionticketlambda)
    - [2.4 RecommendationLambda](#24-recommendationlambda)
    - [2.5 DailyAggregationLambda](#25-dailyaggregationlambda)
    - [2.6 StatsLambda](#26-statslambda)
    - [2.7 LearningEngineLambda](#27-learningenginelambda)
    - [2.8 BackendErrorHandler](#28-backenderrorhandler)
  - [3. データストアコンポーネント](#3-データストアコンポーネント)
    - [3.1 UserDB（DynamoDB テーブル）](#31-userdbdynamodb-テーブル)
    - [3.2 ActionLogDB（DynamoDB テーブル）](#32-actionlogdbdynamodb-テーブル)
    - [3.3 SimilarUserDB（DynamoDB テーブル）](#33-similaruserdbdynamodb-テーブル)

---

## 概要

本ドキュメントはシステムを構成するアーキテクチャコンポーネントの一覧と責務を定義する。
UIパーツではなく、機能的な責務単位（モジュール・サービス・レイヤー）として定義する。

レイヤー構成図・アーキテクチャ概要は [application-design.md](./application-design.md) を参照。

---

## コンポーネント一覧サマリー

| #   | コンポーネント          | レイヤー     | 種別                                       |
| --- | ----------------------- | ------------ | ------------------------------------------ |
| 1   | NavigationComponent     | Frontend     | React Navigation                           |
| 2   | AuthScreens             | Frontend     | 画面群                                     |
| 3   | OnboardingScreens       | Frontend     | 画面群                                     |
| 4   | HomeScreen              | Frontend     | 画面                                       |
| 5   | RecommendationScreens   | Frontend     | 画面群                                     |
| 6   | ActionTicketScreens     | Frontend     | 画面群                                     |
| 7   | ProfileScreens          | Frontend     | 画面群                                     |
| 8   | StatsScreens            | Frontend     | 画面群                                     |
| 9   | Zustand Stores          | Frontend     | 状態管理（3ストア、残りはReact Query検討） |
| 10  | APIClient               | Frontend     | HTTPクライアント                           |
| 11  | AuthService（Frontend） | Frontend     | Amplifyラッパー                            |
| 12  | FrontendErrorHandler    | Frontend     | 共通エラー処理                             |
| 13  | AccountLambda           | Backend      | Lambda                                     |
| 14  | UserLambda              | Backend      | Lambda                                     |
| 15  | ActionTicketLambda      | Backend      | Lambda                                     |
| 16  | RecommendationLambda    | Backend      | Lambda                                     |
| 17  | DailyAggregationLambda  | Backend      | Lambda（日次バッチ）                       |
| 18  | StatsLambda             | Backend      | Lambda                                     |
| 19  | LearningEngineLambda    | Backend      | Lambda（週次バッチ）                       |
| 20  | BackendErrorHandler     | Backend      | 共通ミドルウェア                           |
| 21  | UserDB                  | データストア | DynamoDB                                   |
| 22  | ActionLogDB             | データストア | DynamoDB                                   |
| 23  | SimilarUserDB           | データストア | DynamoDB                                   |

---

## 1. Mobile Frontend コンポーネント

### 1.1 NavigationComponent

| 項目                 | 内容                                                                                                                                                                                                                                                                                                                          |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **種別**             | React Navigation 設定モジュール                                                                                                                                                                                                                                                                                               |
| **責務**             | アプリ全体の画面遷移を管理する。Bottom Tab Navigator（ホーム・チケット・プロフィール・統計）+ Stack Navigator（認証フロー・オンボーディング・Recommendationフロー）の構成を定義する                                                                                                                                           |
| **主要画面グループ** | AuthStack（メールアドレス/パスワードによる新規アカウント登録・ログイン・パスワードリセット・メール確認）、OnboardingStack（初回プロフィール登録）、MainTab（ホーム・チケット一覧・プロフィール・統計）、RecommendationStack（Trigger発火後に全画面表示されるRecommendation提案・Pivot提案・心理状態入力の一連のフロー画面群） |

### 1.2 AuthScreens

| 項目     | 内容                                                                                 |
| -------- | ------------------------------------------------------------------------------------ |
| **種別** | React Native 画面コンポーネント群                                                    |
| **責務** | ログイン・新規登録・パスワードリセット・メール確認の各画面UIとユーザー入力処理を担う |
| **依存** | AuthService、NavigationComponent                                                     |

### 1.3 OnboardingScreens

| 項目     | 内容                                                                                                           |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| **種別** | React Native 画面コンポーネント群                                                                              |
| **責務** | 初回起動時のプロフィール登録フロー（ニックネーム・年齢・職業・興味・生活リズム・悩み）とAIサジェスト表示を担う |
| **依存** | ProfileService、NavigationComponent                                                                            |

### 1.4 HomeScreen

| 項目     | 内容                                                                                                 |
| -------- | ---------------------------------------------------------------------------------------------------- |
| **種別** | React Native 画面コンポーネント                                                                      |
| **責務** | ホーム画面のUI表示。Open状態のAction_Ticket一覧・手動TriggerボタンUI・Effort_Pointサマリーを表示する |
| **依存** | ActionTicketService、TriggerService、EffortPointService、ZustandStore                                |

### 1.5 RecommendationScreens

| 項目     | 内容                                                                                                                                                                              |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **種別** | React Native 画面コンポーネント群                                                                                                                                                 |
| **責務** | Trigger発火時（自動・手動）にホーム画面上に全画面表示されるRecommendationフロー画面群。心理状態入力・Recommendation提案表示・4択応答・Pivot提案・チケット起票確認の各画面UIを担う |
| **依存** | RecommendationService、ActionTicketService、ZustandStore                                                                                                                          |

### 1.6 ActionTicketScreens

| 項目     | 内容                                                        |
| -------- | ----------------------------------------------------------- |
| **種別** | React Native 画面コンポーネント群                           |
| **責務** | Action_Ticket一覧（Open/Done/破棄）の表示・完了申告UIを担う |
| **依存** | ActionTicketService、ZustandStore                           |

### 1.7 ProfileScreens

| 項目     | 内容                                                                                                             |
| -------- | ---------------------------------------------------------------------------------------------------------------- |
| **種別** | React Native 画面コンポーネント群                                                                                |
| **責務** | プロフィール表示・編集・Goal管理（追加・削除・優先度変更・Primary_Goal設定）・学習データリセットの各画面UIを担う |
| **依存** | ProfileService、GoalService、ZustandStore                                                                        |

### 1.8 StatsScreens

| 項目     | 内容                                                                  |
| -------- | --------------------------------------------------------------------- |
| **種別** | React Native 画面コンポーネント群                                     |
| **責務** | Effort_Point累計・週間/月間グラフ・得意な行動パターン分析の表示を担う |
| **依存** | EffortPointService、ZustandStore                                      |

### 1.9 Zustand Stores

アプリ全体の共有状態を管理するZustandストア群。ドメインごとに独立したストアとして定義する。

**v1スコープでのストア方針**:

- 以下の3ストアをZustandで管理する（グローバル状態が必要な理由あり）
- `profileStore`・`goalStore`・`effortPointStore` はサーバーデータのためReact Queryキャッシュで代替できる可能性が高く、Construction PhaseのFunctional Designで詳細を決定する

| ストア名                | 管理する状態                                                                | Zustand採用理由                                                                 |
| ----------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **authStore**           | 認証状態・CognitoUserオブジェクト・isAuthenticated                          | ほぼ全画面が参照し、NavigationComponentのルーティング判定にも使用するため必須   |
| **ticketStore**         | Open状態のAction_Ticket一覧                                                 | HomeScreenとActionTicketScreensが同じデータを共有し、Done申告後の即時反映が必要 |
| **recommendationStore** | 現在のRecommendation・recommendationState（idle/loading/active/pivot/done） | RecommendationフローがStack Navigatorをまたいで状態を保持する必要があるため     |

### 1.10 APIClient

| 項目     | 内容                                                                                                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **種別** | React Query + axios ベースのHTTPクライアントモジュール                                                                                                                         |
| **責務** | バックエンドAPIへのHTTPリクエスト送信・レスポンス受信・キャッシュ管理・再試行・ローディング状態管理を担う。Amplify Authが発行するJWTトークンをリクエストヘッダーに自動付与する |
| **依存** | Amplify Auth（トークン取得）                                                                                                                                                   |

### 1.11 AuthService（Frontend）

| 項目     | 内容                                                                                                                                       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **種別** | Amplify Auth ラッパーサービス                                                                                                              |
| **責務** | AWS Amplify Auth を使用したCognito認証処理（サインアップ・サインイン・サインアウト・パスワードリセット・メール確認・セッション管理）を担う |
| **依存** | AWS Amplify Auth、ZustandStore                                                                                                             |

### 1.12 FrontendErrorHandler

| 項目                             | 内容                                                                                                                             |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **種別**                         | 共通エラーハンドリングモジュール                                                                                                 |
| **責務**                         | APIエラー・ネットワークエラー・Bedrockタイムアウト時のフォールバックメッセージ表示・ユーザー向けエラーメッセージの統一管理を担う |
| **フォールバックメッセージ定数** | Bedrockタイムアウト時・API障害時に使用する事前定義メッセージをconst値として保持する（状態管理ではなく静的な定数ファイル）        |

---

## 2. Backend Lambda コンポーネント

### 2.1 AccountLambda

| 項目         | 内容                                                                                                                                                 |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **種別**     | AWS Lambda 関数                                                                                                                                      |
| **責務**     | アカウント削除処理（確認→全データ削除→Cognito削除）を担う。サインアップ・サインイン・パスワードリセットはCognito/Amplifyが直接処理するためLambda不要 |
| **トリガー** | `DELETE /users/{userId}`                                                                                                                             |
| **依存**     | DynamoDB（UserDB・ActionLogDB）、AWS Cognito                                                                                                         |
| **備考**     | SimilarUserDBは匿名化済みデータのため個人特定不可。アカウント削除対象外（個人情報保護法上も削除不要）                                                |

### 2.2 UserLambda

| 項目         | 内容                                                                                                                                                                                                                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **種別**     | AWS Lambda 関数                                                                                                                                                                                                                                                                             |
| **責務**     | Profile（取得・更新・更新履歴）とGoal（一覧・追加・更新・削除・Primary_Goal設定・優先度変更）のCRUD処理を担う。ProfileとGoalはどちらもUserに紐づき同じUserDBを参照するため統合する                                                                                                          |
| **トリガー** | `GET /users/{userId}/profiles`、`PUT /users/{userId}/profiles`、`GET /users/{userId}/profiles/suggestions`、`GET /users/{userId}/goals`、`POST /users/{userId}/goals`、`PUT /users/{userId}/goals/{goalId}`、`DELETE /users/{userId}/goals/{goalId}`、`POST /users/{userId}/goals/generate` |
| **依存**     | DynamoDB（UserDB）、Amazon Bedrock（プロフィール登録時のAIサジェスト・Pivot_Goal自動生成）                                                                                                                                                                                                  |

### 2.3 ActionTicketLambda

| 項目             | 内容                                                                                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **種別**         | AWS Lambda 関数                                                                                                                                                                      |
| **責務**         | Action_Ticketの生成・一覧取得・Done申告・破棄履歴取得を担う。Done申告時にAction_LogへのリアルタイムWrite・Effort_Point計算・付与・マイルストーン判定をこのLambda内で完結して処理する |
| **トリガー**     | `POST /tickets/{userId}`（生成）、`GET /tickets/{userId}`（一覧）、`PUT /tickets/{userId}/{ticketId}/complete`（Done申告）、`GET /tickets/{userId}/expired`（破棄履歴）              |
| **依存**         | DynamoDB（ActionLogDB）                                                                                                                                                              |
| **主要メソッド** | `createTicket` / `getOpenTickets` / `completeTicket` / `getExpiredTicketHistory` / `calculatePoints`（純粋関数・PBT対象）/ `checkMilestone`                                          |

### 2.4 RecommendationLambda

| 項目         | 内容                                                                                                                                                              |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **種別**     | AWS Lambda 関数                                                                                                                                                   |
| **責務**     | Trigger発火時のRecommendation生成・Pivot提案・ActionStep生成をAmazon Bedrockを使用して行う。Action_Log件数に応じてデフォルト/パーソナライズプロンプトを切り替える |
| **トリガー** | `POST /recommendations/{userId}`（Recommendation生成）、`POST /recommendations/{userId}/pivot`（Pivot提案）                                                       |
| **依存**     | DynamoDB（UserDB・ActionLogDB）、Amazon Bedrock                                                                                                                   |

### 2.5 DailyAggregationLambda

| 項目             | 内容                                                                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **種別**         | AWS Lambda 関数（日次バッチ）                                                                                                          |
| **責務**         | 日次バッチ処理を担う。ユーザー設定の集計時刻にEventBridgeから起動し、Open状態のAction_Ticketを自動破棄してDailySummaryを生成・集計する |
| **トリガー**     | EventBridge（ユーザー設定の集計時刻）                                                                                                  |
| **依存**         | DynamoDB（ActionLogDB）                                                                                                                |
| **主要メソッド** | `expireTickets`（ActionTicketの自動破棄）/ `runDailyAggregation`（DailySummary集計）                                                   |

### 2.6 StatsLambda

| 項目             | 内容                                                                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **種別**         | AWS Lambda 関数                                                                                                              |
| **責務**         | 集計データの取得APIを提供する。StatsScreensのグラフ表示・HomeScreenのEffort_Pointサマリー表示に使用する                      |
| **トリガー**     | `GET /stats/{userId}/daily`、`GET /stats/{userId}/weekly`、`GET /stats/{userId}/monthly`、`GET /stats/{userId}/total-points` |
| **依存**         | DynamoDB（ActionLogDB）                                                                                                      |
| **主要メソッド** | `getDailySummary` / `getWeeklySummary` / `getMonthlySummary` / `getTotalPoints`                                              |

### 2.7 LearningEngineLambda

| 項目             | 内容                                                                                                                                                                                                                                                                    |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **種別**         | AWS Lambda 関数（週次バッチ）                                                                                                                                                                                                                                           |
| **責務**         | 週次バッチ処理として全ユーザーのAction_Logを解析し、行動モデル（時間帯・曜日パターン・Yes/No傾向・actionLevel傾向・Goal選択傾向）を構築・更新する。Amazon Bedrockを使用してパーソナライズモデルを生成し、UserDBのBehaviorModelを更新する。Future_Self_Modelの更新も担う |
| **トリガー**     | EventBridge（毎週月曜0時）                                                                                                                                                                                                                                              |
| **依存**         | DynamoDB（UserDB・ActionLogDB）、Amazon Bedrock                                                                                                                                                                                                                         |
| **主要メソッド** | `runWeeklyBatch` / `buildBehaviorModel` / `updateProfileBehaviorTrends` / `updateFutureSelfModel` / `checkPivotGoalPromotion` / `analyzeStrengthPatterns`                                                                                                               |

### 2.8 BackendErrorHandler

| 項目             | 内容                                                                                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **種別**         | 共通Lambdaミドルウェア/ユーティリティモジュール                                                                                                                           |
| **責務**         | 全Lambda共通のエラーハンドリング（Bedrockタイムアウト・DynamoDB障害・バリデーションエラー）とフォールバックレスポンス生成を担う。各Lambdaから共通モジュールとして使用する |
| **主要メソッド** | `withErrorHandling` / `handleBedrockError` / `handleDynamoDBError` / `createErrorResponse`                                                                                |

---

## 3. データストアコンポーネント

### 3.1 UserDB（DynamoDB テーブル）

| 項目             | 内容                                                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **種別**         | AWS DynamoDB テーブル                                                                                                            |
| **責務**         | ユーザー関連データの永続化。User・Profile・ProfileUpdateHistory・Goal・TriggerSettings・FutureSelfModel・BehaviorModelを格納する |
| **キャパシティ** | オンデマンドモード                                                                                                               |
| **型定義参照**   | [component-methods.md — 型定義（主要）](./component-methods.md#型定義主要) ※ User・Profile・Goal等の詳細な型定義を参照           |

### 3.2 ActionLogDB（DynamoDB テーブル）

| 項目             | 内容                                                                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **種別**         | AWS DynamoDB テーブル                                                                                                              |
| **責務**         | 行動ログ関連データの永続化。ActionLogEntry・ActionTicket・EffortPointRecord・DailySummary・Milestoneを格納する                     |
| **キャパシティ** | オンデマンドモード                                                                                                                 |
| **型定義参照**   | [component-methods.md — 型定義（主要）](./component-methods.md#型定義主要) ※ ActionTicket・EffortPointRecord等の詳細な型定義を参照 |

### 3.3 SimilarUserDB（DynamoDB テーブル）

| 項目             | 内容                                                                                                        |
| ---------------- | ----------------------------------------------------------------------------------------------------------- |
| **種別**         | AWS DynamoDB テーブル                                                                                       |
| **責務**         | 類似ユーザーデータの永続化。SimilarUserDataレコードを格納する（v1はモックデータのみ。実データ収集はv2以降） |
| **キャパシティ** | オンデマンドモード                                                                                          |

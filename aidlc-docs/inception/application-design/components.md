# コンポーネント定義 — だが、それでいい（DagaSoreDeIi_App）

## 目次

- [コンポーネント定義 — だが、それでいい（DagaSoreDeIi_App）](#コンポーネント定義--だがそれでいいdagasoredeii_app)
  - [目次](#目次)
  - [概要](#概要)
  - [コンポーネント一覧サマリー](#コンポーネント一覧サマリー)
  - [1. Mobile Frontend コンポーネント](#1-mobile-frontend-コンポーネント)
    - [1.1 NavigationComponent](#11-navigationcomponent)
    - [1.2 OnboardingScreens](#12-onboardingscreens)
    - [1.3 HomeScreen](#13-homescreen)
    - [1.4 RecommendationScreens](#14-recommendationscreens)
    - [1.5 ActionTicketScreens](#15-actionticketscreens)
    - [1.6 ProfileScreens](#16-profilescreens)
    - [1.7 StatsScreens](#17-statsscreens)
    - [1.8 Zustand Stores](#18-zustand-stores)
    - [1.9 APIClient](#19-apiclient)
    - [1.10 FrontendErrorHandler](#110-frontenderrorhandler)
    - [1.11 Amplify UI Authenticator（外部ライブラリ）](#111-amplify-ui-authenticator外部ライブラリ)
  - [2. Backend Lambda コンポーネント](#2-backend-lambda-コンポーネント)
    - [2.1 AccountLambda](#21-accountlambda)
    - [2.2 UserLambda](#22-userlambda)
    - [2.3 ActionTicketLambda](#23-actionticketlambda)
    - [2.4 RecommendationLambda](#24-recommendationlambda)
    - [2.5 StatsLambda](#25-statslambda)
    - [2.6 BackendErrorHandler](#26-backenderrorhandler)
  - [3. バッチ処理コンポーネント（EventBridge Scheduler 配下）](#3-バッチ処理コンポーネントeventbridge-scheduler-配下)
    - [3.1 DailyAggregationLambda](#31-dailyaggregationlambda)
    - [3.2 LearningEngineLambda](#32-learningenginelambda)
  - [4. データストアコンポーネント](#4-データストアコンポーネント)
    - [4.1 UserDB（DynamoDB テーブル）](#41-userdbdynamodb-テーブル)
    - [4.2 ActionLogDB（DynamoDB テーブル）](#42-actionlogdbdynamodb-テーブル)
    - [4.3 SimilarUserDB（DynamoDB テーブル）](#43-similaruserdbdynamodb-テーブル)

---

## 概要

本ドキュメントはシステムを構成するアーキテクチャコンポーネントの一覧と責務を定義する。
UIパーツではなく、機能的な責務単位（モジュール・サービス・レイヤー）として定義する。

レイヤー構成図・アーキテクチャ概要は [application-design.md](./application-design.md) を参照。

---

## コンポーネント一覧サマリー

| #   | コンポーネント              | レイヤー     | 種別                                                          |
| --- | --------------------------- | ------------ | ------------------------------------------------------------- |
| 1   | NavigationComponent         | Frontend     | React Navigation                                              |
| 2   | OnboardingScreens           | Frontend     | 画面群                                                        |
| 3   | HomeScreen                  | Frontend     | 画面                                                          |
| 4   | RecommendationScreens       | Frontend     | 画面群                                                        |
| 5   | ActionTicketScreens         | Frontend     | 画面群                                                        |
| 6   | ProfileScreens              | Frontend     | 画面群                                                        |
| 7   | StatsScreens                | Frontend     | 画面群                                                        |
| 8   | Zustand Stores              | Frontend     | 状態管理（authStore/ticketStore/recommendationStore の3ストア。残りはConstruction Phaseで決定） |
| 9   | APIClient                   | Frontend     | HTTPクライアント                                              |
| 10  | FrontendErrorHandler        | Frontend     | 共通エラー処理                                                |
| 11  | Amplify UI Authenticator    | Frontend     | 外部ライブラリ（認証UIとフロー一括提供）                      |
| 12  | AccountLambda               | Backend      | Lambda                                                        |
| 13  | UserLambda                  | Backend      | Lambda                                                        |
| 14  | ActionTicketLambda          | Backend      | Lambda                                                        |
| 15  | RecommendationLambda        | Backend      | Lambda                                                        |
| 16  | StatsLambda                 | Backend      | Lambda                                                        |
| 17  | BackendErrorHandler         | Backend      | 共通ミドルウェア                                              |
| 18  | DailyAggregationLambda      | バッチ処理   | Lambda（日次バッチ・EventBridge配下）                         |
| 19  | LearningEngineLambda        | バッチ処理   | Lambda（週次バッチ・EventBridge配下）                         |
| 20  | UserDB                      | データストア | DynamoDB                                                      |
| 21  | ActionLogDB                 | データストア | DynamoDB                                                      |
| 22  | SimilarUserDB               | データストア | DynamoDB                                                      |

---

## 1. Mobile Frontend コンポーネント

### 1.1 NavigationComponent

| 項目                 | 内容                                                                                                                                                                                                                                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **種別**             | React Navigation 設定モジュール                                                                                                                                                                                                                                                                                                             |
| **責務**             | 認証後のアプリ全体の画面遷移を管理する。Bottom Tab Navigator（ホーム・チケット・プロフィール・統計）+ Stack Navigator（オンボーディング・Recommendationフロー）の構成を定義する。**認証フロー（サインアップ・サインイン・パスワードリセット・メール確認）は Amplify UI Authenticator が提供するため、NavigationComponent の責務外**       |
| **主要画面グループ** | OnboardingStack（初回プロフィール登録）、MainTab（ホーム・チケット一覧・プロフィール・統計）、RecommendationStack（Trigger発火後に全画面表示されるRecommendation提案・Pivot提案・心理状態入力の一連のフロー画面群）                                                                                                                          |
| **備考**             | Amplify UI Authenticator の `<Authenticator>` コンポーネントでラップし、未認証時は Authenticator が認証UIを表示、認証後に本 NavigationComponent が描画される                                                                                                                                                                                |

### 1.2 OnboardingScreens

| 項目     | 内容                                                                                                           |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| **種別** | React Native 画面コンポーネント群                                                                              |
| **責務** | 初回起動時のプロフィール登録フロー（ニックネーム・年齢・職業・興味・生活リズム・悩み）とAIサジェスト表示を担う |
| **依存** | ProfileService、NavigationComponent                                                                            |

### 1.3 HomeScreen

| 項目     | 内容                                                                                                 |
| -------- | ---------------------------------------------------------------------------------------------------- |
| **種別** | React Native 画面コンポーネント                                                                      |
| **責務** | ホーム画面のUI表示。Open状態のAction_Ticket一覧・手動TriggerボタンUI・Effort_Pointサマリー（totalPoints）を表示する。日次バッチ実行後の次回アプリ起動時に破棄メッセージをバナー/ダイアログで表示する（FR-13-5）。Pivot_Goal昇格候補が存在する場合は昇格提案バナーを表示する（FR-07-2） |
| **依存** | ActionTicketService、TriggerService、StatsService、GoalService、ZustandStore                        |

### 1.4 RecommendationScreens

| 項目     | 内容                                                                                                                                                                              |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **種別** | React Native 画面コンポーネント群                                                                                                                                                 |
| **責務** | Trigger発火時（自動・手動）にホーム画面上に全画面表示されるRecommendationフロー画面群。心理状態入力・Recommendation提案表示・ActionStep（具体的な行動手順）表示・4択応答・Pivot提案・チケット起票確認の各画面UIを担う |
| **依存** | RecommendationService、ActionTicketService、ZustandStore                                                                                                                          |

### 1.5 ActionTicketScreens

| 項目     | 内容                                                        |
| -------- | ----------------------------------------------------------- |
| **種別** | React Native 画面コンポーネント群                           |
| **責務** | Action_Ticket一覧（Open/Done/破棄）の表示・完了申告UIを担う |
| **依存** | ActionTicketService、ZustandStore                           |

### 1.6 ProfileScreens

| 項目     | 内容                                                                                                                                 |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **種別** | React Native 画面コンポーネント群                                                                                                    |
| **責務** | プロフィール表示・編集・Goal管理（追加・削除・優先度変更・Primary_Goal設定）・学習データリセット・**アカウント削除**の各画面UIを担う |
| **依存** | ProfileService、GoalService、AccountService（アカウント削除）、ZustandStore                                                          |

### 1.7 StatsScreens

| 項目     | 内容                                                                  |
| -------- | --------------------------------------------------------------------- |
| **種別** | React Native 画面コンポーネント群                                     |
| **責務** | Effort_Point累計・週間/月間グラフ・得意な行動パターン分析の表示を担う |
| **依存** | StatsService、ZustandStore                                      |

### 1.8 Zustand Stores

アプリ全体の共有状態を管理するZustandストア群。ドメインごとに独立したストアとして定義する。

**v1 Application Design スコープでのストア方針**:

- Application Design で確定するのは以下の3ストアのみ（グローバル状態が必要な理由が明確）
- **profileStore / goalStore / effortPointStore は Construction Phase で実装方針を決定**する。Zustand で保持するか、React Query キャッシュで代替するかは、サーバーデータの更新頻度・画面間共有要否・React Query のキャッシュ戦略を踏まえて Functional Design で決定する。本設計では「サーバー側 UserDB / ActionLogDB に永続化されるデータは画面コンポーネントから React Query でアクセス可能」であることのみ前提とする

| ストア名                | 管理する状態                                                                | Zustand採用理由                                                                 |
| ----------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **authStore**           | Amplify `useAuthenticator` から取得した User 情報（Cognito sub 等）・isAuthenticated フラグを保持 | ほぼ全画面が参照し、NavigationComponent のルーティング判定にも使用する。Amplify のフック利用でも良いが、画面ごとに `useAuthenticator` を呼ぶよりグローバルストアで集約した方がレンダリング効率が良い |
| **ticketStore**         | Open状態のAction_Ticket一覧                                                 | HomeScreenとActionTicketScreensが同じデータを共有し、Done申告後の即時反映が必要 |
| **recommendationStore** | 現在のRecommendation・recommendationState（idle/loading/active/pivot/done） | RecommendationフローがStack Navigatorをまたいで状態を保持する必要があるため     |

### 1.9 APIClient

| 項目     | 内容                                                                                                                                                                                                               |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **種別** | React Query + axios ベースのHTTPクライアントモジュール                                                                                                                                                             |
| **責務** | バックエンドAPIへのHTTPリクエスト送信・レスポンス受信・キャッシュ管理・再試行・ローディング状態管理を担う。Amplify Auth の `fetchAuthSession` を直接使用して JWT トークンを取得し、リクエストヘッダーに自動付与する |
| **依存** | AWS Amplify Auth（`fetchAuthSession` によるトークン取得）                                                                                                                                                          |

### 1.10 FrontendErrorHandler

| 項目                             | 内容                                                                                                                             |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **種別**                         | 共通エラーハンドリングモジュール                                                                                                 |
| **責務**                         | APIエラー・ネットワークエラー・Bedrockタイムアウト時のフォールバックメッセージ表示・ユーザー向けエラーメッセージの統一管理を担う |
| **フォールバックメッセージ定数** | Bedrockタイムアウト時・API障害時に使用する事前定義メッセージをconst値として保持する（状態管理ではなく静的な定数ファイル）        |

### 1.11 Amplify UI Authenticator（外部ライブラリ）

| 項目             | 内容                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **種別**         | 外部ライブラリ（`@aws-amplify/ui-react-native`）                                                                                                                                                                                                                                                                                                                                                                                                   |
| **責務**         | 認証フロー全体（サインアップ・サインイン・パスワードリセット・メール確認・セッション管理）の UI とロジックを一括提供する。App のルートコンポーネントを `<Authenticator>` でラップすることで、未認証時は認証UIを自動表示し、認証成功後にラップされた子コンポーネント（NavigationComponent）を描画する                                                                                                                                              |
| **提供機能**     | `<Authenticator>` コンポーネント、`useAuthenticator` フック（ユーザー情報・サインアウト関数を取得）                                                                                                                                                                                                                                                                                                                                                 |
| **使用箇所**     | App のルート（最上位）でラップ、authStore がマウント後に `useAuthenticator` からユーザー情報を取得し同期                                                                                                                                                                                                                                                                                                                                           |
| **備考**         | アプリ独自の認証 UI（AuthScreens）や Amplify ラッパー（AuthService）を作らず、この外部ライブラリに一本化する。**アカウント削除機能は Amplify UI が提供しないためアプリ独自の `AccountService` + `AccountLambda` で実装する**                                                                                                                                                                                                                          |

---

## 2. Backend Lambda コンポーネント

### 2.1 AccountLambda

| 項目             | 内容                                                                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **種別**         | AWS Lambda 関数                                                                                                                                              |
| **責務**         | アカウント削除処理（全データ削除→Cognito削除）を担う。サインアップ・サインイン・パスワードリセットはCognito/Amplifyが直接処理するためLambda不要              |
| **APIエンドポイント** | `DELETE /me`                                                                                                                                             |
| **依存**         | DynamoDB（UserDB・ActionLogDB）、AWS Cognito                                                                                                                 |
| **主要メソッド** | `deleteAccount` / `deleteUserData` / `deleteCognitoUser`                                                                                                     |
| **認可**         | API Gateway の Cognito Authorizer が JWT 検証を行い、Lambda は JWT claims の `sub` を userId として使用する。path userId は受け取らない                      |
| **備考**         | SimilarUserDBは匿名化済みデータのため個人特定不可。アカウント削除対象外（個人情報保護法上も削除不要）                                                        |

### 2.2 UserLambda

| 項目                  | 内容                                                                                                                                                                                                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **種別**              | AWS Lambda 関数                                                                                                                                                                                                                                                                             |
| **責務**              | Profile（取得・更新・更新履歴）とGoal（一覧・追加・更新・削除・Primary_Goal設定・優先度変更・昇格候補取得）のCRUD処理を担う。ProfileとGoalはどちらもUserに紐づき同じUserDBを参照するため統合する                                                                                             |
| **APIエンドポイント** | `GET /me/profile`、`PUT /me/profile`、`GET /me/profile/suggestions`、`GET /me/profile/history`、`GET /me/goals`、`POST /me/goals`、`PUT /me/goals/{goalId}`、`DELETE /me/goals/{goalId}`、`POST /me/goals/generate`、`GET /me/goals/promotion-candidates`、`POST /me/goals/{goalId}/promote` |
| **依存**              | DynamoDB（UserDB）、Amazon Bedrock（プロフィール登録時のAIサジェスト・Pivot_Goal自動生成）                                                                                                                                                                                                  |
| **主要メソッド**      | `getProfile` / `updateProfile` / `getProfileUpdateHistory` / `getProfileInputSuggestion` / `generateInitialPivotGoals` / `getGoals` / `createGoal` / `updateGoal` / `deleteGoal` / `setPrimaryGoal` / `updateGoalPriority` / `getPromotionCandidates` / `promoteCandidate`                  |
| **認可**              | JWT claims の `sub` を userId として使用（path には userId を含まない）                                                                                                                                                                                                                     |

### 2.3 ActionTicketLambda

| 項目                  | 内容                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **種別**              | AWS Lambda 関数                                                                                                                                                                                                                                                                                                                                                        |
| **責務**              | Action_Ticketの生成・一覧取得・Done申告・破棄履歴取得を担う。Done申告時にAction_LogへのリアルタイムWrite・Effort_Point計算・付与・マイルストーン判定をこのLambda内で完結して処理する。UserDBは参照しない（goalId等の関連情報はActionTicket自体が保持）                                                                                                                  |
| **APIエンドポイント** | `POST /me/tickets`（生成）、`GET /me/tickets`（一覧）、`PUT /me/tickets/{ticketId}/complete`（Done申告）、`GET /me/tickets/expired`（破棄履歴）                                                                                                                                                                                                                        |
| **依存**              | DynamoDB（ActionLogDB）                                                                                                                                                                                                                                                                                                                                                |
| **主要メソッド**      | `createTicket` / `getOpenTickets` / `completeTicket` / `getExpiredTicketHistory` / `calculatePoints`（純粋関数・PBT対象）/ `checkMilestone`                                                                                                                                                                                                                            |
| **認可**              | JWT claims の `sub` を userId として使用                                                                                                                                                                                                                                                                                                                               |

### 2.4 RecommendationLambda

| 項目                  | 内容                                                                                                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **種別**              | AWS Lambda 関数                                                                                                                                                                      |
| **責務**              | Trigger発火時のRecommendation生成・Pivot提案・ActionStep生成をAmazon Bedrockを使用して行う。Action_Log件数に応じてデフォルト/パーソナライズプロンプトを切り替える                    |
| **APIエンドポイント** | `POST /me/recommendations`（Recommendation生成）、`POST /me/recommendations/pivot`（Pivot提案）、`POST /me/recommendations/action-steps`（ActionStep生成）                            |
| **依存**              | DynamoDB（UserDB・ActionLogDB・SimilarUserDB）、Amazon Bedrock                                                                                                                       |
| **主要メソッド**      | `generateRecommendation` / `generatePivotRecommendation` / `generateActionSteps` / `selectPromptStrategy`                                                                            |
| **認可**              | JWT claims の `sub` を userId として使用                                                                                                                                             |

### 2.5 StatsLambda

| 項目                  | 内容                                                                                                                                                                                                                              |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **種別**              | AWS Lambda 関数                                                                                                                                                                                                                   |
| **責務**              | 集計データの取得APIを提供する。StatsScreensのグラフ表示・HomeScreenのEffort_Pointサマリー表示・破棄メッセージ取得に使用する                                                                                                       |
| **APIエンドポイント** | `GET /me/stats/daily`、`GET /me/stats/weekly`、`GET /me/stats/monthly`、`GET /me/stats/total-points`、`GET /me/stats/latest-discard-message`（最新の破棄メッセージ取得）                                                           |
| **依存**              | DynamoDB（ActionLogDB）                                                                                                                                                                                                           |
| **主要メソッド**      | `getDailySummary` / `getWeeklySummary` / `getMonthlySummary` / `getTotalPoints` / `getLatestDiscardMessage`                                                                                                                       |
| **認可**              | JWT claims の `sub` を userId として使用                                                                                                                                                                                          |

### 2.6 BackendErrorHandler

| 項目             | 内容                                                                                                                                                                              |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **種別**         | 共通Lambdaミドルウェア/ユーティリティモジュール                                                                                                                                   |
| **責務**         | 全Lambda（APIおよびバッチ）共通のエラーハンドリング（Bedrockタイムアウト・DynamoDB障害・バリデーションエラー）とフォールバックレスポンス生成、JWT claims からの userId 取得を担う |
| **主要メソッド** | `withErrorHandling` / `getUserIdFromToken` / `handleBedrockError` / `handleDynamoDBError` / `createErrorResponse`                                                                 |

---

## 3. バッチ処理コンポーネント（EventBridge Scheduler 配下）

EventBridge Scheduler がスケジュール起動する Lambda 群。API Gateway を介さないため Cognito Authorizer による認可の対象外となる。全ユーザーをループ処理する。

### 3.1 DailyAggregationLambda

| 項目             | 内容                                                                                                                                                                              |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **種別**         | AWS Lambda 関数（日次バッチ）                                                                                                                                                     |
| **責務**         | 日次バッチ処理を担う。EventBridgeから毎日0時に起動し、Open状態のAction_Ticketを自動破棄してDailySummaryを生成・集計する                                                           |
| **トリガー**     | EventBridge Scheduler（毎日0時）                                                                                                                                                  |
| **依存**         | DynamoDB（ActionLogDB）                                                                                                                                                           |
| **主要メソッド** | `runDailyBatch`（全ユーザーをループ）/ `expireTickets`（ActionTicketの自動破棄）/ `runDailyAggregation`（DailySummary集計）/ `buildDiscardMessage`（破棄メッセージ生成）         |
| **認可**         | API Gateway を介さないため Cognito Authorizer 対象外。EventBridge の実行ロールで起動される                                                                                        |
| **備考**         | 破棄メッセージ本文はDailySummary集計時にまとめて生成し、DailySummary に `discardMessage` フィールドとして保持する。次回アプリ起動時にフロント（HomeScreen）が当該日の DailySummary を StatsLambda 経由で読み取り、上部バナー/ダイアログで表示する（FR-13-5/FR-13-6） |

### 3.2 LearningEngineLambda

| 項目             | 内容                                                                                                                                                                                                                                                                    |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **種別**         | AWS Lambda 関数（週次バッチ）                                                                                                                                                                                                                                           |
| **責務**         | 週次バッチ処理として全ユーザーのAction_Logを解析し、行動モデル（時間帯・曜日パターン・Yes/No傾向・actionLevel傾向・Goal選択傾向）を構築・更新する。Amazon Bedrockを使用してパーソナライズモデルを生成し、UserDBのBehaviorModelを更新する。Future_Self_Modelの更新も担う |
| **トリガー**     | EventBridge Scheduler（毎週月曜0時）                                                                                                                                                                                                                                    |
| **依存**         | DynamoDB（UserDB・ActionLogDB）、Amazon Bedrock                                                                                                                                                                                                                         |
| **主要メソッド** | `runWeeklyBatch` / `buildBehaviorModel` / `updateProfileBehaviorTrends` / `updateFutureSelfModel` / `checkPivotGoalPromotion`（Pivot_Goal昇格候補フラグ更新）/ `analyzeStrengthPatterns`                                                                                |
| **認可**         | API Gateway を介さないため Cognito Authorizer 対象外。EventBridge の実行ロールで起動される                                                                                                                                                                              |

---

## 4. データストアコンポーネント

### 4.1 UserDB（DynamoDB テーブル）

| 項目             | 内容                                                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **種別**         | AWS DynamoDB テーブル                                                                                                            |
| **責務**         | ユーザー関連データの永続化。User・Profile・ProfileUpdateHistory・Goal・TriggerSettings・FutureSelfModel・BehaviorModelを格納する |
| **キャパシティ** | オンデマンドモード                                                                                                               |
| **格納エンティティと型定義参照** | 以下のエンティティを格納。型定義は [component-methods.md — UserDB 格納エンティティ型定義](./component-methods.md#userdb-格納エンティティ型定義) を参照。<br>・`User`（Cognito sub を主キーとするユーザールート）<br>・`Profile`（ニックネーム・年齢・職業・興味・生活リズム・悩み・behaviorTrends・strengthPatterns）<br>・`ProfileUpdateHistory`（更新履歴）<br>・`Goal`（isPrimary・priority・isAIGenerated・promotionCandidate）<br>・`TriggerSettings`（手動Trigger設定・v2以降で位置情報Triggerを拡張）<br>・`FutureSelfModel`（Similar_User_Data由来のモデル。v1はモック）<br>・`BehaviorModel`（週次バッチで構築される行動モデル）     |

### 4.2 ActionLogDB（DynamoDB テーブル）

| 項目             | 内容                                                                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **種別**         | AWS DynamoDB テーブル                                                                                                              |
| **責務**         | 行動ログ関連データの永続化。ActionLogEntry（誰が・いつ・どのチケットをどうしたか）・ActionTicket・EffortPointRecord・DailySummary・Milestoneを格納する |
| **キャパシティ** | オンデマンドモード                                                                                                                 |
| **格納エンティティと型定義参照** | 以下のエンティティを格納。型定義は [component-methods.md — ActionLogDB 格納エンティティ型定義](./component-methods.md#actionlogdb-格納エンティティ型定義) を参照。<br>・`ActionLogEntry`（userId・ticketId・actionType=done/expire・timestamp。誰がどのチケットをどうしたかを記録）<br>・`ActionTicket`（ticketId・userId・goalId・goalType・actionLevel・content・status）<br>・`EffortPointRecord`（userId・points・earnedAt）<br>・`DailySummary`（date・totalPoints・completedTickets・expiredTickets・discardMessage）<br>・`Milestone`（userId・milestoneValue・reachedAt） |

### 4.3 SimilarUserDB（DynamoDB テーブル）

| 項目             | 内容                                                                                                        |
| ---------------- | ----------------------------------------------------------------------------------------------------------- |
| **種別**         | AWS DynamoDB テーブル                                                                                       |
| **責務**         | 類似ユーザーデータの永続化。SimilarUserDataレコードを格納する（v1はモックデータのみ。実データ収集はv2以降） |
| **キャパシティ** | オンデマンドモード                                                                                          |
| **格納エンティティと型定義参照** | 型定義は [component-methods.md — SimilarUserDB 格納エンティティ型定義](./component-methods.md#similaruserdb-格納エンティティ型定義) を参照。v1 ではこのテーブルにアクセスする Lambda は `RecommendationLambda` のみで、事前に投入したモックデータを読み取る（書き込みなし）                                                                                        |

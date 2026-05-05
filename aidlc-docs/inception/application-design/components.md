# コンポーネント定義 — だが、それでいい（DagaSoreDeIi_App）

## 概要

本ドキュメントはシステムを構成するアーキテクチャコンポーネントの一覧と責務を定義する。
UIパーツではなく、機能的な責務単位（モジュール・サービス・レイヤー）として定義する。

---

## レイヤー構成

```
┌─────────────────────────────────────────────────────┐
│              Mobile Frontend (React Native)          │
│  Screens / Navigation / State / API Client           │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS / REST
┌──────────────────────▼──────────────────────────────┐
│              API Gateway (AWS)                       │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│              Backend Lambda Functions (AWS)          │
│  Auth / Profile+Goal / ActionTicket / Recommendation │
│  EffortPoint / LearningEngine(Batch)                 │
└──────┬───────────────┬──────────────────────────────┘
       │               │
┌──────▼──────┐  ┌─────▼──────────────────────────────┐
│  DynamoDB   │  │  Amazon Bedrock                     │
│  UserDB     │  │  (Recommendation / Persona_Message) │
│  ActionLogDB│  └────────────────────────────────────┘
│  SimilarDB  │
└─────────────┘
```

---

## 1. Mobile Frontend コンポーネント

### 1.1 NavigationComponent

| 項目                 | 内容                                                                                                                                                                                                |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **種別**             | React Navigation 設定モジュール                                                                                                                                                                     |
| **責務**             | アプリ全体の画面遷移を管理する。Bottom Tab Navigator（ホーム・チケット・プロフィール・統計）+ Stack Navigator（認証フロー・オンボーディング・Recommendationフロー）の構成を定義する                 |
| **主要画面グループ** | AuthStack（ログイン・登録・パスワードリセット）、OnboardingStack（プロフィール登録）、MainTab（ホーム・チケット一覧・プロフィール・統計）、RecommendationStack（Recommendation・Pivot・ActionStep） |

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

| 項目     | 内容                                                                                       |
| -------- | ------------------------------------------------------------------------------------------ |
| **種別** | React Native 画面コンポーネント群                                                          |
| **責務** | Recommendation表示・4択応答ボタン・Pivot提案・ActionStep表示・心理状態入力の各画面UIを担う |
| **依存** | RecommendationService、ActionTicketService、ZustandStore                                   |

### 1.6 ActionTicketScreens

| 項目     | 内容                                                        |
| -------- | ----------------------------------------------------------- |
| **種別** | React Native 画面コンポーネント群                           |
| **責務** | Action_Ticket一覧（Open/Done/破棄）の表示・完了申告UIを担う |
| **依存** | ActionTicketService、ZustandStore                           |

### 1.7 ProfileScreens

| 項目     | 内容                                                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **種別** | React Native 画面コンポーネント群                                                                                              |
| **責務** | プロフィール表示・編集・Goal管理（追加・削除・優先度変更・Primary_Goal設定）・更新履歴閲覧・学習データリセットの各画面UIを担う |
| **依存** | ProfileService、GoalService、ZustandStore                                                                                      |

### 1.8 StatsScreens

| 項目     | 内容                                                                  |
| -------- | --------------------------------------------------------------------- |
| **種別** | React Native 画面コンポーネント群                                     |
| **責務** | Effort_Point累計・週間/月間グラフ・得意な行動パターン分析の表示を担う |
| **依存** | EffortPointService、ZustandStore                                      |

### 1.9 ZustandStore

| 項目         | 内容                                                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| **種別**     | Zustand グローバル状態管理モジュール                                                                                           |
| **責務**     | アプリ全体の共有状態（認証状態・現在のUser/Profile/Goal・Open Action_Tickets・Effort_Point累計・Recommendation状態）を管理する |
| **スライス** | authSlice、profileSlice、goalSlice、ticketSlice、recommendationSlice、effortPointSlice                                         |

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

| 項目                               | 内容                                                                                                                             |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **種別**                           | 共通エラーハンドリングモジュール                                                                                                 |
| **責務**                           | APIエラー・ネットワークエラー・Bedrockタイムアウト時のフォールバックメッセージ表示・ユーザー向けエラーメッセージの統一管理を担う |
| **フォールバックメッセージストア** | Bedrockタイムアウト時・API障害時の事前定義メッセージを保持する                                                                   |

---

## 2. Backend Lambda コンポーネント

### 2.1 AuthLambda

| 項目         | 内容                                                                                                                                                 |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **種別**     | AWS Lambda 関数                                                                                                                                      |
| **責務**     | アカウント削除処理（確認→全データ削除→Cognito削除）を担う。サインアップ・サインイン・パスワードリセットはCognito/Amplifyが直接処理するためLambda不要 |
| **トリガー** | API Gateway DELETE /users/{userId}                                                                                                                   |
| **依存**     | DynamoDB（UserDB・ActionLogDB・SimilarUserDB）、AWS Cognito                                                                                          |

### 2.2 ProfileGoalLambda

| 項目         | 内容                                                                                                                                                                 |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **種別**     | AWS Lambda 関数                                                                                                                                                      |
| **責務**     | Profile（取得・更新・更新履歴）とGoal（一覧・追加・更新・削除・Primary_Goal設定・優先度変更）のCRUD処理を担う。ProfileとGoalはアクセスリソース単位が近いため統合する |
| **トリガー** | API Gateway /profiles/{userId}、/goals/{userId}                                                                                                                      |
| **依存**     | DynamoDB（UserDB）、Amazon Bedrock（プロフィール登録時のAIサジェスト・Pivot_Goal自動生成）                                                                           |

### 2.3 ActionTicketLambda

| 項目         | 内容                                                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **種別**     | AWS Lambda 関数                                                                                                                                    |
| **責務**     | Action_Ticketの生成・一覧取得・Done申告・自動破棄処理・破棄履歴取得を担う。Done申告時にAction_LogへのリアルタイムWrite・Effort_Point付与を連携する |
| **トリガー** | API Gateway /tickets/{userId}、EventBridge（日次集計タイミングでの自動破棄）                                                                       |
| **依存**     | DynamoDB（UserDB・ActionLogDB）、EffortPointLambda（Done時に連携）                                                                                 |

### 2.4 RecommendationLambda

| 項目         | 内容                                                                                                                                                              |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **種別**     | AWS Lambda 関数                                                                                                                                                   |
| **責務**     | Trigger発火時のRecommendation生成・Pivot提案・ActionStep生成をAmazon Bedrockを使用して行う。Action_Log件数に応じてデフォルト/パーソナライズプロンプトを切り替える |
| **トリガー** | API Gateway POST /recommendations/{userId}                                                                                                                        |
| **依存**     | DynamoDB（UserDB・ActionLogDB）、Amazon Bedrock                                                                                                                   |

### 2.5 EffortPointLambda

| 項目         | 内容                                                                                                                          |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| **種別**     | AWS Lambda 関数                                                                                                               |
| **責務**     | Effort_Point付与（goalType/actionLevelに応じた計算）・累計管理・日次サマリー生成・週間/月間集計・マイルストーン達成判定を担う |
| **トリガー** | ActionTicketLambdaからの内部呼び出し、EventBridge（日次集計タイミング）                                                       |
| **依存**     | DynamoDB（ActionLogDB）                                                                                                       |

### 2.6 LearningEngineLambda

| 項目         | 内容                                                                                                                                                                                                                                                                    |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **種別**     | AWS Lambda 関数（週次バッチ）                                                                                                                                                                                                                                           |
| **責務**     | 週次バッチ処理として全ユーザーのAction_Logを解析し、行動モデル（時間帯・曜日パターン・Yes/No傾向・actionLevel傾向・Goal選択傾向）を構築・更新する。Amazon Bedrockを使用してパーソナライズモデルを生成し、UserDBのBehaviorModelを更新する。Future_Self_Modelの更新も担う |
| **トリガー** | EventBridge（毎週月曜0時）                                                                                                                                                                                                                                              |
| **依存**     | DynamoDB（UserDB・ActionLogDB）、Amazon Bedrock                                                                                                                                                                                                                         |

### 2.7 BackendErrorHandler

| 項目     | 内容                                                                                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **種別** | 共通Lambdaミドルウェア/ユーティリティモジュール                                                                                                                           |
| **責務** | 全Lambda共通のエラーハンドリング（Bedrockタイムアウト・DynamoDB障害・バリデーションエラー）とフォールバックレスポンス生成を担う。各Lambdaから共通モジュールとして使用する |

---

## 3. データストアコンポーネント

### 3.1 UserDB（DynamoDB テーブル）

| 項目             | 内容                                                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **種別**         | AWS DynamoDB テーブル                                                                                                            |
| **責務**         | ユーザー関連データの永続化。User・Profile・ProfileUpdateHistory・Goal・TriggerSettings・FutureSelfModel・BehaviorModelを格納する |
| **キャパシティ** | オンデマンドモード                                                                                                               |

### 3.2 ActionLogDB（DynamoDB テーブル）

| 項目             | 内容                                                                                                           |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| **種別**         | AWS DynamoDB テーブル                                                                                          |
| **責務**         | 行動ログ関連データの永続化。ActionLogEntry・ActionTicket・EffortPointRecord・DailySummary・Milestoneを格納する |
| **キャパシティ** | オンデマンドモード                                                                                             |

### 3.3 SimilarUserDB（DynamoDB テーブル）

| 項目             | 内容                                                                                                        |
| ---------------- | ----------------------------------------------------------------------------------------------------------- |
| **種別**         | AWS DynamoDB テーブル                                                                                       |
| **責務**         | 類似ユーザーデータの永続化。SimilarUserDataレコードを格納する（v1はモックデータのみ。実データ収集はv2以降） |
| **キャパシティ** | オンデマンドモード                                                                                          |

---

## 4. 外部サービスコンポーネント

### 4.1 CognitoUserPool

| 項目     | 内容                                                                                                                   |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| **種別** | AWS Cognito User Pool                                                                                                  |
| **責務** | ユーザー認証・セッション管理・メール確認・パスワードリセットを担う。Amplify Authを通じてフロントエンドから直接操作する |

### 4.2 BedrockClient

| 項目     | 内容                                                                                                                                                                                 |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **種別** | Amazon Bedrock API                                                                                                                                                                   |
| **責務** | LLMによるRecommendation生成・Persona_Message生成・プロフィールAIサジェスト・Pivot_Goal自動生成・行動モデル構築を担う。各LambdaからAWS SDK v3経由で直接呼び出す（タイムアウト: 10秒） |

### 4.3 EventBridgeScheduler

| 項目     | 内容                                                                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **種別** | Amazon EventBridge Scheduler                                                                                                                               |
| **責務** | 定期実行トリガーを管理する。LearningEngineLambda（毎週月曜0時）・ActionTicketLambda自動破棄（ユーザー設定の集計時刻）・EffortPointLambda日次集計を発火する |

---

## コンポーネント一覧サマリー

| #   | コンポーネント          | レイヤー     | 種別                 |
| --- | ----------------------- | ------------ | -------------------- |
| 1   | NavigationComponent     | Frontend     | React Navigation     |
| 2   | AuthScreens             | Frontend     | 画面群               |
| 3   | OnboardingScreens       | Frontend     | 画面群               |
| 4   | HomeScreen              | Frontend     | 画面                 |
| 5   | RecommendationScreens   | Frontend     | 画面群               |
| 6   | ActionTicketScreens     | Frontend     | 画面群               |
| 7   | ProfileScreens          | Frontend     | 画面群               |
| 8   | StatsScreens            | Frontend     | 画面群               |
| 9   | ZustandStore            | Frontend     | 状態管理             |
| 10  | APIClient               | Frontend     | HTTPクライアント     |
| 11  | AuthService（Frontend） | Frontend     | Amplifyラッパー      |
| 12  | FrontendErrorHandler    | Frontend     | 共通エラー処理       |
| 13  | AuthLambda              | Backend      | Lambda               |
| 14  | ProfileGoalLambda       | Backend      | Lambda               |
| 15  | ActionTicketLambda      | Backend      | Lambda               |
| 16  | RecommendationLambda    | Backend      | Lambda               |
| 17  | EffortPointLambda       | Backend      | Lambda               |
| 18  | LearningEngineLambda    | Backend      | Lambda（週次バッチ） |
| 19  | BackendErrorHandler     | Backend      | 共通ミドルウェア     |
| 20  | UserDB                  | データストア | DynamoDB             |
| 21  | ActionLogDB             | データストア | DynamoDB             |
| 22  | SimilarUserDB           | データストア | DynamoDB             |
| 23  | CognitoUserPool         | 外部サービス | AWS Cognito          |
| 24  | BedrockClient           | 外部サービス | Amazon Bedrock       |
| 25  | EventBridgeScheduler    | 外部サービス | EventBridge          |

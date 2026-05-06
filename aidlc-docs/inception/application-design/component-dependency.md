# コンポーネント依存関係 — だが、それでいい（DagaSoreDeIi_App）

## 概要

本ドキュメントは各コンポーネント間の依存関係と、主要ユースケースのデータフローを定義する。
「どのコンポーネントが何に依存しているか」「あるユースケースでデータがどう流れるか」を確認したいときに参照する。
コンポーネントの責務定義は [components.md](./components.md)、アーキテクチャ全体像は [application-design.md](./application-design.md) を参照。

## 目次

- [依存関係マトリクス](#依存関係マトリクス)
- [データフロー図](#データフロー図)
  - [1. 初期起動フロー（新規ユーザー）](#1-初期起動フロー新規ユーザー)
  - [2. アプリ起動フロー（既存ユーザー）](#2-アプリ起動フロー既存ユーザー)
  - [3. Recommendation生成フロー](#3-recommendation生成フロー)
  - [4. Done申告フロー](#4-done申告フロー)
  - [5. 日次集計・自動破棄フロー](#5-日次集計自動破棄フロー)
  - [6. 週次バッチフロー](#6-週次バッチフロー)
  - [7. アカウント削除フロー](#7-アカウント削除フロー)
- [通信パターン](#通信パターン)
- [循環依存の排除](#循環依存の排除)

---

## 依存関係マトリクス

| コンポーネント           | 依存先                                                                         |
| ------------------------ | ------------------------------------------------------------------------------ |
| AuthScreens              | AuthService(FE), NavigationComponent                                           |
| OnboardingScreens        | useProfileService, useGoalService, NavigationComponent                         |
| HomeScreen               | useTriggerService, useActionTicketService, useEffortPointService, ZustandStore |
| RecommendationScreens    | useRecommendationService, useActionTicketService, ZustandStore                 |
| ActionTicketScreens      | useActionTicketService, ZustandStore                                           |
| ProfileScreens           | useProfileService, useGoalService, ZustandStore                                |
| StatsScreens             | useEffortPointService, ZustandStore                                            |
| useAuthService           | AuthService(FE), APIClient, ZustandStore                                       |
| useProfileService        | APIClient, ZustandStore                                                        |
| useGoalService           | APIClient, ZustandStore                                                        |
| useTriggerService        | APIClient, ZustandStore                                                        |
| useRecommendationService | APIClient, ZustandStore                                                        |
| useActionTicketService   | APIClient, ZustandStore                                                        |
| useEffortPointService    | APIClient, ZustandStore                                                        |
| AuthService(FE)          | AWS Amplify Auth, CognitoUserPool                                              |
| APIClient                | AuthService(FE)（JWTトークン取得）                                             |
| AccountLambda            | UserDB, ActionLogDB, SimilarUserDB, CognitoUserPool                            |
| UserLambda               | UserDB, BedrockClient, BackendErrorHandler                                     |
| ActionTicketLambda       | ActionLogDB, BackendErrorHandler                                               |
| RecommendationLambda     | UserDB, ActionLogDB, BedrockClient, BackendErrorHandler                        |
| DailyAggregationLambda   | ActionLogDB, BackendErrorHandler                                               |
| StatsLambda              | ActionLogDB, BackendErrorHandler                                               |
| LearningEngineLambda     | UserDB, ActionLogDB, BedrockClient, BackendErrorHandler                        |
| EventBridgeScheduler     | LearningEngineLambda, DailyAggregationLambda                                   |

---

## データフロー図

### 1. 初期起動フロー（新規ユーザー）

```
AuthScreens（新規登録）
  → useAuthService.signUp()
    → AuthService(FE) → CognitoUserPool（アカウント作成）
    ← SignUpResult
  → AuthScreens（メール確認コード入力）
  → useAuthService.confirmSignUp()
    → AuthService(FE) → CognitoUserPool（メール確認）
  → useAuthService.signIn()
    → AuthService(FE) → CognitoUserPool（サインイン）
    → ZustandStore.authSlice.setUser()
  → OnboardingScreens（プロフィール登録）
    → useProfileService.getProfileSuggestion()
      → APIClient GET /users/{userId}/profiles/suggestions
        → API Gateway → UserLambda → BedrockClient（AIサジェスト）
    → useProfileService.updateProfile()
      → APIClient PUT /users/{userId}/profiles
        → API Gateway → UserLambda → UserDB（Profile書き込み）
    → useGoalService.generateInitialPivotGoals()
      → APIClient POST /users/{userId}/goals/generate
        → API Gateway → UserLambda → BedrockClient（Pivot_Goal自動生成）
        → UserLambda → UserDB（Goal書き込み）
  → NavigationComponent → MainTab（ホーム）
```

### 2. アプリ起動フロー（既存ユーザー）

```
App起動
  → useAuthService.getCurrentSession()
    → AuthService(FE) → CognitoUserPool（セッション確認）
    → 未認証: AuthScreensへ遷移
    → 認証済み: ZustandStore.authSlice.setUser()
  → useProfileService.getProfile()
    → APIClient GET /users/{userId}/profiles
      → API Gateway → UserLambda → UserDB（Profile取得）
    → プロフィール未完了: OnboardingScreensへ遷移
    → 完了: useActionTicketService.getOpenTickets()
      → APIClient GET /tickets/{userId}
        → API Gateway → ActionTicketLambda → ActionLogDB（Open Ticket取得）
      → Open Ticket 0件: 自動Trigger発火 → Recommendationフローへ
      → Open Ticket あり: HomeScreenへ遷移
```

### 3. Recommendation生成フロー

```
HomeScreen
  → useTriggerService（手動/自動Trigger）
    → APIClient POST /recommendations/{userId}
      → API Gateway
        → RecommendationLambda
          → UserDB（Profile・Goal・BehaviorModel取得）
          → ActionLogDB（Action_Log件数確認・直近ログ取得）
          → BedrockClient（Recommendation生成）
          ← Recommendation（Persona_Messageトーン）
      ← Recommendation
    ← Recommendation
  → ZustandStore.recommendationSlice
  → RecommendationScreens（表示）
```

### 4. Done申告フロー

```
ActionTicketScreens / HomeScreen
  → useActionTicketService.completeTicket()
    → APIClient PUT /tickets/{userId}/{ticketId}/complete
      → API Gateway
        → ActionTicketLambda
          → ActionLogDB（ActionLogEntry書き込み・リアルタイム）
          → ActionTicketLambda.calculatePoints()（ポイント計算）
          → ActionLogDB（EffortPointRecord書き込み）
          → ActionTicketLambda.checkMilestone()（マイルストーン判定）
          ← CompleteTicketResult { ticket, pointsAwarded, totalPoints, milestoneReached }
      ← CompleteTicketResult
    ← CompleteTicketResult
  → ZustandStore更新（ticketSlice, effortPointSlice）
  → Persona_Message表示
```

### 5. 日次集計・自動破棄フロー

```
EventBridgeScheduler（ユーザー設定の集計時刻）
  → DailyAggregationLambda.expireTickets()
    → ActionLogDB（Open Ticketを破棄ステータスに更新）
    ← ExpireTicketsResult（破棄件数・Done件数）
  → DailyAggregationLambda.runDailyAggregation()
    → ActionLogDB（DailySummary書き込み・集計）
  ※ 破棄メッセージ（Persona_Messageトーン）は次回アプリ起動時にフロントエンドが表示
```

### 6. 週次バッチフロー

```
EventBridgeScheduler（毎週月曜0時）
  → LearningEngineLambda.runWeeklyBatch()
    → ActionLogDB（全ユーザーAction_Log取得）
    → UserDB（Profile・Goal取得）
    → BedrockClient（行動モデル構築・Future_Self_Model更新）
    → UserDB（BehaviorModel・FutureSelfModel書き込み）
    → UserDB（Profile.behaviorTrends更新）
    → UserDB（Pivot_Goal昇格候補フラグ更新）
```

### 7. アカウント削除フロー

```
ProfileScreens（アカウント削除ボタン）
  → 確認ダイアログ表示
  → useAuthService.deleteAccount()
    → APIClient DELETE /users/{userId}
      → API Gateway
        → AccountLambda
          → UserDB（User・Profile・ProfileUpdateHistory・Goal・TriggerSettings・FutureSelfModel・BehaviorModel 削除）
          → ActionLogDB（ActionLogEntry・ActionTicket・EffortPointRecord・DailySummary・Milestone 削除）
          → CognitoUserPool（ユーザー削除）
          ← DeleteAccountResult
      ← DeleteAccountResult
  → ZustandStore.clearAuth()
  → AuthScreens（ログイン画面）へ遷移
```

---

## 通信パターン

| パターン                     | 使用箇所                                                                   |
| ---------------------------- | -------------------------------------------------------------------------- |
| **同期REST（HTTPS）**        | Frontend → API Gateway → Lambda（全通常API）                               |
| **Lambda内部呼び出し**       | なし                                                                       |
| **EventBridge スケジュール** | 週次バッチ（LearningEngine）・日次バッチ（DailyAggregation）               |
| **Amplify Auth直接**         | Frontend → CognitoUserPool（サインアップ・サインイン・パスワードリセット） |

---

## 循環依存の排除

- Frontend サービス層はすべて APIClient を経由してバックエンドと通信する（直接Lambda呼び出しなし）
- Lambda間の直接呼び出しはなし
- EventBridgeトリガーのバッチ処理（DailyAggregationLambda・LearningEngineLambda）とAPI処理（その他Lambda）は完全に分離
- LearningEngineLambda は完全に非同期バッチ処理であり、他のLambdaから呼び出されない
- ZustandStore はサービス層から更新され、画面コンポーネントから読み取る（単方向データフロー）

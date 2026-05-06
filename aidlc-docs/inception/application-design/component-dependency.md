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

```mermaid
sequenceDiagram
    actor User
    participant AuthScreens
    participant AuthService
    participant Cognito as CognitoUserPool
    participant OnboardingScreens
    participant UserLambda
    participant Bedrock as BedrockClient
    participant UserDB

    User->>AuthScreens: 新規登録
    AuthScreens->>AuthService: signUp()
    AuthService->>Cognito: アカウント作成
    Cognito-->>AuthScreens: 確認メール送信
    User->>AuthScreens: 確認コード入力
    AuthScreens->>AuthService: confirmSignUp()
    AuthService->>Cognito: メール確認
    AuthScreens->>AuthService: signIn()
    AuthService->>Cognito: サインイン
    Cognito-->>AuthService: JWTトークン
    AuthService-->>AuthScreens: 認証完了 → authStore更新

    AuthScreens->>OnboardingScreens: オンボーディングへ遷移
    OnboardingScreens->>UserLambda: GET /users/{userId}/profiles/suggestions
    UserLambda->>Bedrock: AIサジェスト生成
    Bedrock-->>UserLambda: サジェスト候補
    UserLambda-->>OnboardingScreens: サジェスト候補

    OnboardingScreens->>UserLambda: PUT /users/{userId}/profiles
    UserLambda->>UserDB: Profile書き込み
    UserDB-->>UserLambda: OK
    UserLambda-->>OnboardingScreens: Profile

    OnboardingScreens->>UserLambda: POST /users/{userId}/goals/generate
    UserLambda->>Bedrock: Pivot_Goal自動生成
    Bedrock-->>UserLambda: Pivot_Goal候補
    UserLambda->>UserDB: Goal書き込み
    UserLambda-->>OnboardingScreens: Goal一覧
    OnboardingScreens-->>User: MainTabへ遷移
```

### 2. アプリ起動フロー（既存ユーザー）

```mermaid
sequenceDiagram
    actor User
    participant App
    participant AuthService
    participant Cognito as CognitoUserPool
    participant UserLambda
    participant UserDB
    participant ActionTicketLambda
    participant ActionLogDB

    User->>App: アプリ起動
    App->>AuthService: getCurrentSession()
    AuthService->>Cognito: セッション確認
    alt 未認証
        Cognito-->>App: 未認証
        App-->>User: AuthScreensへ遷移
    else 認証済み
        Cognito-->>AuthService: JWTトークン
        AuthService-->>App: authStore更新
        App->>UserLambda: GET /users/{userId}/profiles
        UserLambda->>UserDB: Profile取得
        UserDB-->>UserLambda: Profile
        UserLambda-->>App: Profile
        alt プロフィール未完了
            App-->>User: OnboardingScreensへ遷移
        else 完了
            App->>ActionTicketLambda: GET /tickets/{userId}
            ActionTicketLambda->>ActionLogDB: Open Ticket取得
            ActionLogDB-->>ActionTicketLambda: Ticket一覧
            ActionTicketLambda-->>App: Ticket一覧
            alt Open Ticket 0件
                App-->>User: 自動Trigger → Recommendationフローへ
            else Open Ticketあり
                App-->>User: HomeScreenへ遷移
            end
        end
    end
```

### 3. Recommendation生成フロー

```mermaid
sequenceDiagram
    actor User
    participant HomeScreen
    participant RecommendationLambda
    participant UserDB
    participant ActionLogDB
    participant Bedrock as BedrockClient
    participant RecommendationScreens

    User->>HomeScreen: Triggerボタンタップ（または自動Trigger）
    HomeScreen->>RecommendationLambda: POST /recommendations/{userId}
    RecommendationLambda->>UserDB: Profile・Goal・BehaviorModel取得
    UserDB-->>RecommendationLambda: ユーザーデータ
    RecommendationLambda->>ActionLogDB: Action_Log件数確認・直近ログ取得
    ActionLogDB-->>RecommendationLambda: Action_Log
    RecommendationLambda->>Bedrock: Recommendation生成
    Bedrock-->>RecommendationLambda: Recommendation（Persona_Messageトーン）
    RecommendationLambda-->>HomeScreen: Recommendation
    HomeScreen->>RecommendationScreens: recommendationStore更新 → 画面遷移
    RecommendationScreens-->>User: Recommendation表示
```

### 4. Done申告フロー

```mermaid
sequenceDiagram
    actor User
    participant Screen as ActionTicketScreens/HomeScreen
    participant ActionTicketLambda
    participant ActionLogDB

    User->>Screen: Done申告
    Screen->>ActionTicketLambda: PUT /tickets/{userId}/{ticketId}/complete
    ActionTicketLambda->>ActionLogDB: ActionLogEntry書き込み（リアルタイム）
    ActionTicketLambda->>ActionTicketLambda: calculatePoints()
    ActionTicketLambda->>ActionLogDB: EffortPointRecord書き込み
    ActionTicketLambda->>ActionTicketLambda: checkMilestone()
    ActionLogDB-->>ActionTicketLambda: OK
    ActionTicketLambda-->>Screen: CompleteTicketResult { ticket, pointsAwarded, totalPoints, milestoneReached }
    Screen->>Screen: ticketStore・effortPointStore更新
    Screen-->>User: Persona_Message表示（ポイント + 達成メッセージ）
```

### 5. 日次集計・自動破棄フロー

```mermaid
sequenceDiagram
    participant EventBridge as EventBridgeScheduler
    participant DailyAggregationLambda
    participant ActionLogDB

    EventBridge->>DailyAggregationLambda: 集計時刻トリガー
    DailyAggregationLambda->>ActionLogDB: Open Ticketを破棄ステータスに更新
    ActionLogDB-->>DailyAggregationLambda: ExpireTicketsResult（破棄件数・Done件数）
    DailyAggregationLambda->>ActionLogDB: DailySummary書き込み・集計
    ActionLogDB-->>DailyAggregationLambda: OK
    Note over DailyAggregationLambda: 破棄メッセージは次回アプリ起動時にFEが表示
```

### 6. 週次バッチフロー

```mermaid
sequenceDiagram
    participant EventBridge as EventBridgeScheduler
    participant LearningEngineLambda
    participant ActionLogDB
    participant UserDB
    participant Bedrock as BedrockClient

    EventBridge->>LearningEngineLambda: 毎週月曜0時トリガー
    LearningEngineLambda->>ActionLogDB: 全ユーザーAction_Log取得
    ActionLogDB-->>LearningEngineLambda: Action_Log
    LearningEngineLambda->>UserDB: Profile・Goal取得
    UserDB-->>LearningEngineLambda: ユーザーデータ
    LearningEngineLambda->>Bedrock: 行動モデル構築・Future_Self_Model更新
    Bedrock-->>LearningEngineLambda: BehaviorModel・FutureSelfModel
    LearningEngineLambda->>UserDB: BehaviorModel・FutureSelfModel書き込み
    LearningEngineLambda->>UserDB: Profile.behaviorTrends更新
    LearningEngineLambda->>UserDB: Pivot_Goal昇格候補フラグ更新
    UserDB-->>LearningEngineLambda: OK
```

### 7. アカウント削除フロー

```mermaid
sequenceDiagram
    actor User
    participant ProfileScreens
    participant AccountLambda
    participant UserDB
    participant ActionLogDB
    participant Cognito as CognitoUserPool

    User->>ProfileScreens: アカウント削除ボタン
    ProfileScreens-->>User: 確認ダイアログ
    User->>ProfileScreens: 削除確認
    ProfileScreens->>AccountLambda: DELETE /users/{userId}
    AccountLambda->>UserDB: 全ユーザーデータ削除
    UserDB-->>AccountLambda: OK
    AccountLambda->>ActionLogDB: 全行動ログ削除
    ActionLogDB-->>AccountLambda: OK
    AccountLambda->>Cognito: ユーザー削除
    Cognito-->>AccountLambda: OK
    AccountLambda-->>ProfileScreens: DeleteAccountResult
    ProfileScreens->>ProfileScreens: authStore.clearAuth()
    ProfileScreens-->>User: AuthScreens（ログイン画面）へ遷移
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

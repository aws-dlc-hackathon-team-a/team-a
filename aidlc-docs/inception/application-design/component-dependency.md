# コンポーネント依存関係 — だが、それでいい（DagaSoreDeIi_App）

## 概要

本ドキュメントは各コンポーネント間の依存関係と、主要ユースケースのデータフローを定義する。  
「どのコンポーネントが何に依存しているか」「あるユースケースでデータがどう流れるか」を確認したいときに参照する。  
コンポーネントの責務定義は [components.md](./components.md)、アーキテクチャ全体像は [application-design.md](./application-design.md) を参照。

## 目次

- [概要](#概要)
- [目次](#目次)
- [依存関係マトリクス](#依存関係マトリクス)
- [データフロー図](#データフロー図)
  - [1. 初期起動フロー（新規ユーザー）](#1-初期起動フロー新規ユーザー)
  - [2. アプリ起動フロー（既存ユーザー）](#2-アプリ起動フロー既存ユーザー)
  - [3. Recommendation生成フロー](#3-recommendation生成フロー)
  - [4. Done申告フロー](#4-done申告フロー)
  - [5. 日次集計・自動破棄フロー](#5-日次集計自動破棄フロー)
  - [6. 週次バッチフロー](#6-週次バッチフロー)
  - [7. Stats・サマリー表示フロー](#7-statsサマリー表示フロー)
  - [8. アカウント削除フロー](#8-アカウント削除フロー)
  - [9. PivotGoal 昇格提案フロー（FR-07-2）](#9-pivot_goal-昇格提案フローfr-07-2)
  - [10. 破棄メッセージ表示フロー（FR-13-5）](#10-破棄メッセージ表示フローfr-13-5)
  - [11. 学習データリセットフロー（FR-11-3）](#11-学習データリセットフローfr-11-3)
- [通信パターン](#通信パターン)
- [循環依存の排除](#循環依存の排除)

---

## 依存関係マトリクス


| コンポーネント                  | 依存先                                                                                          |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| Amplify UI Authenticator | AWS Cognito User Pool（外部ライブラリがカプセル化）                                                         |
| OnboardingScreens        | ProfileService, GoalService, NavigationComponent                                             |
| HomeScreen               | TriggerService, ActionTicketService, StatsService, GoalService（昇格候補）, authStore, ticketStore |
| RecommendationScreens    | RecommendationService, ActionTicketService, recommendationStore, ticketStore                 |
| ActionTicketScreens      | ActionTicketService, ticketStore                                                             |
| ProfileScreens           | ProfileService, GoalService, AccountService（アカウント削除）, Amplify `useAuthenticator`（サインアウト）     |
| StatsScreens             | StatsService                                                                                 |
| AccountService           | APIClient                                                                                    |
| ProfileService           | APIClient                                                                                    |
| GoalService              | APIClient                                                                                    |
| TriggerService           | APIClient, ActionTicketService（内部で getOpenTickets 参照）, ticketStore                           |
| RecommendationService    | APIClient, recommendationStore, ticketStore                                                  |
| ActionTicketService      | APIClient, ticketStore                                                                       |
| StatsService             | APIClient                                                                                    |
| APIClient                | AWS Amplify Auth（`fetchAuthSession` による JWT 取得）                                              |
| AccountLambda            | UserDB, ActionLogDB, CognitoUserPool（SimilarUserDBは匿名化済みのため削除対象外）                            |
| UserLambda               | UserDB, ActionLogDB（学習データリセット時のActionLogEntry削除）, BedrockClient, BackendErrorHandler                                                   |
| ActionTicketLambda       | ActionLogDB, UserDB, BedrockClient, BackendErrorHandler                                      |
| RecommendationLambda     | UserDB, ActionLogDB, SimilarUserDB, BedrockClient, BackendErrorHandler                       |
| DailyAggregationLambda   | ActionLogDB, UserDB, BedrockClient, BackendErrorHandler                                      |
| StatsLambda              | ActionLogDB, BackendErrorHandler                                                             |
| LearningEngineLambda     | UserDB, ActionLogDB, BedrockClient, BackendErrorHandler                                      |
| EventBridgeScheduler     | DailyAggregationLambda（毎日0時）, LearningEngineLambda（毎週月曜0時）                                   |


**Note（Zustandストア）**: マトリクスでは Application Design で確定した3ストア（`authStore` / `ticketStore` / `recommendationStore`）のみを記載する。`profileStore` / `goalStore` / `effortPointStore` は Construction Phase で Zustand か React Query キャッシュかを決定するため未記載。

**Note（認証）**: サインアップ・サインイン・パスワードリセット・メール確認は Amplify UI Authenticator が一括提供する。各画面は `useAuthenticator` フックで認証情報にアクセスできる。

---

## データフロー図

### 1. 初期起動フロー（新規ユーザー）

```mermaid
sequenceDiagram
    actor User
    participant App
    participant Authenticator as Amplify UI Authenticator
    participant Cognito as CognitoUserPool
    participant OnboardingScreens
    participant UserLambda
    participant Bedrock as BedrockClient
    participant UserDB

    User->>App: アプリ起動
    App->>Authenticator: 未認証セッション検出 → 認証UI表示
    User->>Authenticator: メール・パスワードでサインアップ
    Authenticator->>Cognito: signUp()
    Cognito-->>Authenticator: 確認メール送信
    User->>Authenticator: 確認コード入力
    Authenticator->>Cognito: confirmSignUp()
    Authenticator->>Cognito: signIn()
    Cognito-->>Authenticator: JWTトークン発行
    Authenticator-->>App: 認証完了 → 子コンポーネント描画
    Note over App: authStore が useAuthenticator からユーザー情報を同期

    App->>OnboardingScreens: オンボーディングへ遷移
    OnboardingScreens->>UserLambda: GET /me/profile/suggestions
    UserLambda->>Bedrock: AIサジェスト生成
    Bedrock-->>UserLambda: サジェスト候補
    UserLambda-->>OnboardingScreens: サジェスト候補

    OnboardingScreens->>UserLambda: PUT /me/profile
    UserLambda->>UserDB: Profile書き込み
    UserDB-->>UserLambda: OK
    UserLambda-->>OnboardingScreens: Profile

    OnboardingScreens->>UserLambda: POST /me/goals/generate
    UserLambda->>Bedrock: Pivot_Goal自動生成
    Bedrock-->>UserLambda: Pivot_Goal候補
    UserLambda->>UserDB: Goal書き込み
    UserLambda-->>OnboardingScreens: Goal一覧
    OnboardingScreens-->>User: MainTab（HomeScreen）へ遷移
```

1. FR-09-5「Similar_User_Data収集の同意UI」の画面配置が未定義

### 2. アプリ起動フロー（既存ユーザー）

自動Triggerの実行主体は HomeScreen とする（`TriggerService.checkAutoTrigger` は HomeScreen 内で呼ばれる）。認証セッションの検証は Amplify UI Authenticator が透過的に実施する。

```mermaid
sequenceDiagram
    actor User
    participant App
    participant Authenticator as Amplify UI Authenticator
    participant Cognito as CognitoUserPool
    participant HomeScreen
    participant UserLambda
    participant UserDB
    participant ActionTicketLambda
    participant ActionLogDB

    User->>App: アプリ起動
    App->>Authenticator: セッション確認
    Authenticator->>Cognito: getCurrentSession()
    alt 未認証
        Cognito-->>Authenticator: 未認証
        Authenticator-->>User: 認証UI（サインイン画面）を表示
    else 認証済み
        Cognito-->>Authenticator: JWTトークン
        Authenticator-->>App: 認証済み → 子コンポーネント描画
        Note over App: authStore が useAuthenticator からユーザー情報を同期
        App->>UserLambda: GET /me/profile
        UserLambda->>UserDB: Profile取得
        UserDB-->>UserLambda: Profile
        UserLambda-->>App: Profile
        alt プロフィール未完了
            App-->>User: OnboardingScreensへ遷移
        else 完了
            App-->>HomeScreen: HomeScreenマウント
            HomeScreen->>ActionTicketLambda: GET /me/tickets
            ActionTicketLambda->>ActionLogDB: Open Ticket取得
            ActionLogDB-->>ActionTicketLambda: Ticket一覧
            ActionTicketLambda-->>HomeScreen: Ticket一覧
            alt Open Ticket 0件
                HomeScreen-->>User: 自動Trigger発火 → Recommendationフローへ
            else Open Ticketあり
                HomeScreen-->>User: HomeScreen通常表示
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
    participant SimilarUserDB
    participant Bedrock as BedrockClient
    participant RecommendationScreens

    User->>HomeScreen: Triggerボタンタップ（または自動Trigger）
    HomeScreen->>RecommendationLambda: POST /me/recommendations
    RecommendationLambda->>UserDB: Profile・Goal・BehaviorModel・FutureSelfModel取得
    UserDB-->>RecommendationLambda: ユーザーデータ
    RecommendationLambda->>ActionLogDB: Action_Log件数確認・直近ログ取得
    ActionLogDB-->>RecommendationLambda: Action_Log
    alt v1（モック）
        RecommendationLambda->>SimilarUserDB: モックデータ読み取り（v1）
        SimilarUserDB-->>RecommendationLambda: モック SimilarUserData
    end
    RecommendationLambda->>Bedrock: Recommendation生成
    Bedrock-->>RecommendationLambda: Recommendation（Persona_Messageトーン）
    RecommendationLambda-->>HomeScreen: Recommendation
    HomeScreen->>RecommendationScreens: recommendationStore更新 → 画面遷移
    RecommendationScreens->>RecommendationLambda: POST /me/recommendations/action-steps
    RecommendationLambda->>Bedrock: ActionStep生成
    Bedrock-->>RecommendationLambda: ActionStep[]
    RecommendationLambda-->>RecommendationScreens: ActionStep[]
    RecommendationScreens-->>User: Recommendation + ActionStep表示
```

### 4. Done申告フロー

```mermaid
sequenceDiagram
    actor User
    participant Screen as ActionTicketScreens/HomeScreen
    participant ActionTicketLambda
    participant ActionLogDB
    participant UserDB
    participant Bedrock as BedrockClient

    User->>Screen: Done申告
    Screen->>ActionTicketLambda: PUT /me/tickets/{ticketId}/complete
    ActionTicketLambda->>ActionLogDB: ActionLogEntry書き込み（リアルタイム）
    ActionTicketLambda->>ActionTicketLambda: calculatePoints()
    ActionTicketLambda->>ActionLogDB: EffortPointRecord書き込み
    ActionTicketLambda->>ActionLogDB: UserStats を ADD で原子更新<br>(totalPoints, totalCompletedTickets)
    ActionLogDB-->>ActionTicketLambda: 更新後のUserStats
    ActionTicketLambda->>ActionTicketLambda: checkMilestone(totalPoints, lastMilestoneValue)
    alt マイルストーン達成
        ActionTicketLambda->>ActionLogDB: UserStats.lastMilestoneValue 更新
    end
    ActionTicketLambda->>UserDB: Profile・FutureSelfModel取得
    UserDB-->>ActionTicketLambda: ユーザーデータ
    ActionTicketLambda->>ActionLogDB: 直近Action_Log取得
    ActionLogDB-->>ActionTicketLambda: 直近Action_Log
    ActionTicketLambda->>Bedrock: generateCompletionMessage()（Persona_Message生成）
    Bedrock-->>ActionTicketLambda: Persona_Message
    ActionTicketLambda-->>Screen: CompleteTicketResult { ticket, pointsAwarded, totalPoints, milestoneReached, personaMessage }
    Screen->>Screen: ticketStore更新（React Queryキャッシュ無効化）
    Screen-->>User: Persona_Message表示（ポイント + 肯定メッセージ）<br>マイルストーン達成時は特別メッセージ・バッジ
```

### 5. 日次集計・自動破棄フロー

```mermaid
sequenceDiagram
    participant EventBridge as EventBridgeScheduler
    participant DailyAggregationLambda
    participant ActionLogDB
    participant UserDB
    participant Bedrock as BedrockClient

    EventBridge->>DailyAggregationLambda: 毎日0時トリガー
    DailyAggregationLambda->>ActionLogDB: 全ユーザーの Open Ticket を破棄ステータスに更新
    ActionLogDB-->>DailyAggregationLambda: ExpireTicketsResult（破棄件数）
    DailyAggregationLambda->>ActionLogDB: ActionLogEntry(actionType=expire)を書き込み
    DailyAggregationLambda->>DailyAggregationLambda: runDailyAggregation() で DailySummary 集計
    DailyAggregationLambda->>UserDB: Profile・FutureSelfModel 取得
    UserDB-->>DailyAggregationLambda: Profile・FutureSelfModel
    DailyAggregationLambda->>Bedrock: buildDiscardMessage()（Persona_Message生成）<br>FR-13-5/FR-13-6/FR-08-8 の3ケースをコンテキストで判別
    Bedrock-->>DailyAggregationLambda: discardMessage（Persona_Messageトーン）
    DailyAggregationLambda->>ActionLogDB: DailySummary（discardMessage含む）書き込み
    ActionLogDB-->>DailyAggregationLambda: OK
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
    LearningEngineLambda->>UserDB: Profile.behaviorTrends / strengthPatterns 更新
    LearningEngineLambda->>UserDB: checkPivotGoalPromotion() で Goal.promotionCandidate フラグ更新
    UserDB-->>LearningEngineLambda: OK
```

### 7. Stats・サマリー表示フロー

```mermaid
sequenceDiagram
    actor User
    participant HomeScreen
    participant StatsScreens
    participant StatsLambda
    participant ActionLogDB

    Note over HomeScreen: HomeScreen マウント時
    HomeScreen->>StatsLambda: GET /me/stats/total-points
    StatsLambda->>ActionLogDB: UserStats を GetItem（1回）
    ActionLogDB-->>StatsLambda: UserStats（totalPoints）
    StatsLambda-->>HomeScreen: totalPoints
    HomeScreen-->>User: Effort_Pointサマリー表示

    Note over StatsScreens: Stats画面を開いた時
    User->>StatsScreens: Stats画面を開く
    StatsScreens->>StatsLambda: GET /me/stats/daily
    StatsLambda->>ActionLogDB: 過去日:DailySummary を GetItem / 当日:EffortPointRecord を Query
    ActionLogDB-->>StatsLambda: DailySummary
    StatsLambda-->>StatsScreens: DailySummary

    StatsScreens->>StatsLambda: GET /me/stats/weekly
    StatsLambda->>ActionLogDB: DailySummary を直近7日分 Query
    ActionLogDB-->>StatsLambda: DailySummary[]
    StatsLambda->>StatsLambda: 週単位で集計
    StatsLambda-->>StatsScreens: WeeklySummary

    StatsScreens->>StatsLambda: GET /me/stats/monthly
    StatsLambda->>ActionLogDB: DailySummary を該当月分 Query
    ActionLogDB-->>StatsLambda: DailySummary[]
    StatsLambda->>StatsLambda: 月単位で集計
    StatsLambda-->>StatsScreens: MonthlySummary

    StatsScreens-->>User: 週間/月間グラフ・得意な行動パターン表示
```

### 8. アカウント削除フロー

```mermaid
sequenceDiagram
    actor User
    participant ProfileScreens
    participant AccountService
    participant AccountLambda
    participant UserDB
    participant ActionLogDB
    participant Cognito as CognitoUserPool
    participant Authenticator as Amplify UI Authenticator

    User->>ProfileScreens: アカウント削除ボタン
    ProfileScreens-->>User: 確認ダイアログ
    User->>ProfileScreens: 削除確認
    ProfileScreens->>AccountService: deleteAccount()
    AccountService->>AccountLambda: DELETE /me（JWTトークン付き）
    Note over AccountLambda: API Gateway の Cognito Authorizer が JWT 検証を実施済み
    AccountLambda->>AccountLambda: getUserIdFromToken(event) で JWT claims の sub を取得 → userId
    AccountLambda->>UserDB: 全ユーザーデータ削除（User/Profile/ProfileUpdateHistory/Goal/TriggerSettings/FutureSelfModel/BehaviorModel）
    UserDB-->>AccountLambda: OK
    AccountLambda->>ActionLogDB: 全行動ログ削除（ActionLogEntry/ActionTicket/EffortPointRecord/DailySummary/Milestone/UserStats）
    ActionLogDB-->>AccountLambda: OK
    AccountLambda->>Cognito: ユーザー削除
    Cognito-->>AccountLambda: OK
    Note over AccountLambda: SimilarUserDB は匿名化済みのため削除対象外
    AccountLambda-->>AccountService: DeleteAccountResult
    AccountService->>Cognito: Amplify Auth.signOut() でローカルセッションクリア
    AccountService->>AccountService: authStore.clearAuth()
    Note over Authenticator: useAuthenticator が未認証状態を検出
    Authenticator-->>User: サインイン画面を自動再表示
```

### 9. Pivot_Goal 昇格提案フロー（FR-07-2）

```mermaid
sequenceDiagram
    actor User
    participant HomeScreen
    participant UserLambda
    participant UserDB

    Note over HomeScreen: HomeScreen マウント時（既存ユーザーのアプリ起動フロー内で並行実行）
    HomeScreen->>UserLambda: GET /me/goals/promotion-candidates
    UserLambda->>UserDB: Goal.promotionCandidate === true を取得
    UserDB-->>UserLambda: PromotionCandidate[]
    UserLambda-->>HomeScreen: PromotionCandidate[]
    alt 候補あり
        HomeScreen-->>User: 昇格提案バナーを表示<br>「お前、〇〇を続けられてるよね。これを新しい目標にしてみる？」
        User->>HomeScreen: 「はい」
        HomeScreen->>UserLambda: POST /me/goals/{candidateGoalId}/promote
        UserLambda->>UserDB: Goal.isPrimary=true / 旧Primary_Goal を Pivot に変更
        UserLambda-->>HomeScreen: 昇格後の Goal 一覧
        HomeScreen-->>User: バナー消去 → Goal表示更新
    else 候補なし
        HomeScreen-->>User: バナー非表示（通常の HomeScreen 表示）
    end
```

### 10. 破棄メッセージ表示フロー（FR-13-5）

```mermaid
sequenceDiagram
    actor User
    participant HomeScreen
    participant StatsLambda
    participant ActionLogDB
    participant AsyncStorage

    Note over HomeScreen: HomeScreen マウント時
    HomeScreen->>AsyncStorage: 今日の破棄メッセージ既読フラグを取得
    AsyncStorage-->>HomeScreen: isRead
    alt 未読
        HomeScreen->>StatsLambda: GET /me/stats/latest-discard-message
        StatsLambda->>ActionLogDB: 直近の DailySummary.discardMessage 取得
        ActionLogDB-->>StatsLambda: DiscardMessage
        StatsLambda-->>HomeScreen: DiscardMessage
        alt メッセージあり
            HomeScreen-->>User: 上部バナー/ダイアログで破棄メッセージ表示<br>「〇〇はできなかったけど、でも△△ができたから全然トータルOKじゃん！」
            User->>HomeScreen: 確認
            HomeScreen->>AsyncStorage: 既読フラグ書き込み
        end
    else 既読
        Note over HomeScreen: バナー非表示
    end
```

### 11. 学習データリセットフロー（FR-11-3）

```mermaid
sequenceDiagram
    actor User
    participant ProfileScreens
    participant ProfileService
    participant UserLambda
    participant UserDB
    participant ActionLogDB

    User->>ProfileScreens: 学習データリセットボタン
    ProfileScreens-->>User: 確認ダイアログ
    User->>ProfileScreens: リセット確認
    ProfileScreens->>ProfileService: resetLearningData()
    ProfileService->>UserLambda: POST /me/learning-data/reset
    Note over UserLambda: JWT claims から userId 取得
    UserLambda->>UserDB: BehaviorModel リセット
    UserDB-->>UserLambda: OK
    UserLambda->>UserDB: FutureSelfModel リセット（v1 はモック/推定モデルへ戻す）
    UserDB-->>UserLambda: OK
    UserLambda->>ActionLogDB: ActionLogEntry 全削除
    Note over ActionLogDB: ActionTicket / EffortPointRecord / DailySummary / Milestone / UserStats は保持
    ActionLogDB-->>UserLambda: OK
    UserLambda-->>ProfileService: OK
    ProfileService->>ProfileService: React Query キャッシュ無効化
    ProfileService-->>ProfileScreens: 完了
    ProfileScreens-->>User: リセット完了メッセージ表示
```

---

## 通信パターン


| パターン                   | 使用箇所                                                                                                                          |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **同期REST（HTTPS）**      | Frontend → API Gateway → Lambda（全通常API）。全てAPIClient経由                                                                         |
| **Amplify Auth直接（例外）** | Frontend → CognitoUserPool（サインアップ・サインイン・パスワードリセット）。**これは原則の例外として許容**。アカウント削除時のDynamoDB/Cognito削除はAPIClient経由でAccountLambdaを叩く |
| **Lambda内部呼び出し**       | なし                                                                                                                            |
| **EventBridge スケジュール** | 日次バッチ（DailyAggregationLambda 毎日0時）・週次バッチ（LearningEngineLambda 毎週月曜0時）                                                         |


## 認可方針

- **API Gateway の Cognito Authorizer** が JWT の署名・有効期限検証を行う
- Lambda は **JWT claims の `sub**` を認証済みの `userId` として使用する（`event.requestContext.authorizer.claims.sub`）
- API エンドポイントは `**/me/...**` 形式を採用し、URL path に userId を含めない
- path userId と JWT sub の一致確認（認可チェック）は構造上不要（path userId 自体が存在しないため）
- バッチ Lambda（DailyAggregationLambda / LearningEngineLambda）は API Gateway を通さないため認可対象外（EventBridge トリガー）

---

## 循環依存の排除

- Frontend サービス層はすべて APIClient を経由してバックエンドと通信する（直接Lambda呼び出しなし）。ただし認証系（Cognito）のみ Amplify Auth による直接通信を原則の例外として許容する
- Lambda間の直接呼び出しはなし
- EventBridgeトリガーのバッチ処理（DailyAggregationLambda・LearningEngineLambda）とAPI処理（その他Lambda）は完全に分離
- LearningEngineLambda は完全に非同期バッチ処理であり、他のLambdaから呼び出されない
- ZustandStore（authStore・ticketStore・recommendationStore）はサービス層から更新され、画面コンポーネントから読み取る（単方向データフロー）
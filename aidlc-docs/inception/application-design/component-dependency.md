# コンポーネント依存関係 — だが、それでいい（DagaSoreDeIi_App）

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
| AuthLambda               | UserDB, ActionLogDB, SimilarUserDB, CognitoUserPool                            |
| ProfileGoalLambda        | UserDB, BedrockClient, BackendErrorHandler                                     |
| ActionTicketLambda       | UserDB, ActionLogDB, EffortPointLambda, BackendErrorHandler                    |
| RecommendationLambda     | UserDB, ActionLogDB, BedrockClient, BackendErrorHandler                        |
| EffortPointLambda        | ActionLogDB, BackendErrorHandler                                               |
| LearningEngineLambda     | UserDB, ActionLogDB, BedrockClient, BackendErrorHandler                        |
| EventBridgeScheduler     | LearningEngineLambda, ActionTicketLambda, EffortPointLambda                    |

---

## データフロー図

### 1. Recommendation生成フロー

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

### 2. Action_Ticket Done フロー

```
ActionTicketScreens / HomeScreen
  → useActionTicketService.completeTicket()
    → APIClient PUT /tickets/{userId}/{ticketId}/complete
      → API Gateway
        → ActionTicketLambda
          → ActionLogDB（ActionLogEntry書き込み・リアルタイム）
          → ActionTicketLambda → EffortPointLambda（内部呼び出し）
            → ActionLogDB（EffortPointRecord書き込み）
            ← { pointsAwarded, totalPoints, milestoneReached }
          ← CompleteTicketResult
      ← CompleteTicketResult
    ← CompleteTicketResult
  → ZustandStore更新（ticketSlice, effortPointSlice）
  → Persona_Message表示
```

### 3. 週次バッチフロー

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

### 4. 日次集計・自動破棄フロー

```
EventBridgeScheduler（ユーザー設定の集計時刻）
  → ActionTicketLambda.expireTickets()
    → ActionLogDB（Open Ticketを破棄ステータスに更新）
    → ActionLogDB（DailySummary書き込み）
    ← ExpireTicketsResult（破棄件数・Done件数）
  → EffortPointLambda.runDailyAggregation()
    → ActionLogDB（DailySummary集計）
```

---

## 通信パターン

| パターン                     | 使用箇所                                                                   |
| ---------------------------- | -------------------------------------------------------------------------- |
| **同期REST（HTTPS）**        | Frontend → API Gateway → Lambda（全通常API）                               |
| **Lambda内部呼び出し**       | ActionTicketLambda → EffortPointLambda（Done時）                           |
| **EventBridge スケジュール** | 週次バッチ（LearningEngine）・日次集計（ActionTicket/EffortPoint）         |
| **Amplify Auth直接**         | Frontend → CognitoUserPool（サインアップ・サインイン・パスワードリセット） |

---

## 循環依存の排除

- Frontend サービス層はすべて APIClient を経由してバックエンドと通信する（直接Lambda呼び出しなし）
- Lambda間の直接呼び出しは ActionTicketLambda → EffortPointLambda の1箇所のみ（同期・同一リクエスト内）
- LearningEngineLambda は完全に非同期バッチ処理であり、他のLambdaから呼び出されない
- ZustandStore はサービス層から更新され、画面コンポーネントから読み取る（単方向データフロー）

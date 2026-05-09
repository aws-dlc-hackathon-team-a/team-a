# 要件・コンポーネント ↔ ユニットマッピング — だが、それでいい（DagaSoreDeIi_App）

## 概要

User Stories はスキップしたため（単一ペルソナ・要件詳細記載済み）、本ドキュメントでは **要件（FR-xx / NFR-xx）と Application Design コンポーネントがどのユニットに割り当てられるか** をマッピングする。これにより、各ユニットの開発スコープを明確化し、全要件が実装対象として漏れなくカバーされていることを検証する。

関連ドキュメント:

- 要件定義: [requirements.md](../requirements/requirements.md)
- ユニット定義: [unit-of-work.md](./unit-of-work.md)
- ユニット間依存: [unit-of-work-dependency.md](./unit-of-work-dependency.md)
- コンポーネント責務: [components.md](./components.md)

## 目次

- [概要](#概要)
- [ユニット一覧（再掲）](#ユニット一覧再掲)
- [コンポーネント ↔ ユニットマッピング](#コンポーネント--ユニットマッピング)
- [機能要件 ↔ ユニットマッピング](#機能要件--ユニットマッピング)
- [非機能要件 ↔ ユニットマッピング](#非機能要件--ユニットマッピング)
- [データストア ↔ ユニットマッピング](#データストア--ユニットマッピング)
- [外部サービス ↔ ユニットマッピング](#外部サービス--ユニットマッピング)
- [割り当て漏れチェック](#割り当て漏れチェック)

---

## ユニット一覧（再掲）

| #  | ユニット名           | パッケージ           |
| -- | -------------------- | -------------------- |
| U1 | Mobile Frontend      | `apps/mobile/`       |
| U2 | Backend API          | `apps/backend/`      |
| U3 | Batch                | `apps/batch/`        |
| U4 | Infrastructure       | `apps/infra/`        |
| —  | Shared Types         | `packages/shared-types/` |

---

## コンポーネント ↔ ユニットマッピング

### Frontend コンポーネント

| コンポーネント                | 所属ユニット | 備考                                          |
| ----------------------------- | ------------ | --------------------------------------------- |
| NavigationComponent           | U1 Mobile    |                                               |
| OnboardingScreens             | U1 Mobile    | データ収集同意画面（FR-09-5/FR-12-1）を含む   |
| HomeScreen                    | U1 Mobile    |                                               |
| RecommendationScreens         | U1 Mobile    |                                               |
| ActionTicketScreens           | U1 Mobile    |                                               |
| ProfileScreens                | U1 Mobile    | 学習データリセット UI（FR-11-3）・アカウント削除 UI を含む |
| StatsScreens                  | U1 Mobile    |                                               |
| Zustand Stores（3ストア）     | U1 Mobile    |                                               |
| APIClient                     | U1 Mobile    |                                               |
| FrontendErrorHandler          | U1 Mobile    |                                               |
| Amplify UI Authenticator      | U1 Mobile    | 外部ライブラリ。認証 UI とフロー一括提供       |
| AccountService                | U1 Mobile    |                                               |
| ProfileService                | U1 Mobile    | `resetLearningData` を含む                    |
| GoalService                   | U1 Mobile    | 昇格候補・昇格承認を含む                      |
| TriggerService                | U1 Mobile    | 自動・手動 Trigger を含む                     |
| RecommendationService         | U1 Mobile    |                                               |
| ActionTicketService           | U1 Mobile    |                                               |
| StatsService                  | U1 Mobile    |                                               |

### Backend コンポーネント（API 系）

| コンポーネント                | 所属ユニット | 備考                                                          |
| ----------------------------- | ------------ | ------------------------------------------------------------ |
| AccountLambda                 | U2 Backend   |                                                              |
| UserLambda                    | U2 Backend   | `resetLearningData`（FR-11-3）を含む                        |
| ActionTicketLambda            | U2 Backend   | `generateCompletionMessage`（Bedrock）を含む                |
| RecommendationLambda          | U2 Backend   | ActionStep 生成を含む                                        |
| StatsLambda                   | U2 Backend   |                                                              |
| BackendErrorHandler           | U2 Backend + U3 Batch | 共通ミドルウェア。両ユニットで同じ実装を利用（コード共有は `packages/shared-types` 経由または各ユニットで同一実装を配置） |
| BedrockClient（抽象化）       | U2 Backend + U3 Batch | Q8-A に従い各ユニット内で独自に配置                         |

### Backend コンポーネント（バッチ系）

| コンポーネント                | 所属ユニット | 備考                                                          |
| ----------------------------- | ------------ | ------------------------------------------------------------ |
| DailyAggregationLambda        | U3 Batch     | `buildDiscardMessage`（Bedrock呼び出し）を含む              |
| LearningEngineLambda          | U3 Batch     | 行動モデル構築・昇格候補判定・得意パターン分析                |

### データストア

| コンポーネント                | 所属ユニット | 利用ユニット            |
| ----------------------------- | ------------ | ----------------------- |
| UserDB                        | U4 Infra（DbStack） | U2 Backend、U3 Batch   |
| ActionLogDB                   | U4 Infra（DbStack） | U2 Backend、U3 Batch   |
| SimilarUserDB                 | U4 Infra（DbStack） | U2 Backend のみ         |

### Infrastructure コンポーネント

| 項目                          | 所属ユニット | 備考                                                         |
| ----------------------------- | ------------ | ----------------------------------------------------------- |
| Cognito User Pool             | U4 Infra（FrontendStack）       | U1 Mobile と U2 Backend から参照                             |
| API Gateway                   | U4 Infra（BackendStack）        | U2 Backend の Lambda にルーティング                          |
| Lambda 関数（API 用）         | U4 Infra（BackendStack）        | U2 Backend の zip を取り込み                                 |
| Lambda 関数（Batch 用）       | U4 Infra（BatchStack）          | U3 Batch の zip を取り込み                                   |
| EventBridge Scheduler         | U4 Infra（BatchStack）          | 毎日 0 時・毎週月曜 0 時のスケジュール                       |
| DynamoDB テーブル（3つ）      | U4 Infra（DbStack）             |                                                              |
| Bedrock IAM Policy（共通）    | U4 Infra（BedrockAccessStack）  | U2 Backend・U3 Batch の Lambda ロールに attach               |

---

## 機能要件 ↔ ユニットマッピング

各 FR を **実装責務が発生するユニット** にマッピングする。複数ユニットにまたがる要件は全て記載する。

| 要件 ID | 概要                                     | U1 Mobile | U2 Backend API | U3 Batch | U4 Infra | 備考                                                 |
| ------- | ---------------------------------------- | :-------: | :------------: | :------: | :------: | ---------------------------------------------------- |
| FR-01-1 | 新規アカウント登録                       | ○         |                |          | ○        | Amplify UI + Cognito（FrontendStack）               |
| FR-01-2 | 確認メール送信                           |           |                |          | ○        | Cognito 設定                                         |
| FR-01-3 | メール未確認時の案内                     | ○         |                |          |          | Amplify UI Authenticator                             |
| FR-01-4 | サインイン                               | ○         |                |          | ○        | Amplify UI + Cognito                                 |
| FR-01-5 | パスワードリセット                       | ○         |                |          | ○        | Amplify UI + Cognito                                 |
| FR-01-6 | セッション維持                           | ○         |                |          | ○        | Amplify Auth                                         |
| FR-01-7 | アカウント削除                           | ○         | ○              |          | ○        | ProfileScreens → AccountService → AccountLambda      |
| FR-01-8 | 削除完了メッセージ・ログイン画面遷移     | ○         |                |          |          |                                                      |
| FR-01-9 | 72時間以内の個人データ削除               |           | ○              |          |          | AccountLambda                                        |
| FR-02-1 | 必須オンボーディングフロー               | ○         | ○              |          |          | NavigationComponent + OnboardingScreens + UserLambda.getProfile（isOnboardingComplete 判定）             |
| FR-02-2 | プロフィール登録項目・AIサジェスト       | ○         | ○              |          |          | OnboardingScreens + UserLambda（Bedrock）            |
| FR-02-3 | 初期 Pivot_Goal 自動生成                 |           | ○              |          |          | UserLambda.generateInitialPivotGoals（Bedrock）      |
| FR-02-4 | プロフィール編集                         | ○         | ○              |          |          | ProfileScreens + UserLambda                          |
| FR-02-5 | 未完了項目の案内                         | ○         | ○              |          |          | OnboardingScreens（案内UI）+ UserLambda.getProfile（未完了項目判定データ取得）                                                      |
| FR-03-1 | 複数 Goal 登録                           | ○         | ○              |          |          | ProfileScreens + UserLambda                          |
| FR-03-2 | Primary_Goal 指定                        | ○         | ○              |          |          |                                                      |
| FR-03-3 | Pivot_Goal 候補・優先度                  | ○         | ○              |          |          |                                                      |
| FR-03-4 | AI 生成 Pivot_Goal の優先度初期値        |           | ○              |          |          | UserLambda                                           |
| FR-03-5 | Pivot_Goal 優先度変更                    | ○         | ○              |          |          |                                                      |
| FR-03-6 | Goal 削除確認ダイアログ                  | ○         |                |          |          |                                                      |
| FR-03-7 | Primary_Goal 削除時のガード              | ○         | ○              |          |          |                                                      |
| FR-04-1 | 手動 Trigger ボタン                      | ○         |                |          |          | HomeScreen                                           |
| FR-04-2 | 心理状態入力                             | ○         |                |          |          | RecommendationScreens                                |
| FR-04-3 | Open Ticket 0件時の自動 Trigger          | ○         |                |          |          | HomeScreen                                           |
| FR-05-1 | Trigger 発火時の Recommendation 表示     | ○         | ○              |          |          | RecommendationScreens + RecommendationLambda         |
| FR-05-2 | 初回 Recommendation は Primary_Goal 関連 |           | ○              |          |          | RecommendationLambda                                 |
| FR-05-3 | 4 択応答ボタン                           | ○         |                |          |          |                                                      |
| FR-05-4 | 4 択応答時の Action_Ticket 生成          | ○         | ○              |          |          | RecommendationScreens + ActionTicketLambda           |
| FR-06-1 | やる応答時の Ticket 生成・ActionStep     | ○         | ○              |          |          | RecommendationLambda（ActionStep 生成）              |
| FR-06-2 | いいえ応答時の別アクション提案           |           | ○              |          |          | RecommendationLambda.generatePivotRecommendation    |
| FR-06-3 | Pivot 提案は Persona_Message             |           | ○              |          |          | RecommendationLambda + Bedrock                      |
| FR-06-5 | Pivot 後も 4 択                          | ○         |                |          |          |                                                      |
| FR-06-6 | 最終受入時の Ticket 生成・ラベル付与     | ○         | ○              |          |          |                                                      |
| FR-06-7 | 目標チェンジ時の即席 Pivot 候補          |           | ○              |          |          | RecommendationLambda                                 |
| FR-06-8 | 最低限アクション提案                     |           | ○              |          |          |                                                      |
| FR-06-9 | Done → Action_Log 記録（リアルタイム）   |           | ○              | ○        |          | ActionTicketLambda（Done時）＋ LearningEngineLambda（バッチ更新） |
| FR-07-1 | 週次バッチでの Profile 行動傾向更新      |           |                | ○        |          | LearningEngineLambda                                 |
| FR-07-2 | Pivot_Goal 昇格提案                      | ○         | ○              | ○        |          | LearningEngineLambda（候補検出）→ UserLambda（承認API）→ HomeScreen（バナー表示） |
| FR-07-3 | 得意な行動パターン分析                   |           |                | ○        |          | LearningEngineLambda.analyzeStrengthPatterns         |
| FR-08-1 | Done 時の Effort_Point 即時付与          |           | ○              |          |          | ActionTicketLambda.calculatePoints                   |
| FR-08-2 | Effort_Point 付与ルール                  |           | ○              |          |          | ActionTicketLambda.calculatePoints（純粋関数・PBT対象） |
| FR-08-3 | Persona_Message + ポイント表示           | ○         | ○              |          |          | ActionTicketLambda.generateCompletionMessage（Bedrock）→ Mobile 表示 |
| FR-08-4 | 集計時刻 0 時固定                        |           |                | ○        | ○        | BatchStack の EventBridge スケジュール設定           |
| FR-08-5 | 0 時のサマリー表示（次回起動時）         | ○         | ○              | ○        |          | HomeScreen + StatsLambda + DailyAggregationLambda   |
| FR-08-6 | 累計・週間・月間グラフ                   | ○         | ○              |          |          | StatsScreens + StatsLambda                           |
| FR-08-7 | マイルストーン達成メッセージ・バッジ     | ○         | ○              |          |          | ActionTicketLambda.checkMilestone + Mobile 表示      |
| FR-08-8 | 行動記録なし日の励ましメッセージ         |           |                | ○        |          | DailyAggregationLambda.buildDiscardMessage（3ケース判別） |
| FR-09-1 | Similar_User_Data 匿名化収集（v2）      |           |                |          |          | v2 以降スコープ                                      |
| FR-09-2 | Profile 登録時に Future_Self_Model 構築  |           | ○              |          |          | v1: モックデータ。UserLambda                         |
| FR-09-3 | 「似た状況だった人は」形式のメッセージ   |           | ○              | ○        |          | RecommendationLambda（Trigger時）+ ActionTicketLambda（Done時）+ DailyAggregationLambda（破棄メッセージ時）+ Bedrock |
| FR-09-4 | 週次バッチで Future_Self_Model 更新      |           |                | ○        |          | LearningEngineLambda.updateFutureSelfModel           |
| FR-09-5 | Similar_User_Data 収集同意 UI            | ○         |                |          |          | OnboardingScreens（v1 は UI のみ）                   |
| FR-09-6 | Similar_User_Data 匿名化（v2）          |           |                |          |          | v2 以降スコープ                                      |
| FR-09-7 | 類似ユーザー 5 件未満時の推定モデル      |           | ○              |          |          | RecommendationLambda（v1 は常にこのモードで動作）    |
| FR-10-1 | 全メッセージを Persona_Message で生成    |           | ○              | ○        |          | 各 Bedrock 呼び出し Lambda                           |
| FR-10-2 | 文体：「俺（私）」「お前（あなた）」     |           | ○              | ○        |          | Bedrock プロンプト設計                               |
| FR-10-3 | Trigger 発火時のパーソナライズ           |           | ○              |          |          | RecommendationLambda                                 |
| FR-10-4 | Profile・FutureSelfModel・Action_Log 参照 |          | ○              | ○        |          |                                                      |
| FR-10-5 | Primary_Goal 達成日メッセージ            |           | ○              |          |          | ActionTicketLambda.generateCompletionMessage         |
| FR-10-6 | Pivot_Goal 達成日メッセージ              |           | ○              |          |          | ActionTicketLambda.generateCompletionMessage         |
| FR-11-1 | 行動モデル構築（週次）                   |           | ○              | ○        |          | ActionTicketLambda（リアルタイムログ）＋ LearningEngineLambda（構築） |
| FR-11-2 | 7 件閾値でプロンプト切替                 |           | ○              |          |          | RecommendationLambda.selectPromptStrategy            |
| FR-11-3 | 学習データリセット                       | ○         | ○              |          |          | ProfileScreens → ProfileService → UserLambda.resetLearningData |
| FR-12-1 | 位置情報収集同意 UI                      | ○         |                |          |          | OnboardingScreens（v1 は UI のみ、サーバー送信なし） |
| FR-12-2 | 位置情報はデバイス上でのみ処理           | ○         |                |          |          |                                                      |
| FR-13-1 | Action_Ticket 生成（Open）               |           | ○              |          |          | ActionTicketLambda.createTicket                      |
| FR-13-2 | チケット一覧から Done 自己申告            | ○         | ○              |          |          |                                                      |
| FR-13-3 | Done → Action_Log 反映                   |           | ○              |          |          | ActionTicketLambda.completeTicket                    |
| FR-13-4 | 0 時自動破棄                             |           |                | ○        | ○        | DailyAggregationLambda + EventBridge                 |
| FR-13-5 | 破棄メッセージ（完了あり）表示           | ○         | ○              | ○        |          | DailyAggregationLambda（生成）→ StatsLambda（取得）→ HomeScreen（表示） |
| FR-13-6 | 破棄メッセージ（完了なし）表示           | ○         | ○              | ○        |          | 同上                                                 |
| FR-13-7 | 破棄履歴保持                             | ○         | ○              |          |          | ActionTicketLambda.getExpiredTicketHistory + ActionTicketScreens |
| FR-13-8 | ホーム画面に Open Ticket 一覧表示        | ○         | ○              |          |          |                                                      |

---

## 非機能要件 ↔ ユニットマッピング

| NFR ID   | 概要                                         | U1 Mobile | U2 Backend | U3 Batch | U4 Infra | 備考                                                     |
| -------- | -------------------------------------------- | :-------: | :--------: | :------: | :------: | -------------------------------------------------------- |
| NFR-01-1 | スケーラブル設計                             | ○         | ○          | ○        | ○        |                                                          |
| NFR-01-2 | DynamoDB オンデマンド                        |           |            |          | ○        | DbStack                                                  |
| NFR-01-3 | Lambda + API Gateway サーバーレス            |           | ○          | ○        | ○        |                                                          |
| NFR-02-1 | HomeScreen 表示 3 秒以内                     | ○         | ○          |          |          | Recommendation は非同期。ローディング UI 表示           |
| NFR-02-2 | Ticket 操作 1 秒以内                         |           | ○          |          |          | ActionTicketLambda                                       |
| NFR-02-3 | Bedrock 10 秒タイムアウト                    |           | ○          | ○        |          | BackendErrorHandler                                      |
| NFR-03-1 | 位置情報デバイスのみ                         | ○         |            |          |          |                                                          |
| NFR-03-2 | 位置情報・Similar_User_Data 同意取得         | ○         |            |          |          | OnboardingScreens                                        |
| NFR-03-3 | GDPR・個人情報保護法 72 時間削除             |           | ○          |          |          | AccountLambda                                            |
| NFR-03-4 | Similar_User_Data 匿名化（v2）              |           |            |          |          | v2 以降スコープ                                          |
| NFR-04-1 | 可用性 99.9%                                 |           | ○          | ○        | ○        | Lambda + DynamoDB + API Gateway                          |
| NFR-04-2 | Bedrock フォールバック                       |           | ○          | ○        |          | BackendErrorHandler                                      |
| NFR-05-1 | 日本語のみ                                   | ○         | ○          | ○        |          | UI 日本語、Bedrock プロンプト日本語                      |
| NFR-05-2 | iOS/Android 一貫 UI                          | ○         |            |          |          | React Native                                             |
| NFR-05-3 | オフライン非対応                             | ○         |            |          |          |                                                          |
| NFR-06-1 | 純粋関数の PBT                               | ○         | ○          | ○        |          | calculatePoints / checkMilestone 等                      |
| NFR-06-2 | DynamoDB シリアライゼーション RTT            |           | ○          | ○        |          |                                                          |
| NFR-06-3 | React Native Testing Library UI テスト       | ○         |            |          |          |                                                          |

---

## データストア ↔ ユニットマッピング

| テーブル        | 管理 Stack | 利用ユニット               | 主なエンティティ                                                                       |
| --------------- | ---------- | -------------------------- | ------------------------------------------------------------------------------------- |
| UserDB          | DbStack    | U2 Backend、U3 Batch       | User、Profile、ProfileUpdateHistory、Goal、TriggerSettings、FutureSelfModel、BehaviorModel |
| ActionLogDB     | DbStack    | U2 Backend、U3 Batch       | ActionLogEntry、ActionTicket、EffortPointRecord、DailySummary、Milestone、UserStats  |
| SimilarUserDB   | DbStack    | U2 Backend（Recommendation のみ） | SimilarUserData（v1 モック）                                                        |

詳細エンティティ定義は [component-methods.md](./component-methods.md) を参照。

---

## 外部サービス ↔ ユニットマッピング

| 外部サービス          | 利用ユニット          | 用途                                                                   |
| --------------------- | --------------------- | ---------------------------------------------------------------------- |
| Amazon Bedrock        | U2 Backend、U3 Batch  | Recommendation 生成、Persona_Message 生成、行動モデル構築、破棄メッセージ生成 |
| AWS Cognito User Pool | U1 Mobile、U2 Backend | 認証 UI（Amplify UI Authenticator 経由）、JWT 検証（API Gateway Authorizer） |
| EventBridge Scheduler | U3 Batch              | 毎日 0 時・毎週月曜 0 時のスケジュール起動                             |
| API Gateway           | U2 Backend            | Lambda のルーティングと Cognito Authorizer                             |

---

## 割り当て漏れチェック

### 機能要件の網羅性

- FR-01-1 ～ FR-13-8 のうち、削除済み（FR-06-4、FR-02-6）とバージョン対象外（FR-09-1、FR-09-6）を除く全ての機能要件が少なくとも 1 つのユニットに割り当てられている
- FR-06-4 は削除済み（2026-05-09）
- FR-02-6 は削除済み（FR-07-1 に統合）
- FR-09-1 / FR-09-6 は v2 以降スコープで、v1 実装対象外

### 非機能要件の網羅性

- NFR-01-1 ～ NFR-06-3 の全てが割り当てられている
- NFR-03-4（Similar_User_Data 匿名化）は v2 以降スコープ

### コンポーネントの網羅性

- components.md の 1.1 ～ 4.3 に記載された全コンポーネントがユニットに割り当てられている

### ユニットに割り当てられないもの（対象外）

| 項目                                     | 理由                                 |
| ---------------------------------------- | ------------------------------------ |
| バックグラウンドプッシュ通知トリガー     | v2 以降スコープ                      |
| アプリ外プッシュ通知                     | v2 以降スコープ                      |
| 位置情報による「長時間滞在」Trigger       | v2 以降スコープ                      |
| Triggerソースの有効/無効設定             | v2 以降スコープ                      |
| Similar_User_Data の実収集・分析         | v2 以降スコープ                      |
| 多言語対応                               | v2 以降スコープ                      |
| Bedrock コンテキスト上限対策              | v2 以降スコープ                      |

# Application Design 修正計画（指摘事項対応）

指摘事項.md のレビューコメントに対する修正方針と対応内容を本計画にまとめる。
全項目対応完了。

---

## 修正チェックリスト

### requirements.md（先行修正）

- [x] **R-1**. FR-08-4 を「集計時刻は0時固定（24時）」に変更。関連要件（FR-08-5、FR-13-4）と DailyAggregationLambda のトリガー表現も合わせて修正
- [x] **R-2**. 用語集に「Milestone（マイルストーン）」を追加（「ActionStep」も併せて追加）
- [x] **R-3**. FR-13-5 / FR-13-6 の破棄メッセージ表示画面を明記（ホーム画面の上部バナー/ダイアログで表示、既読フラグはローカル）

### components.md

- [x] **C-1**. AccountLambda の責務・依存から SimilarUserDB が外れていることを再確認。`verifyAuthorization` を主要メソッドに追加
- [x] **C-2**. ActionTicketLambda は ActionLogDB のみ依存（UserDB 非参照）であることを備考に明記
- [x] **C-3**. データストア（3.1/3.2/3.3）に「格納エンティティと型定義参照」として component-methods.md の該当セクションへアンカーリンクを付与
- [x] **C-4**. 全 Lambda に「主要メソッド」行を追加し空欄を解消
- [x] **C-5**. バッチ Lambda 統合方針は **B（現行維持: 日次 DailyAggregationLambda / 週次 LearningEngineLambda）** をユーザー選択
- [x] **C-6**. 集計取得系は StatsLambda に集約し、ActionTicketLambda から分離されていることを確認
- [x] **C-7**. 「外部サービスコンポーネント」という表現が含まれていないことを確認
- [x] **C-8**. UserDB（3.1）の格納エンティティを一覧化し、component-methods.md に User / Profile / ProfileUpdateHistory / Goal / TriggerSettings / FutureSelfModel / BehaviorModel の型を定義

### component-dependency.md

- [x] **D-1**. AccountLambda マトリクスから SimilarUserDB が外れていることを再確認。削除フロー図にも SimilarUserDB 非登場
- [x] **D-2**. Zustand ストアを 3 ストア（authStore / ticketStore / recommendationStore）に統一。残りは Construction Phase 決定の Note を追加
- [x] **D-3**. アカウント削除フローに `verifyAuthorization`（JWT sub と path userId の一致確認）を追加
- [x] **D-4**. Stats 表示フロー（HomeScreen / StatsScreens → StatsLambda）をデータフロー図 7 として追加
- [x] **D-5**. StatsScreens の依存先を `useStatsService` に改名（旧 useEffortPointService）
- [x] **D-6**. 自動 Trigger の実行主体を HomeScreen に統一。`useCheckAutoTrigger` + `useAutoTrigger` の組み合わせで発火
- [x] **D-7**. HomeScreen の依存先に `useStatsService` を追加（total-points 取得および破棄メッセージ取得）
- [x] **D-8**. 「全て APIClient 経由」原則に対する Amplify Auth 直接通信の例外を明記
- [x] **D-9**. DailyAggregationLambda は UserDB を参照しない（日次バッチは ActionLogDB で完結）と明記
- [x] **D-10**. Pivot_Goal 昇格提案フロー（FR-07-2）をデータフロー図 9 として新規追加。破棄メッセージ表示フロー（FR-13-5）もデータフロー図 10 として追加

### component-methods.md

- [x] **M-1**. 「UserDB / ActionLogDB / SimilarUserDB 格納エンティティ型定義」セクションを新規作成し、User / Profile / ProfileUpdateHistory / Goal / TriggerSettings / FutureSelfModel / BehaviorModel / ActionLogEntry / ActionTicket / EffortPointRecord / DailySummary / Milestone / ExpiredTicket / ActionStep / SimilarUserData を網羅
- [x] **M-2**. `useAuthService` / `useProfileService` / `useGoalService` / `useTriggerService` / `useRecommendationService` / `useActionTicketService` / `useStatsService` の全メソッド定義を追加（1:1 対応）
- [x] **M-3**. `ActionStep` 型を追加、RecommendationScreens の責務にも ActionStep 表示を明記
- [x] **M-4**. ProfileStore / GoalStore / EffortPointStore の型定義を削除し、3 ストアのみ明記。Construction Phase で決定する旨の Note を追加

### services.md

- [x] **S-1**. `useGenerateActionSteps` が ActionStep を生成することを明記、component-methods.md と整合
- [x] **S-2**. `useGetExpiredHistory` の呼び出し元（ActionTicketScreens の破棄履歴タブ、FR-13-7）を明記
- [x] **S-3**. `useCheckAutoTrigger` + `useAutoTrigger` + `useManualTrigger` に整理。フロー記述も統一
- [x] **S-4**. profileStore / goalStore / effortPointStore 更新の記述を Construction Phase 決定事項として Note 化
- [x] **S-5**. Pivot_Goal 昇格提案（FR-07-2）のオーケストレーションを `useGetPromotionCandidates` + `usePromoteCandidate` として記載

### application-design.md

- [x] **A-1**. アーキテクチャ図を Mermaid 図に置換。Front → Cognito 矢印、EventBridge ボックス、SimilarUserDB を RecommendationLambda 依存として明示。外部サービスコンポーネント区分を廃止
- [x] **A-2**. バッチ Lambda 統合方針 B（現行維持）を反映
- [x] **A-3**. Lambda 間依存関係セクションを更新（SimilarUserDB 依存追加、毎日 0 時記述）

### plans

- [x] **P-1**. execution-plan.md の Workflow Planning ステータスを IN PROGRESS から COMPLETED に変更
- [x] **P-2**. application-design-plan.md の実行チェックリストに本修正計画へのリンクを追加

---

## 設計判断の確定内容

| 質問 | 確定内容 |
| ---- | -------- |
| Q-R1: 集計時刻 | **0 時固定**（ユーザー任意設定不可）。FR-08-4 / FR-08-5 / FR-13-4 および DailyAggregationLambda のトリガー記述を更新 |
| Q-C5: バッチ Lambda 統合 | **B. 現行維持**（日次 DailyAggregationLambda / 週次 LearningEngineLambda を別 Lambda として維持） |
| Q-D5: StatsScreens 依存名 | **A. useStatsService に改名**（旧 useEffortPointService）。StatsLambda と 1:1 対応 |
| Q-ProfileStore: ストア扱い | **A. 3 ストアのみ明記**（authStore / ticketStore / recommendationStore）。残りは Construction Phase で決定 |
| Q-Milestone: 用語定義 | 提案文で承認。用語集に Milestone と ActionStep を追加 |
| 追加修正: 図の形式 | システムアーキテクチャ図を Mermaid → ASCII アートに戻す |
| 追加修正: Service 命名 | `useXxxService` → `XxxService` に全ドキュメント統一 |
| 追加修正: 認可方針 | 全 Lambda 共通で JWT claims `sub` から userId を取得。API エンドポイントを `/me/...` 形式に変更。path userId と JWT sub の一致確認は不要（構造上他ユーザーデータへの横アクセスが発生しない） |
| 追加修正: バッチLambda分離 | Backend Lambda（API）章から日次・週次バッチを分離し、独立した「バッチ処理コンポーネント（EventBridge Scheduler 配下）」章として再構成 |
| 追加修正: component-methods.md の interface 整理 | AuthClientWrapper → AuthClientMethods に改名。BehaviorModel 内部構造詳細（TimePattern/ResponsePattern/ActionLevelTendency/GoalPreference）/ AutoTriggerInput / BatchResult / ExpireTicketsResult / DailyAggregationResult を削除 |
| 追加修正: Amplify UI Authenticator 採用 | AuthScreens / AuthService / AuthClientMethods / 認証系リクエスト型を削除。アカウント削除のみ AccountService + AccountLambda でアプリ独自実装。authStore は `useAuthenticator` フックから取得した情報を他画面に共有するため残す |

---

## 修正実行結果

全 9 項目のカテゴリ（requirements / components / component-dependency / component-methods / services / application-design / plans）について、指摘事項.md の全指摘を反映済み。

### 追加修正（指摘事項.md 第2ラウンド）

- [x] FR-06-4 を requirements.md から削除（「Recommendationを無視して別の行動」の意図曖昧）
- [x] FR-07-1 を「行動完了時に Action_Log へリアルタイム記録、週次バッチで Profile 更新」に修正
- [x] FR-02-6 を削除（FR-07-1 と重複）
- [x] FR-08-3 の Persona_Message 生成元を ActionTicketLambda + Bedrock に確定（A方針）。`CompleteTicketResult.personaMessage`、`generateCompletionMessage` を追加
- [x] FR-12-1 から「センシティブデータ」を削除、位置情報のみに絞る（NFR-03-2 も修正）
- [x] NFR-02-1 を「HomeScreen 表示まで3秒以内、Recommendation 生成は非同期」に修正
- [x] FR-11-3 学習データリセットを UserLambda の `POST /me/learning-data/reset` として設計。ProfileService に `resetLearningData` を追加、component-dependency に学習データリセットフロー図11を追加
- [x] OnboardingScreens の責務に「データ収集同意画面」を追加（FR-09-5/FR-12-1）。User エンティティに `consent` フィールドを追加
- [x] DailyAggregationLambda の `buildDiscardMessage` を Bedrock 呼び出しに変更し、FR-13-5/FR-13-6/FR-08-8 の3ケースを判別するコンテキスト型 `DiscardMessageContext` を追加
- [x] StatsLambda の集計戦略を確定：累計は `UserStats` アトミックカウンター、週/月は DailySummary Query、日次は 1 GetItem or EffortPointRecord 集計
- [x] `UserStats` エンティティを ActionLogDB に追加、ActionTicketLambda.completeTicket にアトミック更新ステップ追加、`checkMilestone` シグネチャを `(totalPoints, lastMilestoneValue)` に変更

次のステップ: ユーザーへ完了報告 → Application Design の最終承認を依頼。

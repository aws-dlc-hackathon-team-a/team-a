# コンポーネントメソッド定義 — だが、それでいい（DagaSoreDeIi_App）

## 目次

- [概要](#概要)
- [Frontend サービス層](#frontend-サービス層)
  - [AccountService](#accountservice)
  - [ProfileService](#profileservice)
  - [GoalService](#goalservice)
  - [TriggerService](#triggerservice)
  - [RecommendationService](#recommendationservice)
  - [ActionTicketService](#actiontickectservice)
  - [StatsService](#statsservice)
- [Frontend コンポーネント](#frontend-コンポーネント)
  - [APIClient](#apiclient)
  - [Zustand Stores](#zustand-stores)
  - [FrontendErrorHandler](#frontenderrorhandler)
- [Backend Lambda](#backend-lambda)
  - [AccountLambda](#accountlambda)
  - [UserLambda](#userlambda)
  - [ActionTicketLambda](#actiontickectlambda)
  - [RecommendationLambda](#recommendationlambda)
  - [DailyAggregationLambda](#dailyaggregationlambda)
  - [StatsLambda](#statslambda)
  - [LearningEngineLambda](#learningenginelambda)
  - [BackendErrorHandler](#backenderrorhandler)
- [型定義](#型定義)
  - [UserDB 格納エンティティ型定義](#userdb-格納エンティティ型定義)
  - [ActionLogDB 格納エンティティ型定義](#actionlogdb-格納エンティティ型定義)
  - [SimilarUserDB 格納エンティティ型定義](#similaruserdb-格納エンティティ型定義)
  - [共通ドメイン型](#共通ドメイン型)
  - [リクエスト/レスポンス型](#リクエストレスポンス型)

---

## 概要

各コンポーネントの主要メソッドシグネチャと、各データストアが保持する型定義を定義する。
詳細なビジネスロジック（バリデーションルール・アルゴリズム詳細）はCONSTRUCTION PHASEのFunctional Designで定義する。

**Service 層の実装方針**: 各 `XxxService` はインターフェース（TypeScript interface）として定義する。実装は React Query の `useQuery` / `useMutation` を用いたカスタムフック群になるが、本ドキュメントでは外部から見える操作のシグネチャを示す。画面コンポーネントは Service の各メソッドをカスタムフック経由で呼び出す。

**認可方針**: 全 Backend Lambda は **API Gateway の Cognito Authorizer** で JWT 検証（署名・有効期限）を行った上で実行される。Lambda 内では **JWT claims の `sub`** を認証済みの `userId` として使用する。API エンドポイントは `/me/...` 形式を採用し、URL path に userId を含めない。これにより path userId と JWT sub の一致確認（認可チェック）は不要となり、他ユーザーデータへの横アクセスが構造上発生しない。

- Frontend Service / Lambda の `userId: string` パラメータは便宜上のものであり、バックエンドでは JWT から取得する
- Frontend Service はエンドポイントを呼ぶだけで、userId を手動で指定する必要がない

**認証 UI の扱い**: サインアップ・サインイン・パスワードリセット・メール確認は **Amplify UI Authenticator** が一括提供するため、アプリ独自の AuthService / AuthScreens は定義しない。アカウント削除のみ独自実装が必要なため、`AccountService` として分離する。

---

## Frontend サービス層

### AccountService

Amplify UI Authenticator が提供しないアカウント削除機能のみを担うサービス。AccountLambda と 1:1 で対応する。

```typescript
interface AccountService {
  // アカウント削除。AccountLambda 呼び出し後、Amplify Auth の signOut も実施する
  deleteAccount(): Promise<void>;
}
```

### ProfileService

```typescript
interface ProfileService {
  getProfile(userId: string): Promise<Profile>;
  updateProfile(userId: string, updates: ProfileUpdate): Promise<Profile>;
  getProfileHistory(userId: string): Promise<ProfileUpdateHistory[]>;
  // field 単位のAIサジェスト（nickname/occupation/interests/currentConcerns 等）
  getProfileSuggestion(field: ProfileField, partialInput: string): Promise<string[]>;
  // FR-11-3: 学習データリセット
  // UserDB の BehaviorModel・FutureSelfModel、ActionLogDB の ActionLogEntry をリセットする
  resetLearningData(): Promise<void>;
}
```

### GoalService

```typescript
interface GoalService {
  getGoals(userId: string): Promise<Goal[]>;
  createGoal(userId: string, input: CreateGoalInput): Promise<Goal>;
  updateGoal(userId: string, input: UpdateGoalInput): Promise<Goal>;
  deleteGoal(userId: string, goalId: string): Promise<void>;
  setPrimaryGoal(userId: string, goalId: string): Promise<void>;
  updateGoalPriority(userId: string, input: UpdatePriorityInput): Promise<void>;
  // オンボーディング時のPivot_Goal自動生成
  generateInitialPivotGoals(userId: string): Promise<Goal[]>;
  // FR-07-2 の昇格候補取得（HomeScreen 起動時にバナー表示判定に使用）
  getPromotionCandidates(userId: string): Promise<PromotionCandidate[]>;
  // 昇格承認（候補の Goal を Primary_Goal に昇格）
  promoteCandidate(userId: string, candidateGoalId: string): Promise<Goal>;
}
```

### TriggerService

```typescript
interface TriggerService {
  // Open Ticket 0件判定。ActionTicketService.getOpenTickets の結果から判定する
  checkAutoTrigger(): Promise<{ shouldTrigger: boolean }>;
  // 手動Triggerボタンタップ時に発火。心理状態入力後にRecommendation生成フローへ
  manualTrigger(input: ManualTriggerInput): Promise<Recommendation>;
  // checkAutoTrigger が true の時に HomeScreen から呼び出されるRecommendation生成
  autoTrigger(): Promise<Recommendation>;
}
```

### RecommendationService

```typescript
interface RecommendationService {
  generateRecommendation(userId: string, input: RecommendationInput): Promise<Recommendation>;
  generatePivot(userId: string, input: PivotInput): Promise<Recommendation>;
  // Recommendation からActionStep一覧を生成（Bedrock呼び出し）
  generateActionSteps(userId: string, recommendation: Recommendation): Promise<ActionStep[]>;
  // 4択応答（やる / いいえ / 目標チェンジ / 自由入力）→ ActionTicket生成まで
  respondToRecommendation(userId: string, response: RecommendationResponse): Promise<ActionTicket>;
}
```

### ActionTicketService

```typescript
interface ActionTicketService {
  getOpenTickets(userId: string): Promise<ActionTicket[]>;
  completeTicket(userId: string, ticketId: string): Promise<CompleteTicketResult>;
  createTicket(userId: string, input: CreateTicketInput): Promise<ActionTicket>;
  // ActionTicketScreens の「破棄履歴タブ」で呼び出す（FR-13-7）
  getExpiredHistory(userId: string): Promise<ExpiredTicket[]>;
}
```

### StatsService

Effort_Point・集計データ・破棄メッセージの取得を StatsLambda へのAPI呼び出しとして束ねるサービス（旧 `EffortPointService` を改名）。

```typescript
interface StatsService {
  getTotalPoints(userId: string): Promise<number>;
  getDailySummary(userId: string, date: string): Promise<DailySummary>;
  getWeeklySummary(userId: string, weekStart: string): Promise<WeeklySummary>;
  getMonthlySummary(userId: string, month: string): Promise<MonthlySummary>;
  // 次回アプリ起動時の破棄メッセージ表示に使用（FR-13-5/FR-13-6）
  getLatestDiscardMessage(userId: string): Promise<DiscardMessage | null>;
}
```

---

## Frontend コンポーネント

### APIClient

```typescript
// React Query + axios ベース
interface APIClient {
  get<T>(path: string, params?: Record<string, unknown>): Promise<T>;
  post<T>(path: string, body: unknown): Promise<T>;
  put<T>(path: string, body: unknown): Promise<T>;
  delete<T>(path: string): Promise<T>;
}
```

### Zustand Stores

Application Design で確定する3ストアのみ型定義する。`profileStore` / `goalStore` / `effortPointStore` は Construction Phase の Functional Design で Zustand か React Query キャッシュか実装方針を決定する。

```typescript
// 認証ストア
interface AuthStore {
  user: CognitoUser | null;
  isAuthenticated: boolean;
  setUser(user: CognitoUser | null): void;
  clearAuth(): void;
}

// Action_Ticketストア
interface TicketStore {
  openTickets: ActionTicket[];
  setOpenTickets(tickets: ActionTicket[]): void;
  markTicketDone(ticketId: string): void;
  addTicket(ticket: ActionTicket): void;
}

// Recommendationストア
interface RecommendationStore {
  currentRecommendation: Recommendation | null;
  currentActionSteps: ActionStep[] | null;
  recommendationState: RecommendationState;
  mentalState: string | null; // 手動Trigger時の任意入力（Persona_Messageパーソナライズ用）
  setRecommendation(rec: Recommendation): void;
  setActionSteps(steps: ActionStep[]): void;
  setRecommendationState(state: RecommendationState): void;
  setMentalState(state: string): void;
  clearRecommendation(): void;
}
```

### FrontendErrorHandler

```typescript
interface FrontendErrorHandler {
  handleAPIError(error: APIError): UserFacingError;
  handleBedrockTimeout(): FallbackMessage;
  handleNetworkError(): UserFacingError;
  getFallbackRecommendation(): FallbackRecommendation;
  getFallbackPersonaMessage(context: MessageContext): string;
}
```

---

## Backend Lambda

### AccountLambda

```typescript
// DELETE /me
async function deleteAccount(event: APIGatewayEvent): Promise<DeleteAccountResult>;
// 内部処理:
//   1. userId = getUserIdFromToken(event) — JWT claims の sub から取得
//   2. deleteUserData(userId) — UserDB から全ユーザーデータ削除
//   3. deleteActionLogData(userId) — ActionLogDB から全行動ログ削除
//   4. deleteCognitoUser(userId) — Cognito からユーザー削除
//   5. 削除完了レスポンス返却
//   ※ SimilarUserDBは匿名化済みのため削除対象外
//   ※ path userId は受け取らないため、path userId と JWT sub の一致確認は不要

// 全 Lambda 共通のヘルパー（BackendErrorHandler に配置）
function getUserIdFromToken(event: APIGatewayEvent): string; // event.requestContext.authorizer.claims.sub を返す
```

### UserLambda

```typescript
// Profile CRUD
async function getProfile(userId: string): Promise<Profile>;
async function updateProfile(userId: string, updates: ProfileUpdate): Promise<Profile>;
async function getProfileUpdateHistory(userId: string): Promise<ProfileUpdateHistory[]>;

// AI サジェスト（Bedrock）
async function getProfileInputSuggestion(field: ProfileField, partialInput: string): Promise<string[]>;
async function generateInitialPivotGoals(userId: string, profile: Profile): Promise<Goal[]>;

// Goal CRUD
async function getGoals(userId: string): Promise<Goal[]>;
async function createGoal(userId: string, goal: CreateGoalInput): Promise<Goal>;
async function updateGoal(userId: string, goalId: string, updates: GoalUpdate): Promise<Goal>;
async function deleteGoal(userId: string, goalId: string): Promise<void>;
async function setPrimaryGoal(userId: string, goalId: string): Promise<void>;
async function updateGoalPriority(userId: string, goalId: string, priority: number): Promise<void>;

// Pivot_Goal 昇格候補（FR-07-2）
async function getPromotionCandidates(userId: string): Promise<PromotionCandidate[]>;
async function promoteCandidate(userId: string, candidateGoalId: string): Promise<Goal>;

// 学習データリセット（FR-11-3）
// UserDB の BehaviorModel・FutureSelfModel をリセットし、ActionLogDB の ActionLogEntry を全削除する
// ActionTicket / EffortPointRecord / DailySummary / Milestone / UserStats は保持する（ユーザーの実績として残す）
async function resetLearningData(userId: string): Promise<void>;
```

### ActionTicketLambda

```typescript
// Ticket 操作
async function createTicket(userId: string, input: CreateTicketInput): Promise<ActionTicket>;
async function getOpenTickets(userId: string): Promise<ActionTicket[]>;
async function completeTicket(userId: string, ticketId: string): Promise<CompleteTicketResult>;
// completeTicket 内部:
//   1. ActionLogDB に ActionLogEntry 書き込み（リアルタイム）
//   2. calculatePoints() でポイント計算
//   3. ActionLogDB に EffortPointRecord 書き込み
//   4. ActionLogDB の UserStats を UpdateItem ADD で原子更新
//      （totalPoints += points、totalCompletedTickets += 1）、更新後の値を取得
//   5. checkMilestone(updatedTotalPoints, userStats.lastMilestoneValue) でマイルストーン判定
//      — 到達時は UserStats.lastMilestoneValue を更新（重複通知防止）
//   6. UserDB から Profile・FutureSelfModel を取得、ActionLogDB から直近Action_Logを取得
//   7. generateCompletionMessage() で Bedrock を呼び出し Persona_Message 生成（FR-08-3/FR-10-3/FR-10-4）
//      — マイルストーン達成時は称賛トーン、Primary完了時は FR-10-5、Pivot完了時は FR-10-6 のトーン
//      — Bedrockタイムアウト/エラー時は BackendErrorHandler 経由でフォールバックメッセージを使用
//   8. CompleteTicketResult { ticket, pointsAwarded, totalPoints, milestoneReached, personaMessage } を返却

// 破棄履歴取得（FR-13-7）
async function getExpiredTicketHistory(userId: string): Promise<ExpiredTicket[]>;

// Effort_Point 計算（純粋関数 — PBT対象）
function calculatePoints(goalType: GoalType, actionLevel: ActionLevel): number;

// マイルストーン判定（純粋関数 — PBT対象）
// lastMilestoneValue を比較して、前回通知済みのマイルストーンを超えた場合のみ Milestone を返す
function checkMilestone(totalPoints: number, lastMilestoneValue: number): Milestone | null;

// Done申告時の Persona_Message 生成（Bedrock呼び出し）
async function generateCompletionMessage(
  userId: string,
  context: CompletionMessageContext, // { ticket, goalType, actionLevel, pointsAwarded, totalPoints, milestoneReached, profile, futureSelfModel, recentActionLogs }
): Promise<string>;
```

### RecommendationLambda

```typescript
// Recommendation 生成
async function generateRecommendation(
  userId: string,
  input: RecommendationInput, // { triggerType, mentalState?, goalId }
): Promise<Recommendation>;

// Pivot 提案
async function generatePivotRecommendation(
  userId: string,
  input: PivotInput, // { currentGoalId, pivotType: 'alternative_method' | 'goal_change' | 'minimal' }
): Promise<Recommendation>;

// Action Step 生成（Recommendation をユーザーが「やる」と受け入れる前に具体的な手順を生成）
async function generateActionSteps(userId: string, recommendation: Recommendation): Promise<ActionStep[]>;

// 内部: プロンプト選択
function selectPromptStrategy(actionLogCount: number): "default" | "personalized";
```

### DailyAggregationLambda

```typescript
// 日次バッチエントリーポイント（EventBridge 毎日0時トリガー）
// 全ユーザーをループ処理。戻り値の構造は Construction Phase で詳細化
async function runDailyBatch(): Promise<void>;

// 単一ユーザーに対する処理
async function expireTickets(userId: string): Promise<void>;
async function runDailyAggregation(userId: string): Promise<DailySummary>;

// 破棄メッセージ生成（Bedrock呼び出し）
// FR-13-5/FR-13-6/FR-08-8 の3ケースをコンテキストから判別してPersona_Messageトーンで生成する
// Bedrockタイムアウト/エラー時は BackendErrorHandler のフォールバックテンプレートを使用
async function buildDiscardMessage(
  userId: string,
  context: DiscardMessageContext, // { summary: DailySummary, profile: Profile, futureSelfModel: FutureSelfModel }
): Promise<string>;
```

### StatsLambda

```typescript
// 集計データ取得（API Gateway トリガー）

// 当日分は EffortPointRecord を Query して集計、過去日は DailySummary を 1 GetItem
async function getDailySummary(userId: string, date: string): Promise<DailySummary>;

// DailySummary を直近7日分 Query して週単位で集計（StatsLambda 内でサマリー組み立て）
async function getWeeklySummary(userId: string, weekStart: string): Promise<WeeklySummary>;

// DailySummary を該当月分 Query して月単位で集計
async function getMonthlySummary(userId: string, month: string): Promise<MonthlySummary>;

// UserStats を 1 GetItem で取得（アトミックカウンターで維持されているため集計不要）
async function getTotalPoints(userId: string): Promise<number>;

// 次回アプリ起動時にフロントが表示する「最新の破棄メッセージ」取得
async function getLatestDiscardMessage(userId: string): Promise<DiscardMessage | null>;
```

### LearningEngineLambda

```typescript
// 週次バッチエントリーポイント（EventBridge 毎週月曜0時トリガー）
// 戻り値の構造は Construction Phase で詳細化
async function runWeeklyBatch(): Promise<void>;

// 行動モデル構築
async function buildBehaviorModel(userId: string, actionLogs: ActionLogEntry[]): Promise<BehaviorModel>;

// Profile 更新
async function updateProfileBehaviorTrends(userId: string, behaviorModel: BehaviorModel): Promise<void>;

// Future Self Model 更新
async function updateFutureSelfModel(userId: string, behaviorModel: BehaviorModel): Promise<void>;

// Pivot_Goal 昇格候補フラグ更新（FR-07-2）— 連続3日以上 or 応答率80%超を判定して Goal.promotionCandidate=true に設定
async function checkPivotGoalPromotion(userId: string): Promise<PromotionCandidate[]>;

// 得意パターン分析（FR-07-3）
async function analyzeStrengthPatterns(userId: string, logs: ActionLogEntry[]): Promise<StrengthPattern[]>;
```

### BackendErrorHandler

```typescript
// 共通エラーハンドリングミドルウェア
function withErrorHandling<T>(handler: LambdaHandler<T>): LambdaHandler<T>;

// JWT claims から userId を取得する共通ヘルパー
// API Gateway の Cognito Authorizer が event.requestContext.authorizer.claims に claims をセット済みの前提
function getUserIdFromToken(event: APIGatewayEvent): string;

function handleBedrockError(error: BedrockError): FallbackResponse;
function handleDynamoDBError(error: DynamoDBError): APIError;
function createErrorResponse(statusCode: number, message: string): APIGatewayResponse;
```

---

## 型定義

### UserDB 格納エンティティ型定義

```typescript
// Users テーブルのアイテム（PK: userId = Cognito sub）
interface User {
  userId: string; // Cognito sub
  email: string;
  createdAt: string;
  accountStatus: "active" | "deleting";
  // データ収集同意（オンボーディング時に明示的取得。FR-09-5/FR-12-1）
  consent: {
    similarUserDataCollection: boolean; // FR-09-5: Similar_User_Data 収集・利用同意（v1 は同意UIのみ、収集はv2）
    locationData: boolean; // FR-12-1: 位置情報収集同意（v1 はサーバー送信なし、UIのみ）
    agreedAt: string; // 同意取得日時
  };
}

interface Profile {
  userId: string;
  nickname: string;
  age: number;
  occupation: string;
  interests: string[];
  lifestyleType: "morning" | "night";
  currentConcerns: string;
  isOnboardingComplete: boolean;
  behaviorTrends?: BehaviorTrend[]; // 週次バッチで更新
  strengthPatterns?: StrengthPattern[]; // 週次バッチで更新
  updatedAt: string;
}

interface ProfileUpdateHistory {
  userId: string;
  updatedAt: string;
  changedFields: string[];
  previousValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
  updateSource: "user" | "batch"; // ユーザー手動 or 週次バッチ
}

interface Goal {
  goalId: string;
  userId: string;
  title: string;
  description: string;
  isPrimary: boolean;
  priority: number;
  isAIGenerated: boolean;
  // FR-07-2 昇格候補フラグ。週次バッチで更新
  promotionCandidate: boolean;
  promotionDetectedAt?: string;
  createdAt: string;
}

interface TriggerSettings {
  userId: string;
  // v1 は手動Triggerのみ。フィールドは v2 の位置情報Trigger等のために予約
  manualTriggerEnabled: boolean;
  // v2 以降: locationTriggerEnabled, locationTriggerRadius 等
  updatedAt: string;
}

interface FutureSelfModel {
  userId: string;
  // v1 はモックデータまたは Profile+Goal 推定モデル
  source: "mock" | "estimated" | "similar_user"; // v1 は "mock" or "estimated" のみ
  personaAttributes: Record<string, string>; // 口調・語彙・スタイル情報
  narrativeTemplate: string; // 「似た状況だった人は…」のテンプレート
  updatedAt: string;
}

interface BehaviorModel {
  userId: string;
  // 行動モデルの詳細構造（時間帯・曜日パターン・Yes/No傾向・actionLevel傾向・Goal選択傾向）
  // の具体的な内部フィールドは Construction Phase の Functional Design で定義する
  actionLogCount: number; // 7件閾値判定用（FR-11-2）
  updatedAt: string;
}

interface BehaviorTrend {
  category: string; // 例: 英語学習 / 筋トレ
  frequency: number; // 週あたり頻度
  lastOccurrence: string;
}

interface StrengthPattern {
  patternLabel: string; // 例: 「朝の短時間行動」
  confidence: number; // 0-1
  evidenceCount: number;
}

interface PromotionCandidate {
  candidateGoalId: string;
  userId: string;
  detectedAt: string;
  reason: "consecutive_3_days" | "response_rate_over_80";
  metric: number; // 連続日数 or 応答率
}
```

### ActionLogDB 格納エンティティ型定義

```typescript
// ActionLogDB の中核。「誰が」「どのチケットを」「どうしたか」を表す
interface ActionLogEntry {
  logId: string;
  userId: string;
  ticketId: string;
  goalId: string;
  goalType: GoalType;
  actionLevel: ActionLevel;
  actionType: "done" | "expire"; // done=完了申告 / expire=自動破棄
  pointsAwarded: number; // expire の場合は 0
  timestamp: string;
}

interface ActionTicket {
  ticketId: string;
  userId: string;
  goalId: string;
  goalType: GoalType;
  actionLevel: ActionLevel;
  content: string; // Action_Ticket の行動内容。ActionStep を結合したテキスト
  actionSteps: ActionStep[];
  status: TicketStatus;
  createdAt: string;
  completedAt?: string;
  expiredAt?: string;
}

interface EffortPointRecord {
  recordId: string;
  userId: string;
  ticketId: string;
  points: number;
  goalType: GoalType;
  actionLevel: ActionLevel;
  earnedAt: string;
}

interface DailySummary {
  userId: string;
  date: string; // YYYY-MM-DD
  totalPoints: number;
  completedTickets: number;
  expiredTickets: number;
  primaryCompletedCount: number;
  pivotCompletedCount: number;
  // 破棄メッセージ本文（FR-13-5/FR-13-6）。次回アプリ起動時にフロントが取得して表示
  discardMessage: string;
  createdAt: string;
}

interface Milestone {
  userId: string;
  milestoneValue: number; // 100, 200, 300...
  reachedAt: string;
  badgeId: string;
}

interface ExpiredTicket {
  ticketId: string;
  userId: string;
  goalId: string;
  content: string;
  expiredAt: string;
}

// ユーザー単位の累計統計（DynamoDB のアトミックカウンターで更新）
// ActionTicketLambda.completeTicket 内で UpdateItem ADD により原子更新する
// StatsLambda.getTotalPoints は本アイテムを 1 GetItem で取得する
interface UserStats {
  userId: string; // PK
  recordType: "stats"; // SK（固定値。ActionLogDB内のUserStats用レコードであることを識別）
  totalPoints: number; // 累計Effort_Point（ADD で更新）
  totalCompletedTickets: number; // 累計完了チケット数（ADD で更新）
  lastMilestoneValue: number; // 直近到達したマイルストーン（100の倍数、重複通知防止用）
  updatedAt: string;
}

// Recommendation に含まれる具体的な行動手順
interface ActionStep {
  stepNumber: number;
  description: string;
  estimatedMinutes?: number;
}
```

### SimilarUserDB 格納エンティティ型定義

```typescript
// v1 はモックデータのみ。実データ収集は v2 以降
interface SimilarUserData {
  anonymizedId: string; // 匿名化済みID（v2以降で本番利用）
  demographicHash: string; // 年齢層・職業カテゴリ等を匿名化したハッシュ
  interests: string[];
  goalCategories: string[];
  outcomeSummary: string; // 「〇〇を始めて△ヶ月でこうなった」形式
  createdAt: string;
}
```

### 共通ドメイン型

```typescript
type GoalType = "primary" | "pivot";
type ActionLevel = "normal" | "minimal";
type TicketStatus = "open" | "done" | "expired";
type RecommendationState = "idle" | "loading" | "active" | "pivot" | "done";
type ProfileField = "nickname" | "occupation" | "interests" | "currentConcerns";

interface Recommendation {
  recommendationId: string;
  userId: string;
  goalId: string;
  goalType: GoalType;
  actionLevel: ActionLevel;
  message: string; // Persona_Message
  actionContent: string;
  createdAt: string;
}

interface DiscardMessage {
  date: string;
  message: string;
  completedCount: number;
  expiredCount: number;
}

// Done申告時のレスポンス（FR-08-3: Persona_Message を含む）
interface CompleteTicketResult {
  ticket: ActionTicket;
  pointsAwarded: number;
  totalPoints: number;
  milestoneReached: Milestone | null;
  // ActionTicketLambda が Bedrock を呼び出して生成した Persona_Message
  // Primary達成時は FR-10-5 のトーン、Pivot達成時は FR-10-6 のトーン、
  // マイルストーン達成時は特別な称賛メッセージを含む
  personaMessage: string;
}

// ActionTicketLambda の generateCompletionMessage に渡すコンテキスト
interface CompletionMessageContext {
  ticket: ActionTicket;
  goalType: GoalType;
  actionLevel: ActionLevel;
  pointsAwarded: number;
  totalPoints: number;
  milestoneReached: Milestone | null;
  profile: Profile;
  futureSelfModel: FutureSelfModel;
  recentActionLogs: ActionLogEntry[];
}

// DailyAggregationLambda の buildDiscardMessage に渡すコンテキスト
// FR-13-5/FR-13-6/FR-08-8 の3ケースをプロンプトで判別できるよう、必要なデータをまとめて渡す
interface DiscardMessageContext {
  summary: DailySummary;
  profile: Profile;
  futureSelfModel: FutureSelfModel;
}
```

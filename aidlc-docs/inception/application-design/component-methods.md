# コンポーネントメソッド定義 — だが、それでいい（DagaSoreDeIi_App）

## 概要

各コンポーネントの主要メソッドシグネチャを定義する。
詳細なビジネスロジック（バリデーションルール・アルゴリズム詳細）はCONSTRUCTION PHASEのFunctional Designで定義する。

---

## 1. AuthService（Frontend）

```typescript
// Amplify Auth ラッパー
interface AuthService {
  signUp(email: string, password: string): Promise<SignUpResult>;
  confirmSignUp(email: string, code: string): Promise<void>;
  resendConfirmationCode(email: string): Promise<void>;
  signIn(email: string, password: string): Promise<SignInResult>;
  signOut(): Promise<void>;
  forgotPassword(email: string): Promise<void>;
  confirmForgotPassword(email: string, code: string, newPassword: string): Promise<void>;
  getCurrentSession(): Promise<AuthSession | null>;
  getIdToken(): Promise<string>;
}
```

---

## 2. APIClient

```typescript
// React Query + axios ベース
interface APIClient {
  get<T>(path: string, params?: Record<string, unknown>): Promise<T>;
  post<T>(path: string, body: unknown): Promise<T>;
  put<T>(path: string, body: unknown): Promise<T>;
  delete<T>(path: string): Promise<T>;
  // React Query hooks（各ドメインサービスから使用）
  useQuery<T>(queryKey: QueryKey, fetcher: () => Promise<T>): UseQueryResult<T>;
  useMutation<T, V>(mutationFn: (variables: V) => Promise<T>): UseMutationResult<T, V>;
}
```

---

## 3. ZustandStore

```typescript
// 認証スライス
interface AuthSlice {
  user: CognitoUser | null;
  isAuthenticated: boolean;
  setUser(user: CognitoUser | null): void;
  clearAuth(): void;
}

// プロフィールスライス
interface ProfileSlice {
  profile: Profile | null;
  isOnboardingComplete: boolean;
  setProfile(profile: Profile): void;
}

// Goalスライス
interface GoalSlice {
  goals: Goal[];
  primaryGoal: Goal | null;
  setGoals(goals: Goal[]): void;
  setPrimaryGoal(goalId: string): void;
}

// Action_Ticketスライス
interface TicketSlice {
  openTickets: ActionTicket[];
  setOpenTickets(tickets: ActionTicket[]): void;
  markTicketDone(ticketId: string): void;
}

// Recommendationスライス
interface RecommendationSlice {
  currentRecommendation: Recommendation | null;
  recommendationState: "idle" | "loading" | "active" | "pivot" | "done";
  setRecommendation(rec: Recommendation): void;
  setRecommendationState(state: RecommendationState): void;
}

// Effort_Pointスライス
interface EffortPointSlice {
  totalPoints: number;
  todayPoints: number;
  setTotalPoints(points: number): void;
  addPoints(points: number): void;
}
```

---

## 4. FrontendErrorHandler

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

## 5. AccountLambda

```typescript
// DELETE /users/{userId}
async function deleteAccount(userId: string): Promise<DeleteAccountResult>;
// 内部処理:
//   1. UserDB から全ユーザーデータ削除
//   2. ActionLogDB から全行動ログ削除
//   3. SimilarUserDB から関連データ削除
//   4. Cognito からユーザー削除
//   5. 削除完了レスポンス返却
```

---

## 6. UserLambda

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
```

---

## 7. ActionTicketLambda

```typescript
// Ticket 操作
async function createTicket(userId: string, input: CreateTicketInput): Promise<ActionTicket>;
async function getOpenTickets(userId: string): Promise<ActionTicket[]>;
async function completeTicket(userId: string, ticketId: string): Promise<CompleteTicketResult>;
// completeTicket 内部:
//   1. ActionLogDB に ActionLogEntry 書き込み（リアルタイム）
//   2. calculatePoints() でポイント計算
//   3. ActionLogDB に EffortPointRecord 書き込み
//   4. checkMilestone() でマイルストーン判定
//   5. CompleteTicketResult 返却

// 自動破棄（EventBridge トリガー）
async function expireTickets(userId: string, aggregationTime: number): Promise<ExpireTicketsResult>;
async function getExpiredTicketHistory(userId: string): Promise<ExpiredTicket[]>;

// Effort_Point 計算（純粋関数 — PBT対象）
function calculatePoints(goalType: "primary" | "pivot", actionLevel: "normal" | "minimal"): number;

// マイルストーン判定
async function checkMilestone(userId: string, totalPoints: number): Promise<Milestone | null>;
```

---

## 8. RecommendationLambda

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

// Action Step 生成
async function generateActionSteps(userId: string, recommendation: Recommendation): Promise<ActionStep[]>;

// 内部: プロンプト選択
function selectPromptStrategy(actionLogCount: number): "default" | "personalized";
```

---

## 9. DailyAggregationLambda

```typescript
// 日次集計（EventBridge トリガー）
async function runDailyAggregation(userId: string): Promise<DailyAggregationResult>;

// 集計データ取得（API Gateway トリガー）
async function getDailySummary(userId: string, date: string): Promise<DailySummary>;
async function getWeeklySummary(userId: string, weekStart: string): Promise<WeeklySummary>;
async function getMonthlySummary(userId: string, month: string): Promise<MonthlySummary>;
async function getTotalPoints(userId: string): Promise<number>;
```

---

## 10. LearningEngineLambda

```typescript
// 週次バッチエントリーポイント（EventBridge トリガー）
async function runWeeklyBatch(): Promise<BatchResult>;

// 行動モデル構築
async function buildBehaviorModel(userId: string, actionLogs: ActionLogEntry[]): Promise<BehaviorModel>;

// Profile 更新
async function updateProfileBehaviorTrends(userId: string, behaviorModel: BehaviorModel): Promise<void>;

// Future Self Model 更新
async function updateFutureSelfModel(userId: string, behaviorModel: BehaviorModel): Promise<void>;

// Pivot_Goal 昇格チェック
async function checkPivotGoalPromotion(userId: string): Promise<PromotionCandidate[]>;

// 得意パターン分析
async function analyzeStrengthPatterns(userId: string, logs: ActionLogEntry[]): Promise<StrengthPattern[]>;
```

---

## 11. BackendErrorHandler

```typescript
// 共通エラーハンドリングミドルウェア
function withErrorHandling<T>(handler: LambdaHandler<T>): LambdaHandler<T>;

function handleBedrockError(error: BedrockError): FallbackResponse;
function handleDynamoDBError(error: DynamoDBError): APIError;
function createErrorResponse(statusCode: number, message: string): APIGatewayResponse;
```

---

## 型定義（主要）

```typescript
// ドメイン型
type GoalType = "primary" | "pivot";
type ActionLevel = "normal" | "minimal";
type TicketStatus = "open" | "done" | "expired";
type RecommendationState = "idle" | "loading" | "active" | "pivot" | "done";

interface Profile {
  userId: string;
  nickname: string;
  age: number;
  occupation: string;
  interests: string[];
  lifestyleType: "morning" | "night";
  currentConcerns: string;
  behaviorTrends?: BehaviorTrend[];
  strengthPatterns?: StrengthPattern[];
  updatedAt: string;
}

interface Goal {
  goalId: string;
  userId: string;
  title: string;
  description: string;
  isPrimary: boolean;
  priority: number;
  isAIGenerated: boolean;
  createdAt: string;
}

interface ActionTicket {
  ticketId: string;
  userId: string;
  goalId: string;
  goalType: GoalType;
  actionLevel: ActionLevel;
  content: string;
  status: TicketStatus;
  createdAt: string;
  completedAt?: string;
  expiredAt?: string;
}

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

interface BehaviorModel {
  userId: string;
  timePatterns: TimePattern[]; // 時間帯・曜日パターン
  responsePatterns: ResponsePattern[]; // Yes/No傾向
  actionLevelTendency: ActionLevelTendency;
  goalPreference: GoalPreference; // Primary vs Pivot傾向
  updatedAt: string;
}
```

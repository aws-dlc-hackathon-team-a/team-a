# 設計ドキュメント: だが、それでいい（DagaSoreDeIi_App）

## 概要

「だが、それでいい」は、ユーザーが「今日も何かできた」を見つけるための行動支援アプリケーションです。従来の習慣トラッカーが「一つの習慣をストイックに継続させる」ことを目的とするのに対し、本アプリは目標通りにできた日を最高としつつも、別のことができた日も十分に価値があると捉えます。

### 設計の基本方針

- **Flexible Achievement First**: 0点か100点かではなく、何かできた日はみんな合格点
- **AI-Driven Personalization**: ユーザーのProfile・Action_Log・Future_Self_Modelを組み合わせたパーソナライズ
- **Persona-Centric UX**: すべてのメッセージを「未来の自分」が語りかけるスタイルで統一
- **Progressive Learning**: Learning_Engineによる継続的な最適化
- **Privacy by Design**: センシティブデータの明示的同意と匿名化

### スコープ（v1）

- アプリ内表示のみ（プッシュ通知はv2以降）
- アプリ起動時のState_Detection（バックグラウンドトリガーはv2以降）
- モバイルアプリ（iOS / Android）

---

## アーキテクチャ

### システム全体構成

```mermaid
graph TB
    subgraph Client["モバイルクライアント (iOS / Android)"]
        UI["UI Layer\n(React Native)"]
        LocalDB["Local Storage\n(SQLite / AsyncStorage)"]
        StateDetect["State Detection\nModule"]
    end

    subgraph Backend["バックエンド (AWS)"]
        APIGW["API Gateway"]
        AuthSvc["Auth Service\n(Cognito)"]
        ProfileSvc["Profile Service"]
        GoalSvc["Goal Service"]
        RecommendSvc["Recommendation Service"]
        TicketSvc["Action Ticket Service"]
        PointSvc["Effort Point Service"]
        LearningEngine["Learning Engine"]
        FutureSelfSvc["Future Self Model Service"]
        PersonaMsgSvc["Persona Message Service"]
    end

    subgraph AI["AI / ML Layer"]
        LLM["LLM\n(Amazon Bedrock)"]
        MLModel["Behavior Model\n(SageMaker)"]
    end

    subgraph DataStore["データストア"]
        UserDB["User DB\n(DynamoDB)"]
        ActionLogDB["Action Log DB\n(DynamoDB)"]
        SimilarUserDB["Similar User DB\n(DynamoDB - 匿名化)"]
        AnalyticsDB["Analytics DB\n(S3 + Athena)"]
    end

    UI --> StateDetect
    UI --> APIGW
    StateDetect --> UI
    APIGW --> AuthSvc
    APIGW --> ProfileSvc
    APIGW --> GoalSvc
    APIGW --> RecommendSvc
    APIGW --> TicketSvc
    APIGW --> PointSvc
    ProfileSvc --> UserDB
    GoalSvc --> UserDB
    RecommendSvc --> LearningEngine
    RecommendSvc --> FutureSelfSvc
    RecommendSvc --> PersonaMsgSvc
    TicketSvc --> ActionLogDB
    PointSvc --> ActionLogDB
    LearningEngine --> MLModel
    LearningEngine --> ActionLogDB
    FutureSelfSvc --> SimilarUserDB
    FutureSelfSvc --> MLModel
    PersonaMsgSvc --> LLM
    ActionLogDB --> AnalyticsDB
```

### アプリ起動時のフロー

```mermaid
sequenceDiagram
    participant User
    participant App as モバイルApp
    participant StateDetect as State Detection
    participant RecommendSvc as Recommendation Service
    participant LearningEngine as Learning Engine
    participant PersonaMsgSvc as Persona Message Service
    participant TicketSvc as Action Ticket Service

    User->>App: アプリ起動
    App->>StateDetect: 状態検知リクエスト
    StateDetect->>StateDetect: 位置情報・自己申告を評価
    StateDetect-->>App: Trigger発火 or なし

    alt Triggerあり
        App->>RecommendSvc: Recommendation生成リクエスト\n(Profile + Goal + ActionLog)
        RecommendSvc->>LearningEngine: パーソナライズモデル取得
        LearningEngine-->>RecommendSvc: 行動モデル
        RecommendSvc->>PersonaMsgSvc: Persona_Message生成
        PersonaMsgSvc-->>RecommendSvc: メッセージ
        RecommendSvc-->>App: Recommendation (4択付き)
        App-->>User: Recommendation表示

        User->>App: 4択応答（やる/別の方法/目標チェンジ/自由入力）
        App->>TicketSvc: Action_Ticket生成 (Open)
        TicketSvc-->>App: Ticket ID
        App-->>User: Action_Ticket確認表示
    else Triggerなし
        App-->>User: 通常ホーム画面表示
    end
```

### 1日の終わりのフロー（Effort Point集計）

```mermaid
sequenceDiagram
    participant Scheduler as スケジューラー (EventBridge)
    participant PointSvc as Effort Point Service
    participant TicketSvc as Action Ticket Service
    participant PersonaMsgSvc as Persona Message Service
    participant App as モバイルApp

    Scheduler->>PointSvc: 集計タイミング到達（デフォルト24:00）
    PointSvc->>TicketSvc: Done済みAction_Ticket取得
    TicketSvc-->>PointSvc: Done済みチケット一覧
    PointSvc->>PointSvc: Effort_Point計算\n(Primary:10pt / Pivot:7pt / 最低限:3pt)
    PointSvc->>PersonaMsgSvc: 肯定メッセージ生成
    PersonaMsgSvc-->>PointSvc: Persona_Message
    PointSvc->>TicketSvc: Open残チケット自動破棄
    TicketSvc-->>PointSvc: 破棄完了
    PointSvc-->>App: Effort_Point + メッセージ通知（アプリ内）
```

---

## コンポーネントとインターフェース

### 1. Profile Service

ユーザーのプロフィール情報を管理するサービス。

```typescript
interface ProfileService {
  // プロフィール作成（オンボーディング）
  createProfile(userId: string, data: ProfileInput): Promise<Profile>;
  
  // プロフィール取得
  getProfile(userId: string): Promise<Profile>;
  
  // プロフィール更新（ユーザー手動）
  updateProfile(userId: string, data: Partial<ProfileInput>): Promise<Profile>;
  
  // プロフィール自動更新（Learning_Engine経由）
  autoUpdateProfile(userId: string, actionLog: ActionLog): Promise<Profile>;
  
  // 更新履歴取得
  getUpdateHistory(userId: string): Promise<ProfileUpdateHistory[]>;
  
  // 得意な行動パターン分析（過去30日）
  analyzeBehaviorPattern(userId: string): Promise<BehaviorPattern>;
  
  // オンボーディング完了チェック
  isOnboardingComplete(userId: string): Promise<boolean>;
}
```

### 2. Goal Service

Goalの管理（CRUD・Primary/Pivot切り替え）を担当するサービス。

```typescript
interface GoalService {
  // Goal作成
  createGoal(userId: string, data: GoalInput): Promise<Goal>;
  
  // Goal一覧取得
  listGoals(userId: string): Promise<Goal[]>;
  
  // Goal更新
  updateGoal(userId: string, goalId: string, data: Partial<GoalInput>): Promise<Goal>;
  
  // Goal削除（確認フラグ付き）
  deleteGoal(userId: string, goalId: string, confirmed: boolean): Promise<void>;
  
  // Primary_Goal設定
  setPrimaryGoal(userId: string, goalId: string): Promise<Goal>;
  
  // Pivot_Goal候補取得（Primary以外）
  getPivotGoalCandidates(userId: string): Promise<Goal[]>;
  
  // AIによるPivot候補生成（Pivot_Goalが存在しない場合）
  generateAIPivotCandidates(userId: string): Promise<AIPivotCandidate[]>;
}
```

### 3. State Detection Module（クライアントサイド）

アプリ起動時にユーザーの状態を検知し、Triggerを評価するモジュール。

```typescript
interface StateDetectionModule {
  // 状態検知実行（アプリ起動時）
  detectState(userId: string): Promise<DetectedState>;
  
  // Trigger評価
  evaluateTriggers(state: DetectedState, settings: TriggerSettings): Promise<Trigger | null>;
  
  // 位置情報取得（権限チェック付き）
  getLocationIfPermitted(): Promise<Location | null>;
  
  // 心理状態入力受付
  acceptPsychologicalInput(input: string): Promise<PsychologicalState>;
  
  // Triggerソース設定取得
  getTriggerSettings(userId: string): Promise<TriggerSettings>;
  
  // 複数Trigger優先度評価
  selectHighestPriorityTrigger(triggers: Trigger[]): Trigger;
}
```

### 4. Recommendation Service

Triggerに基づいてRecommendationを生成するサービス。

```typescript
interface RecommendationService {
  // 初回Recommendation生成（Primary_Goal関連）
  generateInitialRecommendation(
    userId: string,
    trigger: Trigger
  ): Promise<Recommendation>;
  
  // 同Goal内別アクション提案（「いいえ（別の方法で）」応答時）
  generateAlternativeAction(
    userId: string,
    currentGoalId: string
  ): Promise<Recommendation>;
  
  // Pivot提案（「目標チェンジ」応答時）
  generatePivotRecommendation(
    userId: string
  ): Promise<Recommendation>;
  
  // 最低限行動提案（Pivot後も拒否された場合）
  generateMinimalActionRecommendation(
    userId: string
  ): Promise<Recommendation>;
  
  // 自由入力受付
  acceptFreeInput(
    userId: string,
    input: string
  ): Promise<Recommendation>;
}
```

### 5. Action Ticket Service

Action_Ticketのライフサイクル管理を担当するサービス。

```typescript
interface ActionTicketService {
  // Action_Ticket生成（Open）
  createTicket(
    userId: string,
    data: ActionTicketInput
  ): Promise<ActionTicket>;
  
  // Action_Ticket一覧取得（Open）
  listOpenTickets(userId: string): Promise<ActionTicket[]>;
  
  // Action_TicketをDoneに更新（自己申告）
  completeTicket(
    userId: string,
    ticketId: string
  ): Promise<ActionTicket>;
  
  // 1日の終わりにOpenチケットを自動破棄
  discardExpiredTickets(userId: string, date: string): Promise<DiscardResult>;
  
  // 破棄済みチケット履歴取得
  getDiscardedTicketHistory(userId: string): Promise<ActionTicket[]>;
  
  // Done済みチケット取得（Effort_Point集計用）
  getDoneTicketsByDate(userId: string, date: string): Promise<ActionTicket[]>;
}
```

### 6. Effort Point Service

Effort_Pointの計算・付与・集計を担当するサービス。

```typescript
interface EffortPointService {
  // 1日の集計・ポイント付与
  calculateAndAwardPoints(userId: string, date: string): Promise<EffortPointResult>;
  
  // 累計ポイント取得
  getTotalPoints(userId: string): Promise<number>;
  
  // 週間・月間推移取得
  getPointHistory(
    userId: string,
    period: 'weekly' | 'monthly'
  ): Promise<PointHistory>;
  
  // 集計タイミング設定（ユーザーカスタマイズ）
  setDailyResetTime(userId: string, time: string): Promise<void>;
  
  // マイルストーン達成チェック（100の倍数）
  checkMilestone(userId: string, newTotal: number): Promise<Milestone | null>;
}
```

### 7. Learning Engine

ユーザーの行動データを学習し、Recommendationを最適化するコンポーネント。

```typescript
interface LearningEngine {
  // Action_Log蓄積
  recordActionLog(userId: string, log: ActionLogEntry): Promise<void>;
  
  // 行動モデル取得（7件以上蓄積後にパーソナライズ）
  getBehaviorModel(userId: string): Promise<BehaviorModel>;
  
  // 曜日・時間帯別達成率分析
  analyzeAchievementRate(
    userId: string
  ): Promise<AchievementRateAnalysis>;
  
  // Pivot_Goal昇格提案チェック（応答率80%超）
  checkPivotGoalPromotion(userId: string): Promise<GoalPromotionSuggestion | null>;
  
  // Future_Self_Model更新
  updateFutureSelfModel(userId: string): Promise<void>;
  
  // 学習データリセット（確認済み）
  resetLearningData(userId: string, confirmed: boolean): Promise<void>;
  
  // Profile自動更新
  autoUpdateProfile(userId: string): Promise<void>;
}
```

### 8. Future Self Model Service

Similar_User_Dataを基にFuture_Self_Modelを構築・管理するサービス。

```typescript
interface FutureSelfModelService {
  // Future_Self_Model構築（Profile登録時）
  buildModel(userId: string, profile: Profile): Promise<FutureSelfModel>;
  
  // Future_Self_Model取得
  getModel(userId: string): Promise<FutureSelfModel>;
  
  // Similar_User_Data検索（類似プロフィール）
  findSimilarUsers(profile: Profile, minCount: number): Promise<SimilarUserData[]>;
  
  // モデル更新（Action_Log蓄積時）
  updateModel(userId: string, actionLog: ActionLog): Promise<FutureSelfModel>;
  
  // フォールバックモデル生成（類似ユーザー5件未満）
  buildFallbackModel(userId: string, profile: Profile, goals: Goal[]): Promise<FutureSelfModel>;
}
```

### 9. Persona Message Service

Future_Self_ModelのトーンでPersona_Messageを生成するサービス。

```typescript
interface PersonaMessageService {
  // Recommendation用メッセージ生成
  generateRecommendationMessage(
    userId: string,
    recommendation: Recommendation,
    context: MessageContext
  ): Promise<PersonaMessage>;
  
  // Effort_Point付与時メッセージ生成
  generateEffortPointMessage(
    userId: string,
    result: EffortPointResult
  ): Promise<PersonaMessage>;
  
  // Action_Ticket破棄時メッセージ生成
  generateDiscardMessage(
    userId: string,
    discardResult: DiscardResult
  ): Promise<PersonaMessage>;
  
  // Goal達成メッセージ生成
  generateAchievementMessage(
    userId: string,
    goalType: 'primary' | 'pivot' | 'minimal'
  ): Promise<PersonaMessage>;
}
```

---

## データモデル

### User / Profile

```typescript
interface User {
  userId: string;           // UUID
  email: string;
  createdAt: string;        // ISO 8601
  updatedAt: string;
  consentGiven: boolean;    // Similar_User_Data利用同意
  sensitiveDataConsent: {
    location: boolean;
    screenTime: boolean;
  };
}

interface Profile {
  userId: string;
  name: string;
  age: number;
  occupation: string;
  interests: string[];          // 興味分野（複数）
  lifestyleType: 'morning' | 'night' | 'flexible';  // 朝型/夜型/フレキシブル
  currentConcerns: string[];    // 現在の悩み（複数）
  behaviorTendencyScore: BehaviorTendencyScore;
  behaviorPattern: BehaviorPattern | null;  // 過去30日分析結果
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BehaviorTendencyScore {
  consistency: number;      // 継続性スコア (0-100)
  pivotFrequency: number;   // Pivot頻度スコア (0-100)
  morningActivity: number;  // 朝の活動スコア (0-100)
  eveningActivity: number;  // 夜の活動スコア (0-100)
}

interface BehaviorPattern {
  strongPatterns: string[];   // 得意な行動パターン
  analyzedAt: string;
  basedOnDays: number;        // 分析対象日数（最大30）
}

interface ProfileUpdateHistory {
  historyId: string;
  userId: string;
  changedFields: string[];
  previousValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
  updatedAt: string;
  updateSource: 'manual' | 'learning_engine';
}
```

### Goal

```typescript
interface Goal {
  goalId: string;           // UUID
  userId: string;
  title: string;            // 例：「英語を習慣的にやりたい」
  description: string;
  goalType: 'primary' | 'pivot';
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

interface AIPivotCandidate {
  title: string;
  description: string;
  basedOnProfileField: string;  // 参照したProfileフィールド
  confidence: number;           // 提案信頼度 (0-1)
}
```

### State Detection / Trigger

```typescript
interface DetectedState {
  userId: string;
  detectedAt: string;
  location: Location | null;
  psychologicalInput: string | null;
  stayDurationMinutes: number | null;  // 同一位置滞在時間
}

interface Location {
  latitude: number;
  longitude: number;
  isHome: boolean;
}

interface Trigger {
  triggerId: string;
  triggerType: 'long_stay_home' | 'psychological_stagnation' | 'manual';
  priority: number;           // 優先度（高いほど優先）
  detectedAt: string;
  sourceData: Record<string, unknown>;
}

interface TriggerSettings {
  userId: string;
  locationEnabled: boolean;
  selfReportEnabled: boolean;
  updatedAt: string;
}
```

### Recommendation

```typescript
interface Recommendation {
  recommendationId: string;
  userId: string;
  triggerId: string;
  goalId: string;
  goalType: 'primary' | 'pivot' | 'minimal';
  actionDescription: string;   // 提案内容
  personaMessage: PersonaMessage;
  responseOptions: ResponseOption[];
  createdAt: string;
  respondedAt: string | null;
  response: ResponseType | null;
}

type ResponseType = 'do_it' | 'alternative' | 'goal_change' | 'free_input';

interface ResponseOption {
  type: ResponseType;
  label: string;
}

interface PersonaMessage {
  messageId: string;
  content: string;             // 生成されたメッセージ本文
  tone: 'encouragement' | 'praise' | 'pivot_acceptance' | 'minimal_push';
  generatedAt: string;
}
```

### Action Ticket

```typescript
interface ActionTicket {
  ticketId: string;
  userId: string;
  recommendationId: string | null;  // 自由入力の場合はnull
  goalId: string;
  goalType: 'primary' | 'pivot' | 'minimal' | 'free';
  actionDescription: string;
  status: 'open' | 'done' | 'discarded';
  createdAt: string;
  completedAt: string | null;
  discardedAt: string | null;
}

interface DiscardResult {
  discardedTickets: ActionTicket[];
  doneTickets: ActionTicket[];
  discardMessage: PersonaMessage;
}
```

### Effort Point

```typescript
interface EffortPointRecord {
  recordId: string;
  userId: string;
  date: string;               // YYYY-MM-DD
  primaryGoalPoints: number;  // Primary_Goal完了分 (10pt/件)
  pivotGoalPoints: number;    // Pivot_Goal完了分 (7pt/件)
  minimalActionPoints: number; // 最低限行動完了分 (3pt/件)
  totalDayPoints: number;
  cumulativeTotal: number;
  personaMessage: PersonaMessage;
  awardedAt: string;
}

interface PointHistory {
  userId: string;
  period: 'weekly' | 'monthly';
  dataPoints: { date: string; points: number }[];
  totalInPeriod: number;
}

interface Milestone {
  milestoneId: string;
  userId: string;
  totalPoints: number;        // 100の倍数
  badgeType: string;
  achievedAt: string;
}
```

### Action Log

```typescript
interface ActionLogEntry {
  logId: string;
  userId: string;
  ticketId: string;
  goalId: string;
  goalType: 'primary' | 'pivot' | 'minimal' | 'free';
  actionDescription: string;
  responseType: ResponseType;
  completedAt: string;
  dayOfWeek: number;          // 0=日曜, 6=土曜
  hourOfDay: number;          // 0-23
}
```

### Future Self Model / Similar User Data

```typescript
interface FutureSelfModel {
  modelId: string;
  userId: string;
  basedOnSimilarUsers: number;  // 参照した類似ユーザー数
  isFallback: boolean;          // 5件未満の場合true
  successStories: SuccessStory[];
  updatedAt: string;
}

interface SuccessStory {
  storyId: string;
  goalCategory: string;
  timeframeMonths: number;
  outcomeDescription: string;   // 「筋トレを始めて3ヶ月でこうなった」
  similarityScore: number;      // 類似度スコア (0-1)
}

interface SimilarUserData {
  anonymizedId: string;         // 個人特定不可の匿名ID
  profileSimilarityScore: number;
  goalCategories: string[];
  actionPatterns: string[];
  outcomes: string[];
  dataCollectedAt: string;
}

interface BehaviorModel {
  modelId: string;
  userId: string;
  isPersonalized: boolean;      // 7件以上蓄積でtrue
  achievementRateByDayHour: Record<string, number>;  // "Mon-09": 0.8
  preferredGoalTypes: string[];
  pivotGoalResponseRates: Record<string, number>;    // goalId: rate
  updatedAt: string;
}
```

---

## 正確性プロパティ（Correctness Properties）


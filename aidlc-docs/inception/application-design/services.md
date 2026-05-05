# サービス層設計 — だが、それでいい（DagaSoreDeIi_App）

## 概要

フロントエンドのサービス層はReact QueryのカスタムフックとしてAPIClientをラップし、
各画面コンポーネントに対してデータ取得・更新・キャッシュ管理を提供する。

---

## サービス層アーキテクチャ

```
Screens
  └── useXxxService（React Query カスタムフック）
        └── APIClient（axios + React Query）
              └── API Gateway → Lambda
```

---

## 1. useAuthService

**責務**: 認証フロー全体のオーケストレーション

```typescript
// 提供するフック
function useSignUp(): UseMutationResult<SignUpResult, SignUpInput>;
function useConfirmSignUp(): UseMutationResult<void, ConfirmSignUpInput>;
function useSignIn(): UseMutationResult<SignInResult, SignInInput>;
function useSignOut(): UseMutationResult<void, void>;
function useForgotPassword(): UseMutationResult<void, string>;
function useConfirmForgotPassword(): UseMutationResult<void, ConfirmForgotPasswordInput>;
function useDeleteAccount(): UseMutationResult<void, void>;
```

**オーケストレーション**:

- サインイン成功時 → ZustandStore.authSlice.setUser() → NavigationComponent でMainTabへ遷移
- サインアウト時 → ZustandStore.clearAuth() → AuthStackへ遷移
- アカウント削除時 → AuthLambda呼び出し → ZustandStore.clearAuth() → ログイン画面へ遷移

---

## 2. useProfileService

**責務**: プロフィール取得・更新・AIサジェストのオーケストレーション

```typescript
function useGetProfile(userId: string): UseQueryResult<Profile>;
function useUpdateProfile(): UseMutationResult<Profile, ProfileUpdate>;
function useGetProfileHistory(userId: string): UseQueryResult<ProfileUpdateHistory[]>;
function useGetProfileSuggestion(field: ProfileField, input: string): UseQueryResult<string[]>;
```

**オーケストレーション**:

- プロフィール更新成功時 → ZustandStore.profileSlice.setProfile() → キャッシュ無効化
- オンボーディング完了時 → isOnboardingComplete = true → MainTabへ遷移

---

## 3. useGoalService

**責務**: Goal管理のオーケストレーション

```typescript
function useGetGoals(userId: string): UseQueryResult<Goal[]>;
function useCreateGoal(): UseMutationResult<Goal, CreateGoalInput>;
function useUpdateGoal(): UseMutationResult<Goal, UpdateGoalInput>;
function useDeleteGoal(): UseMutationResult<void, string>;
function useSetPrimaryGoal(): UseMutationResult<void, string>;
function useUpdateGoalPriority(): UseMutationResult<void, UpdatePriorityInput>;
function useGenerateInitialPivotGoals(userId: string): UseQueryResult<Goal[]>;
```

**オーケストレーション**:

- Goal操作成功時 → ZustandStore.goalSlice.setGoals() → キャッシュ無効化
- Primary_Goal変更時 → ZustandStore.goalSlice.setPrimaryGoal()

---

## 4. useTriggerService

**責務**: Trigger発火とRecommendationフロー開始のオーケストレーション

```typescript
function useCheckAutoTrigger(userId: string): { shouldTrigger: boolean };
function useManualTrigger(): UseMutationResult<Recommendation, ManualTriggerInput>;
```

**オーケストレーション**:

- アプリ起動時 → Open Ticketが0件かチェック → 0件なら自動Trigger発火
- 手動Trigger → 心理状態入力UI表示 → RecommendationLambda呼び出し → RecommendationScreenへ遷移
- Recommendation取得成功時 → ZustandStore.recommendationSlice.setRecommendation()

---

## 5. useRecommendationService

**責務**: Recommendation・Pivot・ActionStepのオーケストレーション

```typescript
function useGenerateRecommendation(): UseMutationResult<Recommendation, RecommendationInput>;
function useGeneratePivot(): UseMutationResult<Recommendation, PivotInput>;
function useGenerateActionSteps(): UseMutationResult<ActionStep[], Recommendation>;
function useRespondToRecommendation(): UseMutationResult<ActionTicket, RecommendationResponse>;
```

**オーケストレーション**:

- 「やる」応答 → ActionStep生成 → ActionTicket生成（goalType=primary, actionLevel=normal）
- 「いいえ（別の方法で）」→ Pivot生成（alternative_method）→ 再表示
- 「目標チェンジ」→ Pivot生成（goal_change）→ Pivot_Goal候補表示
- 「自由入力」→ ユーザー入力内容でActionTicket生成
- 最低限提案後の受け入れ → ActionTicket生成（actionLevel=minimal）
- ActionTicket生成時 → ZustandStore.ticketSlice更新

---

## 6. useActionTicketService

**責務**: Action_Ticket操作のオーケストレーション

```typescript
function useGetOpenTickets(userId: string): UseQueryResult<ActionTicket[]>;
function useCompleteTicket(): UseMutationResult<CompleteTicketResult, string>;
function useGetExpiredHistory(userId: string): UseQueryResult<ExpiredTicket[]>;
```

**オーケストレーション**:

- Done申告成功時 → ZustandStore.ticketSlice.markTicketDone() → Effort_Point表示 → キャッシュ無効化
- Done申告時 → Persona_Messageトーンの肯定メッセージ表示（FrontendErrorHandlerのメッセージストアから取得）

---

## 7. useEffortPointService

**責務**: Effort_Point表示・集計のオーケストレーション

```typescript
function useGetTotalPoints(userId: string): UseQueryResult<number>;
function useGetDailySummary(userId: string, date: string): UseQueryResult<DailySummary>;
function useGetWeeklySummary(userId: string, weekStart: string): UseQueryResult<WeeklySummary>;
function useGetMonthlySummary(userId: string, month: string): UseQueryResult<MonthlySummary>;
```

**オーケストレーション**:

- ポイント取得時 → ZustandStore.effortPointSlice更新
- マイルストーン達成時 → 特別メッセージ・バッジ表示

---

## サービス間オーケストレーションフロー

### アプリ起動フロー

```
App起動
  → useAuthService.getCurrentSession()
  → 未認証: AuthStackへ
  → 認証済み: useProfileService.getProfile()
    → プロフィール未完了: OnboardingStackへ
    → 完了: useCheckAutoTrigger()
      → Open Ticket 0件: useTriggerService.autoTrigger() → RecommendationScreenへ
      → Open Ticket あり: HomeScreenへ
```

### Action_Ticket Done フロー

```
Done申告
  → useActionTicketService.completeTicket()
    → ActionTicketLambda: Action_Log記録（リアルタイム）
    → EffortPointLambda: ポイント計算・付与
    → レスポンス: { ticket, pointsAwarded, totalPoints, milestoneReached }
  → ZustandStore更新
  → Persona_Message表示（肯定メッセージ + ポイント）
  → マイルストーン達成時: 特別メッセージ・バッジ表示
```

### 週次バッチフロー（バックエンド自動実行）

```
EventBridge（毎週月曜0時）
  → LearningEngineLambda.runWeeklyBatch()
    → 全ユーザーのAction_Log取得
    → buildBehaviorModel() per user
    → updateProfileBehaviorTrends()
    → updateFutureSelfModel()
    → checkPivotGoalPromotion() → 昇格候補があれば次回アプリ起動時に通知
```

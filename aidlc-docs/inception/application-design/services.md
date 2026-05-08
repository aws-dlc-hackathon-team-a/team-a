# サービス層設計 — だが、それでいい（DagaSoreDeIi_App）

## 目次

- [サービス層アーキテクチャ](#サービス層アーキテクチャ)
- [1. AccountService](#1-accountservice)
- [2. ProfileService](#2-profileservice)
- [3. GoalService](#3-goalservice)
- [4. TriggerService](#4-triggerservice)
- [5. RecommendationService](#5-recommendationservice)
- [6. ActionTicketService](#6-actiontickectservice)
- [7. StatsService](#7-statsservice)
- [認証の扱い（Amplify UI Authenticator）](#認証の扱いamplify-ui-authenticator)
- [サービス間オーケストレーションフロー](#サービス間オーケストレーションフロー)

---

## 概要

フロントエンドのサービス層は画面コンポーネントに対してデータ取得・更新・キャッシュ管理を提供する。内部実装として React Query（TanStack Query）+ axios を使用するが、画面コンポーネントからはサービス名（`XxxService`）で参照する。

**認証は Amplify UI Authenticator に一本化**している。サインアップ・サインイン・パスワードリセット・メール確認 UI とそのロジックは Amplify UI が提供するため、アプリ独自の AuthService は作らない。アカウント削除のみ Amplify UI が提供しないため、独立した `AccountService` として実装する。

各サービスのメソッドシグネチャは [component-methods.md](./component-methods.md#frontend-サービス層) を参照。本ドキュメントは責務と主要オーケストレーションのみ記載する。

---

## サービス層アーキテクチャ

```
Screens
  └── XxxService（内部実装: React Query カスタムフック）
        └── APIClient（axios + React Query）
              └── API Gateway → Lambda
```

---

## 1. AccountService

**責務**: アカウント削除のオーケストレーション（Amplify UI が提供しない機能のみ）

詳細メソッド: [component-methods.md — AccountService](./component-methods.md#accountservice)

**オーケストレーション**:

- アカウント削除時 → AccountLambda 呼び出し → 成功後に Amplify Auth の `signOut()` を呼び出してセッションクリア → Amplify UI Authenticator が自動的に認証画面（サインアップ / サインイン）を再表示
- authStore.clearAuth() でローカルストアもクリア

**Note**: サインアップ・サインイン・パスワードリセット・メール確認は Amplify UI Authenticator が提供するため、AccountService には含まない。

---

## 2. ProfileService

**責務**: プロフィール取得・更新・AIサジェストのオーケストレーション

詳細メソッド: [component-methods.md — ProfileService](./component-methods.md#profileservice)

**オーケストレーション**:

- プロフィール更新成功時 → React Query キャッシュ無効化 → 画面再レンダリング
- オンボーディング完了時 → Profile.isOnboardingComplete = true → MainTabへ遷移
- **Note**: profileStore（Zustand）を使うか React Query キャッシュで代替するかは Construction Phase で決定

---

## 3. GoalService

**責務**: Goal管理のオーケストレーション（昇格候補取得・昇格承認含む）

詳細メソッド: [component-methods.md — GoalService](./component-methods.md#goalservice)

**オーケストレーション**:

- Goal操作成功時 → React Query キャッシュ無効化
- Primary_Goal変更時 → Goal一覧を再取得
- **FR-07-2 Pivot_Goal昇格提案フロー**:
  1. HomeScreen 起動時に `getPromotionCandidates` を呼び出し
  2. 候補あり → ホーム画面の上部にバナー表示「〇〇の行動が続いているね。〇〇を新しい目標にする？」
  3. ユーザー承認 → `promoteCandidate` 呼び出し → Goal を Primary_Goal に昇格
  4. キャッシュ無効化 → バナー非表示
- **Note**: goalStore（Zustand）を使うか React Query キャッシュで代替するかは Construction Phase で決定

---

## 4. TriggerService

**責務**: Trigger発火とRecommendationフロー開始のオーケストレーション

詳細メソッド: [component-methods.md — TriggerService](./component-methods.md#triggerservice)

**オーケストレーション**:

- **自動Trigger判定**: `checkAutoTrigger()` が `shouldTrigger: true` を返すと HomeScreen が `autoTrigger()` を呼び出し、Open Ticket 0件時の自動Triggerを発火する
- **手動Trigger**: ホーム画面の手動Triggerボタン → 心理状態入力モーダル → `manualTrigger()` → Recommendation生成 → RecommendationScreensへ遷移
- Recommendation取得成功時 → recommendationStore.setRecommendation()

**Note**: 自動Triggerの実行主体は HomeScreen（`checkAutoTrigger` と `autoTrigger` の呼び出しを HomeScreen 内で行う）。NavigationComponent / App コンポーネントは判定を持たない。

---

## 5. RecommendationService

**責務**: Recommendation・Pivot・ActionStepのオーケストレーション

詳細メソッド: [component-methods.md — RecommendationService](./component-methods.md#recommendationservice)

**オーケストレーション**:

- 「やる」応答 → `generateActionSteps` で ActionStep 生成 → 画面で確認表示 → `respondToRecommendation(response="yes")` で ActionTicket 生成（goalType=primary, actionLevel=normal）
- 「いいえ（別の方法で）」→ `generatePivot(pivotType="alternative_method")` → 再表示
- 「目標チェンジ」→ `generatePivot(pivotType="goal_change")` → Pivot_Goal候補表示
- 「自由入力」→ ユーザー入力内容を `respondToRecommendation(response="free_input")` に渡してActionTicket生成
- 最低限提案後の受け入れ → ActionTicket生成（actionLevel=minimal）
- ActionTicket生成時 → ticketStore.addTicket()

---

## 6. ActionTicketService

**責務**: Action_Ticket操作のオーケストレーション

詳細メソッド: [component-methods.md — ActionTicketService](./component-methods.md#actiontickectservice)

**オーケストレーション**:

- Done申告成功時 → ticketStore.markTicketDone() → Persona_Message + ポイント表示 → React Query キャッシュ無効化
- Done申告時 → Persona_Messageトーンの肯定メッセージ表示（FrontendErrorHandlerのフォールバックメッセージ定数または CompleteTicketResult 内のメッセージから取得）
- **破棄履歴表示**: `getExpiredHistory` は ActionTicketScreens の「破棄履歴タブ」から呼び出される（FR-13-7）

---

## 7. StatsService

**責務**: Effort_Point表示・集計・破棄メッセージのオーケストレーション

詳細メソッド: [component-methods.md — StatsService](./component-methods.md#statsservice)

**オーケストレーション**:

- ポイント取得時（StatsLambda経由）→ HomeScreen / StatsScreens で表示
- **マイルストーン達成時**: Done申告の `CompleteTicketResult.milestoneReached` に Milestone オブジェクトが含まれている場合、特別メッセージ・バッジを表示（FR-08-7: 累計100の倍数達成時）
- **破棄メッセージ表示（FR-13-5/FR-13-6）**: HomeScreen のマウント時に `getLatestDiscardMessage` を呼び出し、当日の DailySummary.discardMessage を取得。未表示の場合にホーム画面の上部バナー/ダイアログで表示し、既読フラグをローカルストレージに保存
- **Note**: effortPointStore（Zustand）を使うか React Query キャッシュで代替するかは Construction Phase で決定

---

## 認証の扱い（Amplify UI Authenticator）

認証フロー全体（サインアップ・サインイン・パスワードリセット・メール確認・セッション管理）は Amplify UI Authenticator が提供する。アプリ独自の AuthService や AuthScreens は作らない。

**実装パターン**:

```tsx
import { Authenticator } from '@aws-amplify/ui-react-native';

function App() {
  return (
    <Authenticator.Provider>
      <Authenticator>
        {/* 認証後にここが描画される */}
        <NavigationComponent />
      </Authenticator>
    </Authenticator.Provider>
  );
}
```

**認証情報の取得**:

- 各画面は `useAuthenticator` フックで認証情報（user オブジェクト・signOut 関数）にアクセスする
- 集約が必要な箇所では authStore にコピーして参照する
- APIClient は Amplify Auth の `fetchAuthSession()` を直接呼び出して JWT を取得する（サービス層は介在しない）

**サインアウト**:

- プロフィール画面等のログアウトボタンから `useAuthenticator().signOut()` を直接呼び出す
- AccountService.deleteAccount() も最後に `signOut()` を呼ぶ

---

## サービス間オーケストレーションフロー

### アプリ起動フロー

```
App起動
  → Amplify UI Authenticator が自動的にセッション確認
  → 未認証: Authenticator が認証UI（サインアップ/サインイン）を表示
  → 認証済み: ラップされた NavigationComponent が描画
    → ProfileService.getProfile()
      → Profile.isOnboardingComplete === false: OnboardingStackへ
      → true: HomeScreen（MainTab）へ遷移
        ├── TriggerService.checkAutoTrigger()
        │   → Open Ticket 0件: TriggerService.autoTrigger() → RecommendationScreenへ
        │   → Open Ticket あり: そのまま HomeScreen 表示
        ├── StatsService.getLatestDiscardMessage() → 当日の破棄メッセージ表示
        └── GoalService.getPromotionCandidates() → 昇格候補あればバナー表示
```

### Action_Ticket Done フロー

```
Done申告
  → ActionTicketService.completeTicket()
    → ActionTicketLambda: Action_Log記録（リアルタイム）+ Effort_Point計算・付与・マイルストーン判定
    → レスポンス: { ticket, pointsAwarded, totalPoints, milestoneReached }
  → ticketStore.markTicketDone()
  → Persona_Message表示（肯定メッセージ + ポイント）
  → マイルストーン達成時: 特別メッセージ・バッジ表示
```

### 日次バッチ・次回起動時表示フロー（FR-13-4/FR-13-5）

```
EventBridge（毎日0時）
  → DailyAggregationLambda.runDailyBatch()
    → expireTickets(userId) で Open Ticket を破棄
    → runDailyAggregation(userId) で DailySummary 生成
    → buildDiscardMessage() → DailySummary.discardMessage に保存

次回アプリ起動時
  → HomeScreen マウント
    → StatsService.getLatestDiscardMessage()
      → StatsLambda.getLatestDiscardMessage() で当日 DailySummary.discardMessage を取得
    → ホーム画面上部バナー/ダイアログで表示
    → 既読フラグを AsyncStorage に保存（同日中の再表示を抑制）
```

### 週次バッチフロー（バックエンド自動実行）

```
EventBridge（毎週月曜0時）
  → LearningEngineLambda.runWeeklyBatch()
    → 全ユーザーのAction_Log取得
    → buildBehaviorModel() per user
    → updateProfileBehaviorTrends()
    → updateFutureSelfModel()
    → checkPivotGoalPromotion() → Goal.promotionCandidate フラグ更新
      → 次回アプリ起動時に HomeScreen が GoalService.getPromotionCandidates で取得しバナー表示
    → analyzeStrengthPatterns() → Profile.strengthPatterns 更新
```

### Pivot_Goal 昇格提案フロー（FR-07-2）

```
HomeScreen マウント
  → GoalService.getPromotionCandidates()
    → UserLambda.getPromotionCandidates() → UserDB から Goal.promotionCandidate === true を取得
  → 候補あり: ホーム画面上部にバナー表示
    「お前、〇〇を続けられてるよね。これを新しい目標にしてみる？」
  → ユーザー「はい」 → GoalService.promoteCandidate(candidateGoalId)
    → UserLambda.promoteCandidate() → Goal.isPrimary=true に昇格、旧Primary_Goalを Pivot に変更
  → キャッシュ無効化 → バナー非表示
```

### アカウント削除フロー

```
ProfileScreens: アカウント削除ボタン
  → 確認ダイアログ
  → AccountService.deleteAccount()
    → AccountLambda: DELETE /me → UserDB / ActionLogDB / Cognito の全データ削除
    → Amplify Auth.signOut() でローカルセッションクリア
  → authStore.clearAuth()
  → Amplify UI Authenticator が自動的に認証UI（サインイン画面）を再表示
```

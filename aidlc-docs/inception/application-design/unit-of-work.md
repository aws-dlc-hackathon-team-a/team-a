# ユニット定義 — だが、それでいい（DagaSoreDeIi_App）

## 目次

- [概要](#概要)
- [ユニット一覧](#ユニット一覧)
- [ユニット詳細](#ユニット詳細)
  - [Unit 1: Mobile Frontend](#unit-1-mobile-frontend)
  - [Unit 2: Backend API](#unit-2-backend-api)
  - [Unit 3: Batch](#unit-3-batch)
  - [Unit 4: Infrastructure](#unit-4-infrastructure)
- [コード組織方針（Greenfield）](#コード組織方針greenfield)
- [ユニット境界の基本原則](#ユニット境界の基本原則)
- [デプロイ単位](#デプロイ単位)
- [ユニット間インターフェース契約](#ユニット間インターフェース契約)
- [共通型の扱い（OpenAPI SSoT）](#共通型の扱いopenapi-ssot)
- [Bedrock連携の共通化方針](#bedrock連携の共通化方針)
- [開発進行モデル](#開発進行モデル)

---

## 概要

本ドキュメントは、Application Design で定義した Frontend・Backend・Batch・データストアを、独立して開発・デプロイできる「ユニット」に分解する方針を定義する。ユニットは並行開発を前提とし、ユニット間のインターフェース契約（OpenAPI・DynamoDB スキーマ）を先行して固めることで境界を明確に保つ。

Application Design の成果物は [application-design.md](./application-design.md)、[components.md](./components.md)、[component-methods.md](./component-methods.md)、[component-dependency.md](./component-dependency.md)、[services.md](./services.md) を参照。

---

## ユニット一覧

| # | ユニット                | 技術スタック                                                | デプロイ成果物                                                                 | 種別                      |
| - | ----------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------- |
| 1 | **Mobile Frontend**     | React Native + TypeScript + Zustand + React Query + axios + Amplify UI | iOS IPA / Android APK（ストア配信）                                           | クライアントアプリ         |
| 2 | **Backend API**         | Node.js + TypeScript + AWS SDK v3（Lambda + API Gateway）   | Lambda デプロイパッケージ群（AccountLambda / UserLambda / ActionTicketLambda / RecommendationLambda / StatsLambda） + API Gateway 定義 | サーバーレス API           |
| 3 | **Batch**               | Node.js + TypeScript + AWS SDK v3（Lambda + EventBridge Scheduler） | Lambda デプロイパッケージ群（DailyAggregationLambda / LearningEngineLambda）+ EventBridge スケジュール | サーバーレスバッチ         |
| 4 | **Infrastructure**      | AWS CDK + TypeScript                                         | 複数 CDK Stack（Frontend / Backend / Batch / 共通 DB）                          | Infrastructure-as-Code    |

---

## ユニット詳細

### Unit 1: Mobile Frontend

| 項目                   | 内容                                                                                                                                                                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **責務**               | ユーザー向けモバイルアプリ全体。認証UI（Amplify UI Authenticator）配下の画面コンポーネント、状態管理、API通信、エラー処理を担う                                                                                           |
| **含まれるコンポーネント** | NavigationComponent、OnboardingScreens、HomeScreen、RecommendationScreens、ActionTicketScreens、ProfileScreens、StatsScreens、Zustand Stores（authStore / ticketStore / recommendationStore）、APIClient、FrontendErrorHandler、Amplify UI Authenticator |
| **含まれる Service 層** | AccountService、ProfileService、GoalService、TriggerService、RecommendationService、ActionTicketService、StatsService                                                                                                    |
| **Platform**           | iOS + Android（React Native クロスプラットフォーム）                                                                                                                                                                      |
| **ビルド成果物**       | iOS IPA、Android APK / AAB                                                                                                                                                                                               |
| **外部依存**           | Backend API（OpenAPI 定義経由）、AWS Cognito User Pool（Amplify UI Authenticator 経由）                                                                                                                                   |
| **パッケージ**         | `apps/mobile/`                                                                                                                                                                                                           |

### Unit 2: Backend API

| 項目                   | 内容                                                                                                                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **責務**               | モバイルアプリからのリクエストを受け付ける API 系 Lambda 群。API Gateway + Cognito Authorizer 配下で実行され、JWT claims から userId を取得する                                                                       |
| **含まれる Lambda**    | AccountLambda（DELETE /me）、UserLambda（/me/profile、/me/goals、/me/learning-data/reset）、ActionTicketLambda（/me/tickets*）、RecommendationLambda（/me/recommendations*）、StatsLambda（/me/stats/*）                       |
| **共通ミドルウェア**   | BackendErrorHandler（`withErrorHandling`、`getUserIdFromToken`、`handleBedrockError`、`handleDynamoDBError`、`createErrorResponse`）                                                                                   |
| **データアクセス**     | DynamoDB の UserDB / ActionLogDB / SimilarUserDB（v1モック）                                                                                                                                                          |
| **外部依存**           | Amazon Bedrock（UserLambda / RecommendationLambda / ActionTicketLambda）                                                                                                                                              |
| **トリガー**           | API Gateway（同期REST）                                                                                                                                                                                               |
| **ビルド成果物**       | Lambda デプロイパッケージ（Lambda 関数ごとに zip または Container Image）+ OpenAPI 定義ファイル                                                                                                                        |
| **パッケージ**         | `apps/backend/`                                                                                                                                                                                                       |

### Unit 3: Batch

| 項目                   | 内容                                                                                                                                                       |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **責務**               | EventBridge Scheduler によるスケジュール起動でバックエンド処理を実行する。API Gateway を介さず、IAM ロールで直接起動される                                 |
| **含まれる Lambda**    | DailyAggregationLambda（毎日 0 時：自動破棄 + DailySummary 集計 + Bedrock による破棄メッセージ生成）、LearningEngineLambda（毎週月曜 0 時：行動モデル構築・Profile/FutureSelfModel更新・Pivot_Goal昇格候補判定） |
| **データアクセス**     | DynamoDB の UserDB / ActionLogDB                                                                                                                          |
| **外部依存**           | Amazon Bedrock（両 Lambda）                                                                                                                                |
| **トリガー**           | EventBridge Scheduler（CRON 式によるスケジュール起動）                                                                                                    |
| **ビルド成果物**       | Lambda デプロイパッケージ（Lambda 関数ごとに zip または Container Image）                                                                                  |
| **パッケージ**         | `apps/batch/`                                                                                                                                             |
| **分離理由**           | API 系 Lambda とはデプロイ単位・テスト戦略（バッチは全ユーザーループ処理を伴い、部分失敗時のリカバリ戦略が異なる）・実行頻度（日次 / 週次）が大きく異なるため独立させる |

### Unit 4: Infrastructure

| 項目                   | 内容                                                                                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **責務**               | AWS リソース全体の IaC 定義。複数の CDK Stack に分割してユニットごとの依存を管理する                                                             |
| **含まれる CDK Stack** | FrontendStack（Cognito User Pool）、BackendStack（API Gateway + API系Lambda + IAMロール）、BatchStack（EventBridge Scheduler + バッチLambda + IAM）、DbStack（DynamoDB テーブル 3 つ）、BedrockAccessStack（Bedrock 呼び出し権限の共通 IAM Policy） |
| **ビルド成果物**       | CloudFormation テンプレート（CDK synth の結果）→ `cdk deploy` で AWS にデプロイ                                                                   |
| **依存関係**           | DbStack は全ての下流 Stack（Backend / Batch）から参照される（Cross-Stack Reference）。BackendStack と BatchStack は並行デプロイ可能                |
| **パッケージ**         | `apps/infra/`                                                                                                                                   |

---

## コード組織方針（Greenfield）

モノレポ + pnpm workspace / turbo を採用する。ワークスペースルートのディレクトリ構造:

```
<WORKSPACE-ROOT>/
├── apps/
│   ├── mobile/              # Unit 1: Mobile Frontend（React Native）
│   │   ├── src/
│   │   │   ├── screens/           # OnboardingScreens / HomeScreen / RecommendationScreens / etc.
│   │   │   ├── services/          # XxxService（React Query カスタムフック実装）
│   │   │   ├── stores/            # Zustand stores（authStore / ticketStore / recommendationStore）
│   │   │   ├── api/               # APIClient（axios + fetchAuthSession）
│   │   │   ├── errors/            # FrontendErrorHandler
│   │   │   └── navigation/        # NavigationComponent
│   │   ├── ios/
│   │   ├── android/
│   │   └── package.json
│   │
│   ├── backend/             # Unit 2: Backend API
│   │   ├── src/
│   │   │   ├── lambdas/           # AccountLambda / UserLambda / ActionTicketLambda / RecommendationLambda / StatsLambda
│   │   │   ├── middleware/        # BackendErrorHandler
│   │   │   ├── bedrock/           # Bedrock 呼び出しの抽象化（Q8-A: 各Lambda内でモック可能）
│   │   │   ├── dynamo/            # DynamoDB アクセスレイヤー
│   │   │   └── types/             # Lambda内部の型（OpenAPI自動生成されない領域）
│   │   ├── openapi/               # OpenAPI 定義ファイル（Single Source of Truth）
│   │   └── package.json
│   │
│   ├── batch/               # Unit 3: Batch
│   │   ├── src/
│   │   │   ├── lambdas/           # DailyAggregationLambda / LearningEngineLambda
│   │   │   ├── bedrock/           # Bedrock 呼び出しの抽象化
│   │   │   └── dynamo/            # DynamoDB アクセスレイヤー
│   │   └── package.json
│   │
│   └── infra/               # Unit 4: Infrastructure（AWS CDK）
│       ├── bin/
│       │   └── app.ts             # CDK app entrypoint
│       ├── lib/
│       │   ├── stacks/            # FrontendStack / BackendStack / BatchStack / DbStack / BedrockAccessStack
│       │   └── constructs/        # 再利用可能な Construct（Lambda Function ラッパー等）
│       └── package.json
│
├── packages/
│   └── shared-types/        # OpenAPI から自動生成される共通型（Q4-B）
│       ├── src/
│       │   └── index.ts           # 生成された TypeScript 型定義
│       ├── scripts/
│       │   └── generate.ts        # openapi-typescript などの自動生成スクリプト
│       └── package.json
│
├── package.json             # pnpm workspace ルート
├── pnpm-workspace.yaml
├── turbo.json               # turbo タスク定義
└── aidlc-docs/              # ドキュメント（既存）
```

**ポイント**:

- `apps/` 配下に 4 ユニット、`packages/shared-types/` に OpenAPI 自動生成型
- `backend/` と `batch/` は独立ディレクトリとしてデプロイ単位を分離（Q9-D の意向）
- 両者とも Lambda ランタイム共通のため `package.json` の devDependencies は似るが、アプリケーションコードと IAM ロール・EventBridge トリガー設定は明確に分離
- `packages/shared-types/` のビルド成果物は Mobile Frontend と Backend API 両方から import される
- `apps/infra/lib/stacks/` に CDK Stack ごとに分割（Q6-B: ユニットごと + 共通 DB Stack + Bedrock アクセス共通 Stack）

---

## ユニット境界の基本原則

| 原則                             | 内容                                                                                                                                |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **並行開発前提**                 | ユニット境界は厳密に保ち、インターフェース契約（OpenAPI + DynamoDB スキーマ + EventBridge トリガー仕様）を先行して固める          |
| **コード直接参照禁止**           | ユニット間でソースコードを直接 import しない。共通化は `packages/shared-types/` 経由のみに限定                                      |
| **デプロイ独立**                 | Mobile Frontend、Backend API、Batch、Infrastructure はそれぞれ独立してビルド・デプロイできる                                         |
| **データストア共有**             | UserDB / ActionLogDB / SimilarUserDB は Backend API と Batch の両方がアクセスする共有リソース。スキーマ変更は両ユニットに影響      |
| **Lambda 間呼び出し禁止**        | Lambda から他 Lambda を直接呼び出す構造は採らない（Application Design で確定）。全てのユニット間通信は API Gateway / EventBridge 経由 |
| **Bedrock 抽象化は各ユニット内** | Q8-A に従い、共通 BedrockService パッケージは作らず、Backend API と Batch の各ユニット内で Bedrock クライアントを抽象化してモック可能にする |

---

## デプロイ単位

| デプロイ対象          | 方法                                       | 頻度                                            |
| --------------------- | ------------------------------------------ | ----------------------------------------------- |
| Mobile Frontend       | App Store / Google Play（手動）            | リリースサイクルに応じて                        |
| Backend API Lambda    | CDK（BackendStack）経由で Lambda 更新     | API 変更時に随時。通常は高頻度                 |
| Batch Lambda          | CDK（BatchStack）経由で Lambda 更新       | バッチロジック変更時に随時。通常は低頻度       |
| Infrastructure        | CDK deploy（Stack 単位）                   | インフラ変更時のみ                              |
| `packages/shared-types/` | モノレポ内で `pnpm build` により再ビルド | OpenAPI 更新時に自動（CI で検知）              |

---

## ユニット間インターフェース契約

**Frontend ↔ Backend API**: **OpenAPI（Swagger）を Single Source of Truth として定義**（Q4-B / Q7-A）

- `apps/backend/openapi/openapi.yaml` に全 API エンドポイント・リクエスト/レスポンス型を定義
- CI で OpenAPI から TypeScript 型を自動生成し、`packages/shared-types/` に配置
- Mobile Frontend の APIClient はこの型を import して型安全に通信
- Backend Lambda は Request/Response バリデーションを OpenAPI スキーマに従って実装（`zod` / `ajv` 等）

**Backend API ↔ Batch ↔ DynamoDB**: **DynamoDB テーブルスキーマ + エンティティ型定義を共有**

- `packages/shared-types/` に DynamoDB エンティティ型（User / Profile / Goal / ActionLogEntry / ActionTicket / UserStats 等）を配置
- component-methods.md の型定義を元に、Backend API と Batch の両ユニットが参照

**Infrastructure ↔ 他ユニット**: **CDK Stack が Lambda デプロイパッケージの成果物を参照**

- `apps/backend/dist/` と `apps/batch/dist/` の zip 成果物を BackendStack / BatchStack が `lambda.Function` として取り込む
- Lambda の環境変数（テーブル名・Cognito User Pool ID 等）は CDK 側で注入

---

## 共通型の扱い（OpenAPI SSoT）

Q4-B に従い、OpenAPI を Single Source of Truth として使用する。

1. **OpenAPI 定義ファイル**: `apps/backend/openapi/openapi.yaml` で API 契約を定義
2. **TypeScript 型の自動生成**: `openapi-typescript` を使って `packages/shared-types/src/api.ts` に型を生成
3. **DynamoDB エンティティ型**: OpenAPI の schema として定義（Response モデルと一致する場合）または別ファイルで TypeScript 直接定義（内部型のみ）
4. **CI 検証**: OpenAPI 変更時に自動再生成、型の齟齬は CI で検出

**OpenAPI に含める型（主なもの）**:

- Request/Response: Recommendation / PivotInput / CompleteTicketResult / DailySummary / WeeklySummary / MonthlySummary / DiscardMessage / PromotionCandidate 等
- 共通ドメイン型: Profile / Goal / ActionTicket / ActionLogEntry / ActionStep / UserStats / Milestone / GoalType / ActionLevel / TicketStatus 等

**OpenAPI に含めない型**（Lambda 内部のみ）:

- CompletionMessageContext / DiscardMessageContext（Bedrock プロンプト用、Backend API / Batch 内部で完結）
- BehaviorModel の内部詳細構造（Construction Phase で決定）

---

## Bedrock連携の共通化方針

Q8-A に従い、**共通 BedrockService パッケージは作らず、各ユニット内で Bedrock クライアントを抽象化**する。

**理由**:

- Application Design で「各Lambdaから直接呼び出し」と確定済み
- 抽象インターフェース（例: `BedrockClient` interface）を Backend / Batch のそれぞれに配置し、Jest モックで差し替え可能にする
- Construction Phase で共通パッケージ化が必要と判断した場合は後から `packages/bedrock-client/` として切り出す余地を残す

**各ユニット内の配置**:

- `apps/backend/src/bedrock/` — Backend API 用の BedrockClient 実装とモック
- `apps/batch/src/bedrock/` — Batch 用の BedrockClient 実装とモック

テスト戦略:

- ユニットテスト: BedrockClient をモックし、ビジネスロジックのみ検証
- 統合テスト: 実際の Bedrock エンドポイントを叩くのはスモークテストに限定し、普段は LocalStack や録画レスポンスで代替

---

## 開発進行モデル

Q2-B（並行開発）を前提としたマイルストーン:

### マイルストーン M0: インターフェース契約の確定（並行開発の起点）

- `apps/backend/openapi/openapi.yaml` の初版を作成し、全エンドポイントのスキーマを確定
- `packages/shared-types/` の自動生成ワークフローを整備
- DynamoDB テーブルスキーマと主要エンティティ型を `packages/shared-types/` に配置
- EventBridge Scheduler のトリガー仕様（CRON 式・呼び出し引数）を Batch ユニット側で確定

### マイルストーン M1: 各ユニットの実装（並行）

- Mobile / Backend / Batch / Infrastructure の 4 チーム（または 4 レーン）が並行に着手
- Mobile は OpenAPI 由来の型に対してモック API で先行開発可能
- Backend はインメモリ DynamoDB クライアント（DynamoDB Local）でローカル開発可能
- Batch は EventBridge イベントのモックペイロードでローカル開発可能
- Infrastructure は CDK の unit test で Stack の妥当性を検証

### マイルストーン M2: 統合（結合テスト）

- Infrastructure を dev 環境にデプロイ
- Backend / Batch を実 AWS にデプロイして E2E テスト
- Mobile を dev 環境の API に接続して動作確認

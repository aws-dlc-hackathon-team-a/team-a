# Units Generation 計画 — だが、それでいい（DagaSoreDeIi_App）

## 前提コンテキスト

Application Design（components.md / services.md / component-methods.md / component-dependency.md / application-design.md）の承認済み内容に基づいてユニット分解を行う。

**確定済みのアーキテクチャ前提**:

- モバイルフロントエンド: React Native（TypeScript）+ Zustand + React Query + axios + Amplify UI Authenticator
- バックエンド: AWS Lambda + API Gateway + DynamoDB（3テーブル: UserDB/ActionLogDB/SimilarUserDB）
- AI: Amazon Bedrock（各Lambdaから直接呼び出し、専用Lambdaは作らない）
- バッチ: EventBridge Scheduler + 日次 DailyAggregationLambda / 週次 LearningEngineLambda
- 認証: AWS Cognito User Pool（Amplify UI Authenticator 一括提供）
- インフラ: AWS CDK（TypeScript）によるIaC

**実行計画書で暫定提示した 4ユニット構成**（execution-plan.md より）:

| 暫定ユニット             | 内容                                                 |
| ------------------------ | ---------------------------------------------------- |
| Unit 1: Mobile Frontend  | React Native アプリ（全画面・ナビゲーション・状態管理） |
| Unit 2: Backend API      | API系Lambda群 + API Gateway                          |
| Unit 3: AI/ML Components | Bedrock連携系（Recommendation・Persona・Learning）  |
| Unit 4: Infrastructure   | AWS CDKによるインフラ定義                            |

**論点**: Application Design で「Bedrock は各Lambdaから直接呼び出し」「Bedrockは専用Lambdaを作らない」と確定したため、実行計画書の Unit 3（AI/ML Components）を独立ユニットとして切り出すか、API系Lambdaと統合するかを再確認する必要がある。

---

## 実行チェックリスト

### Part 1: Planning

- [x] 1. ユニット分解の方針を確定（本ファイルの質問へのユーザー回答）
- [x] 2. 曖昧な回答に対するフォローアップ質問（必要な場合）— 不要（矛盾・曖昧さなし）
- [x] 3. ユーザー承認取得（2026-05-09T00:02:00Z）

### Part 2: Generation

- [x] 4. `aidlc-docs/inception/application-design/unit-of-work.md` を作成（ユニット定義・責務・Greenfield用コード組織方針）
- [x] 5. `aidlc-docs/inception/application-design/unit-of-work-dependency.md` を作成（ユニット間依存マトリクス）
- [x] 6. `aidlc-docs/inception/application-design/unit-of-work-story-map.md` を作成（要件/コンポーネントとユニットのマッピング）
  - User Stories はスキップしたため、FR-xx / NFR-xx 要件とコンポーネントをユニットにマッピングする
- [x] 7. ユニット境界と依存関係の妥当性検証
- [x] 8. 全コンポーネント・要件がユニットに割り当てられていることの確認

---

## ユニット分解質問（Planning 用）

以下の質問に `[Answer]:` タグで回答してください。回答がない質問があると生成フェーズに進めません。

各質問の最後の選択肢は `Other` です。提示された選択肢に合致しない場合は `Other` を選び、その後に自由記述してください。

---

### Question 1 — ユニット分解の基本方針

Application Design で Application 全体の設計が完了しています。ユニット（独立して開発・デプロイ可能な単位）をどう切り出しますか？

A) **3ユニット構成**: Mobile Frontend / Backend（API系Lambda + バッチLambda全部 + Bedrock連携） / Infrastructure
 → Bedrock呼び出しがバックエンド各Lambdaに分散しているため、Backend を1ユニットに統合する
B) **4ユニット構成（実行計画書の暫定）**: Mobile Frontend / Backend API（API系Lambda） / AI/ML（Bedrockを使うLambda群を分離） / Infrastructure
 → Bedrock連携Lambdaを AI/ML ユニットに分離
C) **5ユニット構成**: Mobile Frontend / Backend API（API系Lambda） / Batch（バッチLambdaのみ） / AI/ML（Bedrockを使うLambda群） / Infrastructure
 → バッチ処理とBedrock連携を両方分離
D) **2ユニット構成**: Frontend / Backend（バックエンドとインフラを統合）
 → Infrastructure-as-Code をバックエンドと同居させる
E) Other（自由記述）

[Answer]: EでAの３ユニット構成＋バッチの合計４ユニット構成にして。

---

### Question 2 — チーム体制・コード管理

ユニットをチームや人員でどう分担して開発する想定ですか？

A) **単独開発**（1人〜少人数で全ユニットを担当）
 → ユニット境界を緩くし、共通コード・共通型の共有を優先
B) **並行開発**（ユニットごとに担当を分け、並行作業）
 → ユニット境界を厳密にし、インターフェース契約を先に固める
C) **段階的開発**（ユニットを順番に1つずつ完成させる）
 → ユニット順序と依存を重視
D) Other（自由記述）

[Answer]: B

---

### Question 3 — モノレポ vs マルチレポ

ユニットをどのリポジトリ構成で管理しますか？（**Greenfield の Code Organization 決定**）

A) **モノレポ**（単一リポジトリ内に全ユニットを配置）。ルートは `package.json` workspaces または `pnpm workspace`、`turbo` を使用
 → 型定義・共通ユーティリティの共有が容易。統合変更も1つのコミットで済む
B) **マルチレポ**（ユニットごとに独立したリポジトリ）
 → 責務分離が明確。権限・リリース管理も独立
C) **ハイブリッド**（Frontend と Backend/Infra は分離、Backend と Infra は同居）
D) Other（自由記述）

[Answer]: A

---

### Question 4 — 共通型・共通コードの扱い

バックエンドとフロントエンドで共通する型（ActionTicket, Goal, DailySummary など component-methods.md の型定義）をどう共有しますか？

A) **共通パッケージ**（モノレポ内 `packages/shared-types` などに切り出し、両方から import）
B) **OpenAPI / JSON Schema 自動生成**（バックエンドで定義 → フロント型を自動生成）
C) **手動コピー**（各ユニット内に型を個別定義。差分はPRレビューで検知）
D) **GraphQLスキーマ**（API定義を GraphQL にして型を統合）
E) Other（自由記述）

[Answer]: B

---

### Question 5 — バッチLambdaの扱い

DailyAggregationLambda と LearningEngineLambda（バッチ処理）をどのユニットに含めますか？（Question 1 の選択によって自動決定される場合は A を選択）

A) **Question 1 の選択に従う**（3ユニット構成なら Backend、5ユニット構成なら Batch）
B) **Backend API と同居**（Lambda ランタイム・共通ユーティリティを共有したいため）
C) **独立ユニット化**（デプロイサイクル・テスト戦略が異なるため分離）
D) Other（自由記述）

[Answer]: A

---

### Question 6 — インフラユニットの粒度

AWS CDK（Infrastructure-as-Code）ユニットの構成はどうしますか？

A) **単一CDKアプリ**（全AWSリソースを1つのCDK Stackまたは複数Stackにまとめて管理）
B) **ユニットごとにCDKスタック分割**（Frontend用 Stack / Backend用 Stack / バッチ用 Stack / 共通DB Stack）
C) **環境ごと（dev/prod）にスタック分割**
D) Other（自由記述）

[Answer]: B

---

### Question 7 — ユニット間のインターフェース契約

ユニット間のインターフェース（特に Frontend ↔ Backend の API 契約）をどう管理しますか？

A) **OpenAPI（Swagger）を Single Source of Truth として定義し、両ユニットで参照**
B) **component-methods.md の TypeScript インターフェースを共通パッケージ化（Q4-A と合わせる）**
C) **ドキュメント（Markdown）ベースで管理し、実装で合わせる**
D) **tRPC / GraphQL で型レベルで同期**
E) Other（自由記述）

[Answer]: A

---

### Question 8 — Bedrock連携のテスト戦略（ユニット境界に影響）

Bedrock 呼び出しを含む Lambda（UserLambda / RecommendationLambda / ActionTicketLambda / DailyAggregationLambda / LearningEngineLambda）のテスト戦略は、ユニット分解に影響を与えうるので確認します。

A) **Bedrock クライアントを抽象化し、各Lambda内でモック可能にする**（共通BedrockService なし、Q1 の前提と一致）
B) **共通の BedrockClient ヘルパーパッケージを作る**（モノレポ内の `packages/bedrock-client` など）
C) **各Lambdaで個別にAWS SDK v3を直接使う**（共通化せず、重複を許容）
D) Other（自由記述）

[Answer]: A

---

### Question 9 — コードレイアウトのディレクトリ構造（Greenfield 必須）

ワークスペースルートのディレクトリ構造はどうしますか？（Q3 の回答と組み合わせて最終化）

A) **モノレポ標準（`apps/` + `packages/`）**:

```
/
├── apps/
│   ├── mobile/        # React Native
│   ├── backend/       # Lambda群
│   └── infra/         # CDK
├── packages/
│   └── shared-types/  # 共通型
└── package.json (workspaces)
```

B) **フラット構造**:

```
/
├── mobile/
├── backend/
├── infra/
└── shared/
```

C) **Backend 内部をさらに細分化**:

```
/
├── apps/
│   ├── mobile/
│   ├── backend/
│   │   ├── api/          # API系Lambda
│   │   ├── batch/        # バッチLambda
│   │   └── shared/       # Bedrockヘルパー等
│   └── infra/
└── packages/shared-types/
```

D) Other（自由記述）

[Answer]: DでA＋バッチは別ディレクトリ管理

---

### Question 10 — ユニット開発順序（Q2-C「段階的開発」選択時のみ必須、他は任意）

段階的開発を選択した場合、ユニットをどの順序で開発しますか？

A) **Infra → Backend → AI/ML → Frontend**（インフラを先に整備）
B) **Backend → Infra → Frontend**（APIをモックで先行、インフラはE2Eテストの直前）
C) **Frontend とモック Backend を並走、後から実Backendに置き換え**
D) Other（自由記述）

[Answer]: 

---

## 回答完了後の次のステップ

全ての `[Answer]:` タグに回答が入ったら「回答完了」や「OK」などと伝えてください。
回答内容を分析し、以下を実施します:

1. 曖昧な回答・矛盾のチェック（あれば追加質問）
2. ユーザー承認後に Generation フェーズへ移行
3. `unit-of-work.md` / `unit-of-work-dependency.md` / `unit-of-work-story-map.md` の 3 ファイルを生成

---

## 質問分類の根拠

| 質問カテゴリ           | 該当 Q | 根拠                                                                                    |
| ---------------------- | ------ | --------------------------------------------------------------------------------------- |
| Story Grouping         | Q1, Q5 | 実行計画書で暫定4ユニット案があるが AI/ML の独立性を要再確認。バッチLambdaの帰属も要確認 |
| Dependencies           | Q7, Q8 | ユニット間インターフェース、Bedrock共通化の有無は依存構造に直接影響                       |
| Team Alignment         | Q2     | 単独/並行/段階で境界の厳密度が変わる                                                    |
| Technical Considerations | Q6, Q8 | CDK スタック分割・Bedrock クライアント戦略はデプロイ粒度・テスト戦略に影響              |
| Business Domain        | Q1     | Application Design の6ドメイン構成とユニットの対応関係を確認                             |
| Code Organization      | Q3, Q4, Q9 | Greenfield 必須。モノレポ/マルチレポ、共通型戦略、ディレクトリ構造を確定                |

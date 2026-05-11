# Application Design 計画 — だが、それでいい（DagaSoreDeIi_App）

## 実行チェックリスト

- [x] 1. コンポーネント識別と責務定義（components.md）
- [x] 2. コンポーネントメソッド定義（component-methods.md）
- [x] 3. サービス層設計（services.md）
- [x] 4. コンポーネント依存関係設計（component-dependency.md）
- [x] 5. 統合設計ドキュメント（application-design.md）
- [x] 6. 設計の完全性・一貫性検証
- [x] 7. 指摘事項.md に基づく修正対応（[application-design-revision-plan.md](./application-design-revision-plan.md)）

---

## 設計質問（ユーザー回答が必要）

以下の質問に対して `[Answer]:` タグに回答を記入してください。

---

### Q1: モバイルフロントエンドの状態管理

React Nativeアプリの状態管理アプローチについて確認します。

**選択肢:**

- A. Redux Toolkit（大規模・予測可能な状態管理。学習コスト高め）
- B. Zustand（軽量・シンプル。小〜中規模向け）
- C. React Context + useReducer（追加ライブラリなし。中規模まで）
- D. Jotai / Recoil（アトミック状態管理。柔軟性高い）

[Answer]: B

### Q2: バックエンドAPIのコンポーネント分割粒度

Lambda関数の分割方針について確認します。

**選択肢:**

- A. 機能ドメイン単位（Auth/Profile/Goal/Ticket/Recommendation/LearningEngine/EffortPoint）— 7〜8 Lambda
- B. CRUD操作単位（各リソースにCRUD Lambda）— 細粒度、Lambda数が多い
- C. ユースケース単位（画面遷移・ユーザーアクション単位）— 中粒度
- D. モノリシックLambda（1つのLambdaで全API処理）— シンプルだが拡張性低い

[Answer]: 機能ドメイン単位だけど、アクセスリソース単位が同じ物については同じにしたい

### Q3: React Navigationの画面構成

アプリの画面遷移構造について確認します。

**選択肢:**

- A. Stack Navigator のみ（シンプルな線形遷移）
- B. Bottom Tab Navigator + Stack Navigator（タブ＋スタック。一般的なモバイルUX）
- C. Drawer Navigator + Stack Navigator（サイドメニュー＋スタック）
- D. Bottom Tab + Stack + Modal（タブ＋スタック＋モーダル。最も柔軟）

[Answer]: B

### Q4: Bedrock連携コンポーネントの設計方針

Amazon Bedrock呼び出しのアーキテクチャについて確認します。

**選択肢:**

- A. 各Lambda関数から直接Bedrock呼び出し（シンプル。重複コードあり）
- B. 専用BedrockServiceコンポーネントを作成し、全Lambda共通で使用（DRY原則。推奨）
- C. API Gateway → 専用Bedrock Lambda → 各機能Lambda（非同期処理可能）
- D. Step Functionsでオーケストレーション（複雑なフロー管理向け）

[Answer]: A

### Q5: DynamoDBのテーブル設計方針

DynamoDBのテーブル分割について確認します。

**選択肢:**

- A. シングルテーブル設計（全エンティティを1テーブル。アクセスパターンが明確な場合に有効。設計・メンテナンスコストは高め）
- B. エンティティ種別ごとにテーブル分割（User/Profile/Goal/ActionTicket/ActionLog等。テーブル数が多くなる）
- C. ドメイン単位でテーブル分割（UserDB/ActionLogDB/SimilarUserDB。FR-01-7の削除対象データの分類と一致するが、テーブル設計として明示的に指定されているわけではない）
- D. ハイブリッド（コアエンティティはシングルテーブル、ログ系は別テーブル）

[Answer]: C

### Q6: 認証フローのコンポーネント設計

Cognito認証の実装方針について確認します。

**選択肢:**

- A. Amplify Auth ライブラリを使用（Cognito統合が容易。Amplifyエコシステム）
- B. amazon-cognito-identity-js を直接使用（軽量。Amplify不要）
- C. AWS SDK v3 + Cognito Identity Provider（低レベル制御。柔軟性最高）
- D. カスタム認証Lambda + JWT（完全カスタム。複雑）

[Answer]: A

### Q7: エラーハンドリングとフォールバックの設計方針

Bedrockタイムアウト・API障害時のフォールバック設計について確認します。

**選択肢:**

- A. 各コンポーネントで個別にエラーハンドリング（シンプル。重複あり）
- B. 共通ErrorHandlerコンポーネント + フォールバックメッセージストア（DRY原則）
- C. Circuit Breakerパターン（障害検知・自動復旧。複雑）
- D. BとCの組み合わせ（共通ハンドラー + Circuit Breaker）

[Answer]: B

### Q8: プッシュ通知・バックグラウンド処理（v1スコープ確認）

v1では「アプリ内表示のみ」と確定していますが、v2対応を見越したコンポーネント設計について確認します。

**選択肢:**

- A. v1はNotificationコンポーネントを作らない（v2で新規追加）
- B. v1からNotificationコンポーネントのインターフェースだけ定義しておく（v2で実装）
- C. v1からNotificationコンポーネントを作り、アプリ内通知のみ実装（v2でプッシュ通知追加）

[Answer]: A

### Q9: Learning Engineの設計境界

Learning EngineはBedrock呼び出しを含む複雑なコンポーネントです。設計境界について確認します。

**選択肢:**

- A. RecommendationServiceの一部として統合（単一コンポーネント）
- B. 独立したLearningEngineServiceコンポーネント（RecommendationServiceから呼び出し）
- C. 独立したLearningEngineLambda（非同期処理。Action_Ticket Done時にイベント駆動）
- D. BとCのハイブリッド（同期呼び出し + 非同期バックグラウンド学習）

[Answer]: この選択で言うならば、Cだと思うけど、そもそも週次バッチにしてほしい。requirementsから修正よろしく

### Q10: フロントエンドのAPIクライアント設計

React NativeからバックエンドAPIを呼び出すクライアント層の設計について確認します。

**選択肢:**

- A. axios + カスタムAPIクライアントクラス（シンプル。広く使われる）
- B. React Query（TanStack Query）+ axios（キャッシュ・再試行・ローディング状態管理が容易）
- C. SWR + fetch（軽量。Next.jsエコシステム由来だがRNでも使用可）
- D. AWS Amplify API（Amplifyエコシステム統合。Q6でAmplify選択時に自然）

[Answer]: B

## 回答完了後の次のステップ

全ての `[Answer]:` タグへの回答が完了したら、このファイルを保存してください。
回答内容を分析し、Application Designの成果物（components.md / component-methods.md / services.md / component-dependency.md）を生成します。

# Team A - だが、それでいい（DagaSoreDeIi_App）

AWS DLC ハッカソン Team A のリポジトリです。

## 📱 プロジェクト概要

「**だが、それでいい**」は、行動変容を支援するモバイルアプリケーションです。

ユーザーの目標達成をAIがサポートし、「完璧でなくてもいい、小さな一歩から始めよう」というコンセプトで、無理なく行動習慣化を促進します。

### 主な機能

- **プロフィール登録・Goal管理**: ユーザーの目標を複数管理、Primary Goalを設定
- **State Detection / Recommendation**: ユーザーの状態を検知し、AIが次の行動を提案
- **Pivot機能**: 目標達成が難しい時、代替案を提示
- **Effort Point**: 行動に応じたポイント付与でモチベーション維持
- **Action Ticket**: 具体的な行動をチケット化して完了申告
- **Future Self Model**: 類似ユーザーのデータから未来の自分をシミュレート

## 🎯 開発プロセス

本プロジェクトは **AI-DLC（AI Development Life Cycle）** メソドロジーに従って開発されています。
要件定義から設計まで、AIツール（Kiro）を活用した体系的な開発プロセスを経て作成されたドキュメント群です。

## 🛠️ 技術スタック（設計）

### フロントエンド
- React Native / TypeScript
- Zustand（状態管理）
- React Query（データフェッチング）
- React Navigation（画面遷移）

### バックエンド
- AWS Lambda / API Gateway
- Amazon DynamoDB（UserDB / ActionLogDB / SimilarUserDB）
- Amazon Cognito（認証）
- Amazon Bedrock（LLM / Recommendation生成）
- Amazon EventBridge（スケジューラ）

## � プロジェクト構造

```
team-a/
└── aidlc-docs/              # AI-DLC 開発プロセス・設計ドキュメント
    ├── aidlc-state.md       # AI-DLC 状態管理
    ├── audit.md             # 開発プロセスの監査ログ
    ├── handoff-summary.md   # ハンドオフサマリー
    └── inception/
        ├── requirements/    # 要件定義
        ├── application-design/  # アプリケーション設計
        └── plans/           # 各種計画書
```

## 📚 ドキュメント

### 要件定義
- [要件定義書](./aidlc-docs/inception/requirements/requirements.md)
- [要件確認質問](./aidlc-docs/inception/requirements/requirement-verification-questions.md)
- [要件明確化の追加質問](./aidlc-docs/inception/requirements/requirement-clarification-questions.md)

### 設計ドキュメント
- [アプリケーション設計](./aidlc-docs/inception/application-design/application-design.md)
- [コンポーネント定義](./aidlc-docs/inception/application-design/components.md)
- [コンポーネント依存関係](./aidlc-docs/inception/application-design/component-dependency.md)
- [コンポーネントメソッド](./aidlc-docs/inception/application-design/component-methods.md)
- [サービス定義](./aidlc-docs/inception/application-design/services.md)
- [Unit of Work](./aidlc-docs/inception/application-design/unit-of-work.md)
- [Unit of Work 依存関係](./aidlc-docs/inception/application-design/unit-of-work-dependency.md)
- [Unit of Work ストーリーマップ](./aidlc-docs/inception/application-design/unit-of-work-story-map.md)

### 計画書
- [実行計画](./aidlc-docs/inception/plans/execution-plan.md)
- [アプリケーション設計計画](./aidlc-docs/inception/plans/application-design-plan.md)
- [アプリケーション設計修正計画](./aidlc-docs/inception/plans/application-design-revision-plan.md)
- [Unit of Work 計画](./aidlc-docs/inception/plans/unit-of-work-plan.md)

### プロセス記録
- [AI-DLC 状態管理](./aidlc-docs/aidlc-state.md)
- [監査ログ](./aidlc-docs/audit.md)
- [ハンドオフサマリー](./aidlc-docs/handoff-summary.md)

## 📄 ライセンス

ISC

# Team A - だが、それでいい

AWS DLC ハッカソン Team A のリポジトリです。

## プロジェクト概要

「だが、それでいい」は、行動変容を支援するモバイルアプリケーションです。
ユーザーの目標達成をAIがサポートし、小さな一歩から始める行動習慣化を促進します。

## 技術スタック

### フロントエンド
- React 19
- TypeScript
- Vite
- React Router
- Zustand (状態管理)
- React Query (データフェッチング)
- Axios (HTTP クライアント)

### バックエンド（開発環境）
- Express (モックAPIサーバー)
- TypeScript

### バックエンド（本番環境 - 未実装）
- AWS Lambda
- API Gateway
- DynamoDB
- Amazon Cognito
- Amazon Bedrock
- EventBridge

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env` ファイルを作成（`.env.example` を参考）:

```bash
cp .env.example .env
```

### 3. 開発サーバーの起動

#### フロントエンドのみ起動

```bash
npm run dev
```

ブラウザで http://localhost:5173/ にアクセス

#### バックエンド（モックAPI）のみ起動

```bash
npm run dev:backend
```

モックAPIサーバーが http://localhost:3001/api で起動

#### フロントエンド + バックエンド同時起動

```bash
npm run dev:all
```

- フロントエンド: http://localhost:5173/
- バックエンドAPI: http://localhost:3001/api

## API エンドポイント（モックサーバー）

### Profile・Goal管理
- `GET /api/users/:userId/profiles` - Profile取得
- `PUT /api/users/:userId/profiles` - Profile更新
- `GET /api/users/:userId/goals` - Goal一覧取得
- `POST /api/users/:userId/goals` - Goal追加
- `PUT /api/users/:userId/goals/:goalId` - Goal更新
- `DELETE /api/users/:userId/goals/:goalId` - Goal削除
- `PATCH /api/users/:userId/goals/:goalId/primary` - Primary Goal設定

### Action Ticket管理
- `GET /api/tickets/:userId` - Ticket一覧取得
- `PATCH /api/tickets/:userId/:ticketId/done` - Ticket Done申告

### Recommendation
- `POST /api/recommendations/:userId` - Recommendation生成
- `POST /api/recommendations/:userId/:recommendationId/answer` - Recommendation応答

### Effort Point
- `GET /api/effort-points/:userId` - Effort Point取得
- `GET /api/effort-points/:userId/weekly` - 週間Effort Point取得

## ビルド

```bash
npm run build
```

ビルド成果物は `dist/` ディレクトリに出力されます。

## プロジェクト構造

```
team-a/
├── backend/              # モックAPIサーバー
│   ├── data/            # モックデータ
│   ├── routes/          # APIルート
│   └── server.ts        # Expressサーバー
├── src/
│   ├── lib/             # ユーティリティ
│   │   ├── apiClient.ts
│   │   ├── errorHandler.ts
│   │   └── queryClient.ts
│   ├── screens/         # 画面コンポーネント
│   ├── services/        # APIサービス層
│   ├── store/           # Zustand ストア
│   └── App.tsx
├── aidlc-docs/          # 設計ドキュメント
└── package.json
```

## ドキュメント

設計ドキュメントは `aidlc-docs/` ディレクトリを参照してください。

- [アプリケーション設計](./aidlc-docs/inception/application-design/application-design.md)
- [コンポーネント定義](./aidlc-docs/inception/application-design/components.md)
- [要件定義](./aidlc-docs/inception/requirements/requirements.md)

## ライセンス

ISC

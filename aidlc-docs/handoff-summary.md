# ハンドオフサマリー — だが、それでいい（DagaSoreDeIi_App）

## 現在のステータス

| 項目 | 内容 |
|------|------|
| **フェーズ** | INCEPTION PHASE |
| **完了ステージ** | Workspace Detection ✅、Requirements Analysis ✅ |
| **次のステージ** | Workflow Planning（User Storiesはスキップ予定） |
| **承認待ち** | Requirements Analysis の内容をユーザーが承認後、Workflow Planning へ進む |

---

## プロジェクト概要

「だが、それでいい」は行動支援モバイルアプリ。Primary_Goalが達成できない日でも、別の行動ができたことを肯定的に評価する。0点か100点かではなく、何かできた日はみんな合格点というコンセプト。

---

## 確定した技術スタック

| レイヤー | 技術 |
|----------|------|
| モバイル | React Native（TypeScript）— iOS + Android |
| 認証 | AWS Cognito |
| DB | AWS DynamoDB |
| AI | Amazon Bedrock（Recommendation・Persona_Message・Learning Engine） |
| インフラ | AWS Lambda + API Gateway（サーバーレス） |
| 位置情報 | v2以降（v1はなし） |
| 言語 | 日本語のみ（v1） |

---

## v1 スコープ（確定）

| 機能 | 備考 |
|------|------|
| 認証・アカウント管理 | Cognito、メール/パスワード |
| プロフィール登録（AIアシスト付き） | ニックネーム・年齢・職業・興味・生活リズム・悩み |
| 複数Goal管理（優先度付き） | Primary_Goal固定最高優先度、Pivot_Goalはユーザー変更可 |
| State Detection（手動Triggerのみ） | Open Ticketゼロ時は自動発火、手動は常時発火可 |
| Recommendation + Pivot | 4択応答（やる/別の方法で/目標チェンジ/自由入力） |
| Action_Ticket管理 | 行動決定時に生成、goalType/actionLevelラベル付き |
| Effort_Point報酬 | primary/normal=10pt、primary/minimal=5pt、pivot/normal=7pt、pivot/minimal=3pt |
| Future Self Model | v1はモックデータのみ（実データはv2） |
| Persona_Message | Bedrock生成、口語体「俺/お前」スタイル |
| Learning Engine | 7件未満はデフォルトプロンプト、7件以上でパーソナライズ切り替え |
| プロフィール動的更新 | 行動ログ反映、得意パターン分析 |

## v2 以降に延期

- 位置情報Trigger（GPS）
- バックグラウンド・アプリ外プッシュ通知
- Future Self Model 実データ活用
- Bedrockコンテキスト上限対策（ログ要約・圧縮）
- 多言語対応

---

## 拡張機能設定

| 拡張機能 | 状態 |
|----------|------|
| Security Baseline | **無効** |
| Property-Based Testing | **部分適用**（純粋関数・シリアライゼーションのみ） |
| UIテスト | React Native Testing Library でページ単位テスト実施 |

---

## 成果物ファイル一覧

| ファイル | 内容 |
|----------|------|
| `aidlc-docs/inception/requirements/requirements.md` | **メイン要件ドキュメント（最新・承認待ち）** |
| `aidlc-docs/inception/requirements/requirement-verification-questions.md` | 初回確認質問と回答 |
| `aidlc-docs/inception/requirements/requirement-clarification-questions.md` | 追加確認質問と回答 |
| `aidlc-docs/aidlc-state.md` | ワークフロー進捗状態 |
| `aidlc-docs/audit.md` | 全操作の監査ログ |

---

## 次の担当者がやること

1. `aidlc-docs/inception/requirements/requirements.md` を読んで内容を把握する
2. ユーザーに要件ドキュメントの承認を求める
3. 承認後、**Workflow Planning** ステージへ進む（AI-DLC ワークフローに従う）
4. Workflow Planning では、CONSTRUCTION PHASEの実行計画（どのステージをどの順で実行するか）を策定する

---

## 直前の会話で決まったこと（引き継ぎ注意点）

- FR-04の位置情報機能は**全てv2**に落とした（手動Triggerのみv1）
- FR-06-6のAction_Ticket生成タイミングは「最終行動決定時」に変更（途中の「いいえ」応答ではチケットを作らない）
- FR-08-3（自由入力でのgoalType/actionLevel選択UI）は**削除**
- FR-11の行動モデルの定義を明示的にドキュメントに記載済み
- FR-11-2にBedrockコンテキスト上限対策をv2要件として追記済み
- NFR-06-3にReact Native Testing LibraryによるUIテストを追加済み

# 要件ドキュメント

## はじめに

「だが、それでいい」は、「今日も何かできた」を見つけるための行動支援アプリケーションです。

もちろん、目標通りのことが目標通りにできた日は100点満点です。それが最高の状態。でも、英語の勉強ができなかった代わりに筋トレした日も、散歩しただけの日も、80点くらいはあげたい。「できなかった」を責めるのではなく、「別のことができた」を称えるアプリです。

従来の習慣トラッカーアプリが「一つの習慣をストイックに継続させる」ことを目的とするのに対し、本アプリは目標通りにできた日を最高としつつも、別のことができた日も十分に価値があると捉えます。0点か100点かではなく、何かできた日はみんな合格点。

**コンセプト**: 目標通りにできた日は100点満点。でも、別のことができた日も80点くらいある。ユーザーは英語が喋れないかもしれないが、代わりにマッチョになる。それでいい。

---

## 用語集

- **DagaSoreDeIi_App**: 本アプリケーション「だが、それでいい」全体を指すシステム名。「どんな行動も無駄じゃない」を体現する行動支援アプリ
- **User**: アプリを利用する個人ユーザー
- **Profile**: ユーザーの属性・興味・行動傾向・心理状態などを記録したデータ。AIによる行動提案の基盤となる
- **Goal**: ユーザーが設定する目標（例：「英語を習慣的にやりたい」）。複数設定可能。あくまで出発点であり、そこに縛られる必要はない
- **Primary_Goal**: ユーザーが最優先として設定したGoal。出発点として機能するが、別の強みや才能が開花する可能性を妨げない
- **Pivot_Goal**: Primary_Goalの達成が難しい日に、同じくらい価値のある別の選択肢として提案されるGoal（例：筋トレ、散歩）
- **Flexible_Achievement**: 当初の目標でなくても、何かしら行動できたことを肯定的に評価する概念。本アプリの中心的な価値観
- **State_Detection**: ユーザーの現在の状態（位置情報・心理状態など）を検知する機能。v1ではアプリ起動時および手動起動時に実行される
- **Trigger**: State_Detectionによって検知された、行動提案を発火させる条件（例：「アプリ起動時に2時間以上自宅にいる」「ホーム画面のボタンをタップした」）
- **Recommendation**: TriggerをもとにAIが生成する行動提案。初回は必ずPrimary_Goalに関連した提案を行う
- **Pivot**: ユーザーがRecommendationを拒否または無視した際に、Pivot_Goalへと提案を切り替える機能。「失敗」ではなく「別の価値ある選択肢」への切り替えを意味する。アプリ起動時に実行される
- **Effort_Point**: 当初のGoalであれ代替のGoalであれ、1日の終わりに何かしら行動した場合に付与されるポイント。「何をやっても価値がある」というメッセージを体現する
- **Persona_Message**: 通知・提案のトーン＆マナー。「未来の自分（Future_Self_Model）が語りかける」スタイルを基本とし、肯定的・称賛的なトーンを重視する
- **Learning_Engine**: ユーザーの行動結果（Yes/No）を蓄積し、次回のRecommendationを最適化するAIコンポーネント
- **Action_Log**: ユーザーが実際に行った行動の記録。ProfileおよびLearning_Engineの更新に使用される
- **Similar_User_Data**: 同じようなステータス・プロフィールを持つ他ユーザーの匿名化された行動・結果データ。Future_Self_Modelの構築に使用される
- **Future_Self_Model**: Similar_User_Dataを基に構築した「未来の自分」モデル。「あなたと似た状況だった人は、筋トレを始めて3ヶ月でこうなった」という形で実データの裏付けを持つPersona_Messageを実現する
- **Action_Ticket**: ユーザーがRecommendationに応答（「やる」「いいえ（別の方法で）」「目標チェンジ」「自由入力」）した時点で生成される行動タスク。ステータスは「未完了（Open）」と「完了（Done）」の2種類。ユーザーが自己申告でDoneにするまでOpenのまま保持され、1日の終わりに未完了のまま残ったチケットは自動破棄される

---

## 要件

### 要件 1: プロフィール登録とAIサポート

**ユーザーストーリー:** ユーザーとして、自分の属性・興味・生活スタイルを詳細に登録したい。そうすることで、AIが自分に合ったパーソナライズされた行動提案を行えるようになる。

#### 受け入れ基準

1. DagaSoreDeIi_App SHALL ユーザーが初回起動時にProfileの登録を完了するまで、アプリの本機能（Recommendation・Pivot等）にアクセスできない必須オンボーディングフローを提供する
2. DagaSoreDeIi_App SHALL Profile登録項目として、氏名・年齢・職業・興味分野・生活リズム（朝型/夜型）・現在の悩みを含む
3. WHEN ユーザーがProfileを登録したとき、DagaSoreDeIi_App SHALL AIがProfileを解析し、初期Pivot_Goal候補を3件以上自動生成する
4. DagaSoreDeIi_App SHALL ユーザーがProfileをいつでも編集できる機能を提供する
5. IF Profile登録が未完了の状態でユーザーがアプリを利用しようとした場合、THEN DagaSoreDeIi_App SHALL 未入力項目を明示し、登録完了を促すメッセージを表示する
6. WHEN ユーザーの行動ログ（Action_Log）が蓄積されたとき、Learning_Engine SHALL Profileを自動更新し、行動傾向の変化を反映する

---

### 要件 2: 複数Goalの設定

**ユーザーストーリー:** ユーザーとして、達成したい目標を複数登録したい。Goalはあくまで出発点であり、そこに縛られる必要はない。一つの目標を追いかける中で、別の強みや才能が開花することもある。どのGoalを達成しても「今日も動いた」と感じられる環境を作りたい。

#### 受け入れ基準

1. DagaSoreDeIi_App SHALL ユーザーが複数のGoalを登録できる機能を提供する
2. DagaSoreDeIi_App SHALL ユーザーがGoalの中から1件をPrimary_Goalとして指定できる機能を提供する
3. DagaSoreDeIi_App SHALL 登録されたGoalのうちPrimary_Goal以外を自動的にPivot_Goal候補（同じくらい価値のある別の選択肢）として扱う
4. WHEN ユーザーがGoalを削除するとき、DagaSoreDeIi_App SHALL 削除前に確認ダイアログを表示する
5. IF 削除対象のGoalがPrimary_Goalである場合、THEN DagaSoreDeIi_App SHALL 別のGoalをPrimary_Goalに設定するよう促すメッセージを表示する

---

### 要件 3: 状態検知（State Detection）

**ユーザーストーリー:** ユーザーとして、アプリを開いたタイミングで自分の状態をシステムに検知してほしい。そうすることで、「今日をより良くするきっかけ」につながる行動提案を受けられる。

#### 受け入れ基準

1. State_Detection SHALL 位置情報・手動起動の2種類のTriggerソースをサポートする
2. WHEN ユーザーがアプリを起動したとき、State_Detection SHALL ユーザーの現在の状態を検知しTriggerを評価する（v1ではアプリ起動時のみ実行。バックグラウンドでのプッシュ通知トリガーはv2以降）
3. WHEN アプリ起動時に前回起動時からの経過時間が2時間以上、かつ現在地と前回起動時の位置情報がほぼ同一（移動していない）と判定されたとき、State_Detection SHALL 「長時間滞在」Triggerを発火する
4. DagaSoreDeIi_App SHALL 通常ホーム画面にボタンを設置し、ユーザーがいつでも手動でTriggerを発火してRecommendationフローを開始できる機能を提供する
5. WHEN ユーザーが手動TriggerボタンをタップしたときDagaSoreDeIi_App SHALL 心理状態の入力を任意で受け付けた後にRecommendationフローを開始する（入力された心理状態はPersona_Messageのパーソナライズに使用する）
6. DagaSoreDeIi_App SHALL ユーザーが各Triggerソースの有効/無効を個別に設定できる機能を提供する
7. IF 位置情報の取得権限が拒否されている場合、THEN DagaSoreDeIi_App SHALL 位置情報Triggerを無効化し、手動起動Triggerのみで動作する
8. WHEN 複数のTriggerが同時に発火したとき、State_Detection SHALL 最も優先度の高いTriggerを1件選択してRecommendationを生成する

---

### 要件 4: アプリ起動時のレコメンド

**ユーザーストーリー:** ユーザーとして、アプリを開いたタイミングで「今日をより良くするきっかけ」となる提案を受けたい。そうすることで、その日の行動を起こすモチベーションを得られる。

#### 受け入れ基準

1. WHEN ユーザーがアプリを起動しTriggerが発火したとき、またはユーザーが手動TriggerボタンをタップしたときDagaSoreDeIi_App SHALL Future_Self_ModelのPersona_Messageのトーンで初回Recommendationをアプリ内に表示する（v1ではアプリ内表示のみ。アプリを開いていないタイミングでのプッシュ通知はv2以降）
2. DagaSoreDeIi_App SHALL 初回RecommendationをPrimary_Goalに関連した行動提案とする（例：「カフェに移動して英語の文法勉強しない？」）
3. DagaSoreDeIi_App SHALL すべてのRecommendationに以下の4択の応答ボタンを含める（初回・Pivot後を問わず共通）
   - **「やる」**：提案されたアクションをそのまま実施する
   - **「いいえ（別の方法で）」**：同じGoal内で別のアクションを提案する（例：「カフェで英語」→「家で英語の映画を見る」）
   - **「目標チェンジ」**：Pivot機能を起動し、別のGoalへの行動を提案する（例：「やっぱ筋トレする？」）
   - **自由入力**：ユーザーが自分でやりたいことを入力でき、アプリはその行動を受け入れてAction_Logに記録する
4. WHEN ユーザーが4択のいずれかに応答したとき、DagaSoreDeIi_App SHALL その行動に対応するAction_Ticketを生成しステータスをOpen（未完了）として保持する

---

### 要件 5: 柔軟な達成とピボット機能

**ユーザーストーリー:** ユーザーとして、アプリを開いたタイミングでPrimary_Goalができない日でも、同じくらい価値のある別の行動提案を受けたい。提案は常に「未来の自分」が語りかけるスタイルで行われ、「今日も何かできた」という達成感を得られる。どのGoalを達成しても、それは十分に価値がある。

#### 受け入れ基準

1. WHEN ユーザーがアプリを起動し初回Recommendationに「やる」と応答したとき、DagaSoreDeIi_App SHALL Primary_Goalの達成をサポートする詳細なアクションステップを表示する
2. WHEN ユーザーがアプリを起動し初回Recommendationに「いいえ（別の方法で）」と応答したとき、DagaSoreDeIi_App SHALL 同じPrimary_Goal内で別のアクションをFuture_Self_ModelのPersona_Messageで提案する（例：「カフェで英語の文法勉強」→「家で英語の映画を見る」）
3. DagaSoreDeIi_App SHALL Pivot提案を常にFuture_Self_ModelのPersona_Message（未来の自分の設定・語り口）で行う
4. WHEN ユーザーが初回Recommendationを無視して別の行動（例：筋トレ）を開始したとき、DagaSoreDeIi_App SHALL その行動をAction_Logに記録しPivot_Goalとして認識する
5. DagaSoreDeIi_App SHALL Pivot後のRecommendationにも要件4.3で定義した4択の応答ボタンを使用する
6. WHEN ユーザーがPivot後のRecommendationの4択のいずれかに応答したとき、DagaSoreDeIi_App SHALL その行動に対応するAction_Ticketを生成しステータスをOpen（未完了）として保持する
7. IF ユーザーが「目標チェンジ」を選択したとき、かつPivot_Goal候補（Primary_Goal以外のGoal）が存在しない場合、THEN DagaSoreDeIi_App SHALL ユーザーのProfileの興味分野・生活リズム・現在の悩みを参照してAIが即席のPivot候補を提案する（例：Profileに「運動が好き」とあれば「筋トレとかどう？」）
8. IF ユーザーがPivot後のRecommendationも別の提案を希望した場合、THEN DagaSoreDeIi_App SHALL 最低限の行動（例：「5分だけ外の空気を吸いに行く」）をFuture_Self_ModelのPersona_Messageで提案する
9. WHEN ユーザーがAction_TicketをDoneにしたとき、Learning_Engine SHALL その行動結果をAction_Logに記録し次回のRecommendation最適化に使用する

---

### 要件 6: プロフィールの動的更新

**ユーザーストーリー:** ユーザーとして、自分の行動結果がプロフィールに自動反映されてほしい。そうすることで、AIの提案が時間とともに自分の実態に合ったものになっていく。どのGoalへの行動も等しく学習データとして活用されてほしい。

#### 受け入れ基準

1. WHEN ユーザーがいずれかのGoalに関連する行動を完了したとき、DagaSoreDeIi_App SHALL Action_LogをProfileに反映し行動傾向スコアを自動更新する
2. WHEN ユーザーが連続3日以上Pivot_Goalの行動を完了したとき、またはそのPivot_Goalへの応答率が80%を超えたとき、Learning_Engine SHALL そのPivot_GoalをPrimary_Goal候補として昇格提案するメッセージをアプリ内に表示する
3. DagaSoreDeIi_App SHALL 過去30日間のAction_Logに基づいてProfileの「得意な行動パターン」を自動分析し表示する
4. DagaSoreDeIi_App SHALL Profileの更新履歴をユーザーが閲覧できる機能を提供する

---

### 要件 7: 努力ポイント報酬システム

**ユーザーストーリー:** ユーザーとして、当初の目標でなくても何かしら行動した日には報酬を受け取りたい。そうすることで、「今日も何かできた」という達成感を感じ、翌日への意欲を維持できる。何をやっても価値があることを実感したい。

#### 受け入れ基準

1. WHEN ユーザーがAction_TicketをDoneにしたとき、DagaSoreDeIi_App SHALL そのAction_TicketのgoalTypeとactionLevelに応じてEffort_Pointを即時付与する
2. DagaSoreDeIi_App SHALL Effort_Pointを以下のルールで付与する
   - goalType=primary / actionLevel=normal：10 Effort_Point
   - goalType=primary / actionLevel=minimal：5 Effort_Point
   - goalType=pivot / actionLevel=normal：7 Effort_Point
   - goalType=pivot / actionLevel=minimal：3 Effort_Point
3. WHEN 自由入力でAction_Ticketを生成するとき、DagaSoreDeIi_App SHALL ユーザーがgoalType（「Primary_Goal」「Pivot_Goal」）とactionLevel（「normal」「minimal」）を選択できるUIを提供する（選択された組み合わせに基づいてEffort_Pointが決定される）
4. WHEN Effort_Pointが付与されたとき、DagaSoreDeIi_App SHALL Future_Self_ModelのPersona_Messageのトーンで「今日も何かできたね」という肯定的なメッセージとともにポイントをアプリ内に表示する
5. DagaSoreDeIi_App SHALL 1日の終わりの集計時刻をユーザーが0時〜23時の整数時刻（1時間単位）で設定できる機能を提供する（デフォルト：24:00＝0時）
6. DagaSoreDeIi_App SHALL 設定された集計時刻にその日の累計Effort_Pointをサマリー表示する
7. DagaSoreDeIi_App SHALL ユーザーの累計Effort_Pointおよび週間・月間の推移をグラフで表示する
8. WHEN 累計Effort_Pointが100の倍数に達したとき、DagaSoreDeIi_App SHALL 特別な達成メッセージとバッジを表示する
9. IF その日に一切の行動が記録されなかった場合、THEN DagaSoreDeIi_App SHALL Effort_Pointを付与せず「明日また何かできるよ」という前向きな励ましメッセージのみをアプリ内に表示する

---

### 要件 8: Future Self Modelの構築と活用

**ユーザーストーリー:** ユーザーとして、「未来の自分」からのアドバイスが実データに基づいたものであってほしい。そうすることで、「あなたと似た状況だった人は、筋トレを始めて3ヶ月でこうなった」という具体的な根拠を持つ提案を受けられ、行動への信頼感と動機が高まる。

#### 受け入れ基準

1. DagaSoreDeIi_App SHALL 同じようなステータス・プロフィールを持つ他ユーザーの行動・結果データをSimilar_User_Dataとして匿名化して収集・保持する
2. WHEN ユーザーのProfileが登録されたとき、DagaSoreDeIi_App SHALL Similar_User_Dataを参照しユーザーに類似したプロフィールを持つ他ユーザーの行動パターンを抽出してFuture_Self_Modelを構築する
3. DagaSoreDeIi_App SHALL Future_Self_Modelに基づき「あなたと似た状況だった人は、〇〇を始めて△ヶ月でこうなった」という形式の実データに裏付けられたPersona_Messageメッセージを生成する
4. WHEN Action_Logが蓄積されたとき、Learning_Engine SHALL Future_Self_Modelを更新しより精度の高い「未来の自分」像を反映する
5. DagaSoreDeIi_App SHALL Similar_User_Dataの収集・利用について、初回利用時にユーザーの明示的な同意を取得する
6. DagaSoreDeIi_App SHALL Similar_User_Dataを収集する際に個人を特定できる情報を含まないよう匿名化処理を施す
7. IF Similar_User_Dataが十分に蓄積されていない場合（類似ユーザーが5件未満）、THEN DagaSoreDeIi_App SHALL Future_Self_ModelをProfileとGoalのみに基づいた推定モデルで代替する

---

### 要件 9: Persona_Messageによるアプリ内メッセージ

**ユーザーストーリー:** ユーザーとして、「未来の自分（Future_Self_Model）」が語りかけてくるようなユニークなメッセージをアプリ内で受け取りたい。そうすることで、行動を起こすモチベーションが高まる。習慣化できた日は称えてほしいし、別のことができた日も「それでいいよ」と言ってほしい。（v1はアプリ内メッセージのみ。プッシュ通知はv2以降）

#### 受け入れ基準

1. DagaSoreDeIi_App SHALL すべてのアプリ内メッセージをPersona_Message（Future_Self_Modelが語りかけるスタイル）で生成する
2. DagaSoreDeIi_App SHALL Persona_Messageの文体として、一人称「俺（私）」を使用し、ユーザーへの呼びかけを「お前（あなた）」とする口語体を採用する
3. WHEN Triggerが発火したとき、DagaSoreDeIi_App SHALL ProfileおよびFuture_Self_ModelおよびAction_Logを参照してPersona_Messageをパーソナライズしたメッセージを生成する
4. DagaSoreDeIi_App SHALL メッセージの生成にAIを使用し、ユーザーのProfileとFuture_Self_Modelと直近のAction_Logに基づいた文脈のあるメッセージを生成する
5. DagaSoreDeIi_App SHALL Primary_Goalを達成した日のメッセージに「今日もできたね、最高」という称賛メッセージを含める
6. DagaSoreDeIi_App SHALL Pivot_Goalを達成した日のメッセージに「英語できなかったけど、筋トレできたじゃん。それでいいよ」のような肯定的なメッセージを含める

---

### 要件 10: Learning Engineによる最適化

**ユーザーストーリー:** ユーザーとして、アプリが自分の行動パターンを学習し、時間とともにより的確な提案をしてほしい。そうすることで、的外れな提案が減り、「今日も何かできた」につながる行動に移りやすくなる。

#### 受け入れ基準

1. Learning_Engine SHALL ユーザーのAction_Log（Yes/No応答・Action_TicketのDone記録・時間帯・曜日・対象Goal種別）を蓄積し行動モデルを構築する
2. WHEN Action_Logが7件以上蓄積されたとき、Learning_Engine SHALL Recommendationの生成アルゴリズムをパーソナライズされたモデルに切り替える
3. IF ユーザーが学習データのリセットを要求した場合、THEN DagaSoreDeIi_App SHALL 確認ダイアログを表示した後にAction_LogおよびLearning_Engineのモデルをリセットする

---

### 要件 11: データの永続化とプライバシー

**ユーザーストーリー:** ユーザーとして、自分のデータが安全に保管され、デバイスを変えても引き継がれるようにしたい。また、位置情報などのセンシティブなデータの扱いを自分でコントロールしたい。

#### 受け入れ基準

1. DagaSoreDeIi_App SHALL 位置情報・スクリーンタイムなどのセンシティブデータの収集について、初回利用時にユーザーの明示的な同意を取得する

---

### 要件 13: 認証・アカウント管理

**ユーザーストーリー:** ユーザーとして、メールアドレスとパスワードでアカウントを作成・ログインしたい。そうすることで、デバイスを変えてもデータが引き継がれ、自分の行動履歴や学習データを安全に管理できる。

#### 受け入れ基準

1. DagaSoreDeIi_App SHALL ユーザーがメールアドレスとパスワードで新規アカウントを登録できる機能を提供する
2. WHEN ユーザーが新規登録を完了したとき、DagaSoreDeIi_App SHALL 登録したメールアドレスに確認メールを送信し、メールアドレスの有効性を検証する
3. IF メールアドレスが未確認の状態でユーザーがアプリを利用しようとした場合、THEN DagaSoreDeIi_App SHALL メール確認を促すメッセージを表示し、確認メールの再送信オプションを提供する
4. DagaSoreDeIi_App SHALL ユーザーが登録済みのメールアドレスとパスワードでログインできる機能を提供する
5. DagaSoreDeIi_App SHALL ユーザーがパスワードを忘れた場合に、登録済みメールアドレス宛にパスワードリセット用のリンクを送信する機能を提供する
6. DagaSoreDeIi_App SHALL ログイン状態をセッションとして保持し、アプリを再起動しても自動的にログイン状態を維持する
7. DagaSoreDeIi_App SHALL ユーザーがアカウントを削除できる機能を提供する。アカウント削除時は確認ダイアログを表示し、承認後にProfile・Goal・Action_Log・Action_Ticket・Effort_Pointを含むすべての個人データを削除する

---

### 要件 12: Action_Ticketによる行動管理

**ユーザーストーリー:** ユーザーとして、「やる」と決めた行動を自分のペースで完了申告したい。そうすることで、プレッシャーなく「今日も何かできた」を積み上げられる。やりきれなかった日も責められず、できたことだけが称えられる体験を得たい。

#### 受け入れ基準

1. WHEN ユーザーがRecommendationの4択（「やる」「いいえ（別の方法で）」「目標チェンジ」「自由入力」）のいずれかに応答したとき、DagaSoreDeIi_App SHALL その行動内容・対象Goal・生成日時を含むAction_TicketをOpen（未完了）ステータスで生成する
2. DagaSoreDeIi_App SHALL ユーザーがアプリ内のAction_Ticket一覧からいつでも任意のチケットをDone（完了）に自己申告できる機能を提供する
3. WHEN ユーザーがAction_TicketをDoneにしたとき、DagaSoreDeIi_App SHALL 完了日時を記録しAction_Logに反映する
4. DagaSoreDeIi_App SHALL 1日の終わり（要件7で定義した集計タイミング）にOpenのまま残っているAction_Ticketを自動破棄する
5. WHEN Action_Ticketが自動破棄されたとき、DagaSoreDeIi_App SHALL Future_Self_ModelのPersona_Messageのトーンで「〇〇はできなかったけど、でも△△ができたから全然トータルOKじゃん！」という形式の肯定的なメッセージをアプリ内に表示する（△△には当日Done済みのAction_Ticketの内容を参照する）
6. IF その日にDone済みのAction_Ticketが1件も存在しない場合、THEN 破棄メッセージは「今日はできなかったけど、明日また何かできるよ」という前向きな励ましメッセージとする
7. DagaSoreDeIi_App SHALL 破棄されたAction_Ticketの履歴（破棄日時・行動内容）をユーザーが閲覧できる形で保持する（「消えた旨」の可視化）
8. DagaSoreDeIi_App SHALL アプリ内のどこからでもOpen状態のAction_Ticket一覧にアクセスできるUIを提供する

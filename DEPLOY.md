# Render.com デプロイ手順

このドキュメントでは、Next.jsアプリをRender.comにデプロイする手順を説明します。

## ✅ 1. Gitの準備（完了済み）

- ✅ Gitリポジトリを初期化済み
- ✅ `.gitignore` ファイルが適切に設定済み（`.env*.local` が除外されています）
- ✅ 全ファイルをコミット済み

## 📤 2. GitHubへのプッシュ

### 手順

1. **GitHubで新しいリポジトリを作成**
   - GitHubにログイン
   - 右上の「+」→「New repository」をクリック
   - リポジトリ名を入力（例: `speak-ai-conversation`）
   - **「Initialize this repository with a README」はチェックしない**
   - 「Create repository」をクリック

2. **ローカルリポジトリをGitHubに接続してプッシュ**

   以下のコマンドを実行してください（`YOUR_USERNAME` と `YOUR_REPO_NAME` を実際の値に置き換えてください）：

   ```bash
   # リモートリポジトリを追加
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   
   # ブランチ名をmainに変更（Render.comはmainブランチを推奨）
   git branch -M main
   
   # GitHubにプッシュ
   git push -u origin main
   ```

   **例：**
   ```bash
   git remote add origin https://github.com/yourusername/speak-ai-conversation.git
   git branch -M main
   git push -u origin main
   ```

   > **注意**: GitHubの認証が必要な場合があります。Personal Access Tokenを使用するか、GitHub CLIを使用してください。

## 🚀 3. Render.comでの設定

### Renderダッシュボードでの設定

1. **Render.comにログイン**
   - https://render.com にアクセス
   - ダッシュボードに移動

2. **「New Web Service」をクリック**

3. **GitHubリポジトリを接続**
   - 「Connect GitHub」をクリック
   - 作成したリポジトリを選択

4. **以下の設定値を入力**

   | 項目 | 値 |
   |------|-----|
   | **Name** | `speak-ai-conversation`（任意の名前） |
   | **Environment** | `Node` |
   | **Region** | お好みのリージョン（例: `Oregon (US West)`） |
   | **Branch** | `main` |
   | **Root Directory** | （空欄のまま） |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install && npm run build` |
   | **Start Command** | `npm start` |
   | **Instance Type** | `Free` または `Starter`（お好みで） |

   > **重要**: 
   - **Build Command**: `npm install && npm run build` ✅
   - **Start Command**: `npm start` ✅

5. **「Create Web Service」をクリック**

## 🔐 4. 環境変数の設定

### Renderダッシュボードで環境変数を追加

1. 作成したWeb Serviceのページに移動
2. 左側のメニューから「Environment」をクリック
3. 「Add Environment Variable」をクリック
4. 以下の2つの環境変数を追加：

   | Key | Value |
   |-----|-------|
   | `GOOGLE_GENERATIVE_AI_API_KEY` | ローカルの `.env.local` からコピーした値 |
   | `DEEPL_API_KEY` | ローカルの `.env.local` からコピーした値 |

   > **⚠️ 重要**: ローカルの `.env.local` ファイルを開いて、それぞれのAPIキーの値をコピーして貼り付けてください。

5. 各環境変数を追加したら、「Save Changes」をクリック

6. **デプロイが自動的に再実行されます**

## 📝 補足情報

### デプロイの確認

- デプロイが完了すると、Renderが自動的にURLを生成します（例: `https://speak-ai-conversation.onrender.com`）
- このURLにアクセスしてアプリが正常に動作するか確認してください

### トラブルシューティング

- デプロイが失敗する場合、Renderのログを確認してください
- 環境変数が正しく設定されているか確認してください
- `package.json` の `start` スクリプトが `next start` になっているか確認してください

### 無料プランの制限

- Renderの無料プランでは、15分間アクセスがないとスリープします
- 初回アクセス時に起動に時間がかかることがあります




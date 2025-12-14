# AI英会話ウェブアプリ

Next.js、TypeScript、Tailwind CSSを使用したAI英会話アプリケーション。Google Gemini APIとDeepL APIを使用しています。

## 機能

- **英会話機能**: 音声入力によるAIとの英会話練習
- **翻訳ツール**: DeepL APIを使用した日英/英日翻訳
- **音声読み上げ**: Web Speech APIによる英語応答の自動再生

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成し、以下の内容を追加してください：

```
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
DEEPL_API_KEY=your_deepl_api_key
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## 使用方法

1. 「英会話を始める」ボタンをクリック
2. トピックを選択するか、自由入力でトピックを指定
3. 「録音開始」ボタンを押して話し、「送信（録音終了）」ボタンで送信
4. AIの応答が英語と日本語で表示され、自動的に音声読み上げされます
5. チャット履歴の英語テキストをクリックすると、再読み上げできます

## 技術スタック

- **Frontend**: Next.js 14+ (App Router), React, TypeScript, Tailwind CSS
- **Icons**: Lucide React
- **AI**: Google Gemini 1.5 Flash
- **Translation**: DeepL API
- **TTS**: Web Speech API







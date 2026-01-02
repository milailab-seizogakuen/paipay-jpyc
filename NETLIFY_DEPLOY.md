# Netlify デプロイ手順

## 📋 前提条件

- Netlifyアカウント
- GitHubリポジトリ（またはGitLab/Bitbucket）

## 🚀 デプロイ手順

### 1. Netlifyに接続

1. [Netlify](https://www.netlify.com/)にログイン
2. 「Add new site」→「Import an existing project」
3. リポジトリを選択して接続

### 2. ビルド設定

Netlifyは自動的に`netlify.toml`を検出します。以下の設定が適用されます：

- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Node version**: 18

### 3. 環境変数の設定

Netlifyダッシュボードで以下の環境変数を設定してください：

**Site settings > Environment variables > Add a variable**

#### 必須の環境変数

```bash
NEXT_PUBLIC_JPYC_ADDRESS=0xE7C3D8C9a439feDe00D2600032D5dB0Be71C3c29
NEXT_PUBLIC_POLYGON_RPC_URL=https://polygon-rpc.com
NEXT_PUBLIC_POLYGON_CHAIN_ID=137
```

#### オプションの環境変数

```bash
# トランザクション履歴表示に使用（設定しなくても動作します）
NEXT_PUBLIC_POLYGONSCAN_API_KEY=your_api_key_here
```

### 4. デプロイ

1. リポジトリにプッシュすると自動的にデプロイが開始されます
2. または、Netlifyダッシュボードから「Trigger deploy」をクリック

## 🔧 トラブルシューティング

### ページが表示されない（404エラー）

#### 1. Next.jsプラグインの確認

**Site settings > Build & deploy > Build plugins** で以下を確認：
- `@netlify/plugin-nextjs`がインストールされているか
- プラグインが有効になっているか

#### 2. ビルドログの確認

**Netlifyダッシュボード > Deploys > 最新のデプロイ > Build log** で確認：
- ビルドが成功しているか
- エラーメッセージがないか
- Next.jsプラグインが正しく動作しているか

#### 3. 環境変数の確認

**Site settings > Environment variables** で以下が設定されているか確認：
- `NEXT_PUBLIC_JPYC_ADDRESS`
- `NEXT_PUBLIC_POLYGON_RPC_URL`
- `NEXT_PUBLIC_POLYGON_CHAIN_ID`

#### 4. 静的エクスポートに切り替える（プラグインが動作しない場合）

プラグインが動作しない場合は、静的エクスポートを使用できます：

1. **`next.config.js`を編集**：
```javascript
const nextConfig = {
  reactStrictMode: true,
  output: 'export',  // この行を追加
  trailingSlash: true,  // この行を追加
  // ... 他の設定
};
```

2. **`netlify.toml`を編集**：
```toml
[build]
  command = "npm run build"
  publish = "out"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

3. **再デプロイ**

### ビルドエラー

- **Node version**: Node 18を使用しているか確認
- **依存関係**: `npm install`が正常に完了しているか確認
- **TypeScriptエラー**: ローカルで`npm run build`が成功するか確認

### PWAが動作しない

- Service Workerは`public/sw.js`に生成されます
- HTTPSでアクセスしているか確認（PWAはHTTPS必須）

## 📝 注意事項

- 本番環境では必ずHTTPSを使用してください
- 環境変数は機密情報を含む可能性があるため、Gitにコミットしないでください
- デプロイ後、ブラウザのキャッシュをクリアして動作確認してください


# PaiPay P2P セキュリティガイド

## 🔒 実装済みセキュリティ機能

### 1. クライアント側トランザクション署名
✅ **ニーモニックフレーズをサーバーに送信しない**
- トランザクションはクライアント側（ブラウザ）で署名
- サーバーには署名済みトランザクションのみを送信
- ニーモニックや秘密鍵がネットワークを経由しない

### 2. ローカル鍵管理
✅ **秘密鍵はユーザーのデバイスのみに保存**
- IndexedDBで暗号化して保存
- サーバーには一切保存されない
- 完全なP2Pアーキテクチャ

### 3. 暗号化オプション
✅ **開発用と本番用の暗号化を選択可能**
- 開発用: シンプルなXOR暗号化（デバッグしやすい）
- 本番用: Web Crypto API (AES-GCM 256bit)

---

## ⚙️ 本番環境デプロイ前のチェックリスト

### 必須設定変更

#### 1. `src/config/community.ts` を編集

```typescript
security: {
  requirePIN: true,              // ← false から true に変更
  showMnemonicInUI: false,       // ← true から false に変更  
  useStrongEncryption: true,     // ← false から true に変更
}
```

#### 2. HTTPS を必須にする
- Vercel/Netlify にデプロイすれば自動的にHTTPS
- カスタムドメインの場合も必ずHTTPS証明書を設定

#### 3. 環境変数の確認
```bash
NEXT_PUBLIC_PAINAME_PACKAGE_ID=0x...  # 本番用トークンのPackage ID
NEXT_PUBLIC_PAINAME_TREASURY_CAP_ID=0x...  # 本番用Treasury Cap ID
```

---

## 🎨 カスタマイズ方法（開発者向け）

### トークン設定をカスタマイズ

`src/config/community.ts` を編集：

```typescript
export const COMMUNITY_CONFIG = {
  token: {
    name: 'あなたのトークン名',  // 例: 'SchoolCoin'
    symbol: 'YOUR',              // 例: 'SCL'
    decimals: 6,
  },
  
  branding: {
    appName: 'あなたのアプリ名',     // 例: 'SchoolPay'
    primaryColor: '#3b82f6',        // 青色の例
    logoUrl: 'https://...',         // あなたのロゴURL
    backgroundColor: '#dbeafe',     // 背景色
  },
};
```

### 環境変数を設定

`.env.local` を作成：

```bash
NEXT_PUBLIC_PAINAME_PACKAGE_ID=あなたのPackageID
NEXT_PUBLIC_PAINAME_TREASURY_CAP_ID=あなたのTreasuryCapID
```

---

## 🚨 絶対にやってはいけないこと

### ❌ ニーモニックフレーズの扱い
- サーバーログに出力しない
- データベースに保存しない
- 外部APIに送信しない
- URLパラメータに含めない

### ❌ 暗号化
- 本番環境で `useStrongEncryption: false` のままにしない
- 固定パスワードを使わない
- 暗号化なしで秘密鍵を保存しない

### ❌ セキュリティ設定
- 本番環境で `showMnemonicInUI: true` のままにしない
- HTTPでデプロイしない（必ずHTTPS）
- 開発用の設定を本番で使わない

---

## 📖 推奨事項

### ユーザー教育
- リカバリーフレーズの重要性を説明
- 安全な保管方法を案内
- フィッシング詐欺への注意喚起

### バックアップ
- ユーザーに必ずリカバリーフレーズを保存させる
- 複数の安全な場所に保管することを推奨
- 紙に書いて保管することを推奨

### 監視
- トランザクション失敗率を監視
- ユーザーからのエラー報告を受け付ける
- ブロックチェーンエクスプローラーでトランザクションを確認

---

## 🔧 開発者サポート

問題が発生した場合：
1. ブラウザのコンソールログを確認
2. Sui Testnet Explorer でトランザクションを確認
3. 環境変数が正しく設定されているか確認
4. HTTPS環境で動作しているか確認

---

**このガイドラインに従って実装すれば、安全なP2Pコミュニティ通貨システムを構築できます！** 🚀

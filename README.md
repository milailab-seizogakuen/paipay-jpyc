# PaiPay JPYC

Polygon MainnetでJPYC（日本円ステーブルコイン）を使ったP2P決済PWAアプリ

## 🚀 特徴

- **セキュア**: ニーモニックフレーズをクライアント側のみで管理
- **簡単**: QRコードで送受金
- **PWA対応**: オフラインでも動作
- **クライアント署名**: 秘密鍵をサーバーに送信しない

## 🛠 技術スタック

- Next.js 14 (App Router)
- TypeScript
- ethers.js v6
- Tailwind CSS
- IndexedDB (AES-GCM暗号化)

## 📦 インストール

```bash
npm install
```

## 🔧 環境変数設定

`.env.local` を作成:

```bash
# JPYC設定
NEXT_PUBLIC_JPYC_ADDRESS=0xE7C3D8C9a439feDe00D2600032D5dB0Be71C3c29

# Polygon設定
NEXT_PUBLIC_POLYGON_RPC_URL=https://polygon-rpc.com
NEXT_PUBLIC_POLYGON_CHAIN_ID=137
NEXT_PUBLIC_NETWORK=polygon-mainnet

# Polygonscan API（オプション）
# NEXT_PUBLIC_POLYGONSCAN_API_KEY=YourApiKeyHere

# アプリケーションURL
NEXT_PUBLIC_BASE_URL=http://localhost:3002
```

## 🚀 起動

```bash
# 開発サーバー
npm run dev

# ビルド
npm run build

# 本番起動
npm start
```

## 📱 主な機能

- ✅ ウォレット作成・復元（BIP39ニーモニック）
- ✅ PIN認証
- ✅ JPYC残高表示
- ✅ POL（ガス代）残高表示
- ✅ JPYC送金
- ✅ QRコード受取・送金
- ✅ トランザクション履歴

## 🔒 セキュリティ

- ニーモニックフレーズはIndexedDBにAES-GCM暗号化して保存
- 秘密鍵はクライアント側でのみ復号化
- サーバーには一切送信されない

## ⚠️ 注意事項

- Polygon Mainnetを使用（実際のJPYCトークン）
- 送金にはPOL（ガス代）が必要
- ブラウザキャッシュクリアでウォレット消失の可能性あり
- **必ずニーモニックフレーズをバックアップしてください**

## 📄 ライセンス

MIT

## 🙏 謝辞

- [JPYC](https://jpyc.jp/) - 日本円ステーブルコイン
- [Polygon](https://polygon.technology/) - Layer 2ソリューション

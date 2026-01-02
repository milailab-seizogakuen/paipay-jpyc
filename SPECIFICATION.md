# PaiPay JPYC プロジェクト仕様書

**バージョン**: 1.0  
**作成日**: 2025年1月  
**最終更新**: 2025年1月

---

## 📋 目次

1. [プロジェクト概要](#1-プロジェクト概要)
2. [技術スタック](#2-技術スタック)
3. [アーキテクチャ](#3-アーキテクチャ)
4. [主要機能](#4-主要機能)
5. [セキュリティ仕様](#5-セキュリティ仕様)
6. [データ構造](#6-データ構造)
7. [API・インターフェース](#7-apiインターフェース)
8. [環境設定](#8-環境設定)
9. [既知の問題・制約事項](#9-既知の問題制約事項)
10. [開発・デプロイ手順](#10-開発デプロイ手順)

---

## 1. プロジェクト概要

### 1.1 プロジェクト名
**PaiPay JPYC** (painame-p2p)

### 1.2 目的
Polygon Mainnet上でJPYC（日本円ステーブルコイン）を使用したP2P決済システムを提供するPWA（Progressive Web App）アプリケーション。

### 1.3 主要な特徴
- ✅ **完全P2P設計**: サーバーに秘密鍵を保存しない安全なアーキテクチャ
- ✅ **クライアント側署名**: ニーモニックフレーズをネットワーク経由で送信しない
- ✅ **強力な暗号化**: AES-GCM 256bit + PBKDF2 (100,000 iterations)
- ✅ **PIN保護**: ユーザー設定のPINでウォレットを保護
- ✅ **QRコード送受金**: 簡単な送受金操作
- ✅ **PWA対応**: オフラインでも動作可能
- ✅ **モバイル対応**: レスポンシブデザイン

### 1.4 対象ユーザー
- 日本円ステーブルコイン（JPYC）を使用したP2P決済を希望するユーザー
- モバイルデバイスで簡単に送受金を行いたいユーザー
- セキュリティを重視するユーザー

---

## 2. 技術スタック

### 2.1 フロントエンド
| 技術 | バージョン | 用途 |
|------|-----------|------|
| Next.js | 14.0.4 | Reactフレームワーク（App Router） |
| React | 18.2.0 | UIライブラリ |
| TypeScript | 5.3.3 | 型安全性 |
| Tailwind CSS | 3.4.0 | スタイリング |
| next-pwa | 5.6.0 | PWA機能 |

### 2.2 ブロックチェーン
| 技術 | バージョン | 用途 |
|------|-----------|------|
| ethers.js | 6.16.0 | Ethereum/Polygon SDK |
| Polygon Mainnet | - | ブロックチェーンネットワーク |
| JPYC (ERC-20) | - | 日本円ステーブルコイン |

### 2.3 セキュリティ・暗号化
| 技術 | 用途 |
|------|------|
| Web Crypto API | AES-GCM 256bit暗号化 |
| PBKDF2 | パスワードベース鍵導出（100,000 iterations） |
| BIP39 | ニーモニックフレーズ生成・検証 |
| IndexedDB | 暗号化データのローカル保存 |

### 2.4 その他
| 技術 | バージョン | 用途 |
|------|-----------|------|
| bip39 | 3.1.0 | ニーモニックフレーズ管理 |
| html5-qrcode | 2.3.8 | QRコードスキャン |
| qrcode | 1.5.4 | QRコード生成 |

---

## 3. アーキテクチャ

### 3.1 システム構成

```
┌─────────────────────────────────────────────────┐
│           クライアント（ブラウザ）                │
├─────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ React UI │  │ Keystore │  │  Crypto   │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │            │             │         │
│       └────────────┼─────────────┘         │
│                    │                        │
│              ┌─────▼─────┐                  │
│              │ IndexedDB │                  │
│              │ (暗号化)   │                  │
│              └───────────┘                  │
│                    │                        │
│              ┌─────▼─────┐                  │
│              │ ethers.js │                  │
│              │ (署名)     │                  │
│              └─────┬─────┘                  │
└────────────────────┼────────────────────────┘
                     │
         ┌───────────▼───────────┐
         │   Polygon RPC Node    │
         │  (https://polygon-    │
         │   rpc.com)            │
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │   JPYC ERC-20         │
         │   Contract            │
         │   (0xE7C3D8C9...)     │
         └───────────────────────┘
```

### 3.2 ディレクトリ構造

```
paipay-jpyc-main/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # ホーム画面
│   │   ├── setup/              # ウォレット作成・復元
│   │   ├── wallet/             # ウォレット画面（残高表示）
│   │   ├── send/               # 送金画面
│   │   ├── pin-setup/          # PIN設定
│   │   ├── pin-lock/           # PINロック画面
│   │   └── layout.tsx          # レイアウト
│   ├── components/             # Reactコンポーネント
│   │   ├── QRCodeDisplay.tsx   # QRコード表示
│   │   ├── QRScanner.tsx       # QRスキャナー
│   │   ├── QRScannerWrapper.tsx
│   │   └── PINInput.tsx        # PIN入力UI
│   ├── lib/                    # コアロジック
│   │   ├── keystore/           # 鍵管理
│   │   │   ├── generate.ts     # ウォレット生成
│   │   │   ├── mnemonic.ts     # ニーモニック管理
│   │   │   ├── storage.ts       # IndexedDB操作
│   │   │   └── pin.ts          # PINハッシュ化
│   │   ├── crypto/             # 暗号化
│   │   │   ├── encryption.ts   # AES-GCM暗号化
│   │   │   └── session-crypto.ts # セッション暗号化
│   │   ├── polygon/            # Polygon統合
│   │   │   ├── client.ts       # Polygon RPCクライアント
│   │   │   └── jpyc.ts         # JPYCコントラクト操作
│   │   ├── transaction/        # トランザクション
│   │   │   └── client-sign.ts  # クライアント側署名
│   │   └── jpyc.ts             # JPYC設定
│   └── config/                 # 設定ファイル
│       └── community.ts        # コミュニティ設定
├── public/                     # 静的ファイル
├── package.json
├── next.config.js
├── tsconfig.json
└── README.md
```

### 3.3 データフロー

#### ウォレット作成フロー
```
1. ユーザーが「ウォレット作成」を選択
2. generateNewWallet() でニーモニック生成（BIP39）
3. ethers.HDNodeWallet.fromPhrase() でウォレット生成
4. ユーザーに12単語のリカバリーフレーズを表示
5. PIN設定画面へ
6. PINでニーモニックを暗号化（AES-GCM）
7. IndexedDBに保存
```

#### 送金フロー（クライアント側署名）
```
1. ユーザーが送金先アドレス・金額を入力
2. PIN入力でウォレットを復号化
3. ニーモニックからウォレットを復元
4. 残高チェック（JPYC + POL）
5. クライアント側でトランザクション署名
6. Polygon RPCに送信
7. トランザクションハッシュを返す
```

---

## 4. 主要機能

### 4.1 ウォレット管理

#### 4.1.1 ウォレット作成
- **機能**: 新しいウォレットを生成
- **実装**: `src/lib/keystore/generate.ts`
- **フロー**:
  1. BIP39で12単語のニーモニック生成
  2. ethers.jsでEthereum互換ウォレット生成
  3. リカバリーフレーズを表示
  4. PIN設定
  5. 暗号化してIndexedDBに保存

#### 4.1.2 ウォレット復元
- **機能**: 既存のニーモニックからウォレットを復元
- **実装**: `src/lib/keystore/generate.ts::restoreWalletFromMnemonic()`
- **フロー**:
  1. ユーザーが12単語を入力
  2. BIP39で検証
  3. ウォレットを復元
  4. PIN設定
  5. 暗号化して保存

#### 4.1.3 PIN認証
- **機能**: PINでウォレットを保護
- **実装**: `src/lib/keystore/pin.ts`
- **特徴**:
  - PINはSHA-256でハッシュ化
  - 3回失敗で一時ロック（5分）
  - セッション管理（暗号化）

### 4.2 残高表示

#### 4.2.1 JPYC残高
- **機能**: JPYCトークンの残高を表示
- **実装**: `src/lib/polygon/jpyc.ts::getJpycBalance()`
- **API**: ERC-20 `balanceOf()` 関数

#### 4.2.2 POL（MATIC）残高
- **機能**: ガス代用のPOL残高を表示
- **実装**: `src/lib/polygon/client.ts::getMaticBalance()`
- **用途**: トランザクション手数料

### 4.3 送金機能

#### 4.3.1 JPYC送金
- **機能**: JPYCトークンを送金
- **実装**: `src/lib/polygon/jpyc.ts::sendJpyc()`
- **特徴**:
  - クライアント側署名（ニーモニックは送信しない）
  - 残高チェック（JPYC + POL）
  - ガス見積もり
  - トランザクション履歴表示

#### 4.3.2 QRコード送受金
- **機能**: QRコードでアドレスをスキャン/表示
- **実装**: 
  - `src/components/QRCodeDisplay.tsx` (表示)
  - `src/components/QRScanner.tsx` (スキャン)
- **用途**: モバイルでの簡単な送受金

### 4.4 トランザクション履歴

#### 4.4.1 履歴取得
- **機能**: 最近のトランザクションを表示
- **実装**: `src/lib/polygon/client.ts::getTransactionHistory()`
- **API**: Polygonscan API（オプション）
- **表示内容**:
  - 送金/受取の種類
  - 金額
  - 日時
  - エクスプローラーリンク

---

## 5. セキュリティ仕様

### 5.1 暗号化

#### 5.1.1 ストレージ暗号化
- **アルゴリズム**: AES-GCM 256bit
- **鍵導出**: PBKDF2 (100,000 iterations, SHA-256)
- **実装**: `src/lib/crypto/encryption.ts`
- **保存先**: IndexedDB
- **暗号化データ**:
  - ニーモニックフレーズ
  - IV（初期化ベクトル）
  - ソルト

#### 5.1.2 セッション暗号化
- **アルゴリズム**: AES-GCM 256bit
- **鍵**: ランダム生成（メモリ内のみ）
- **実装**: `src/lib/crypto/session-crypto.ts`
- **特徴**:
  - タブ閉じる/リロードで自動削除
  - sessionStorageに暗号化データのみ保存

### 5.2 クライアント側署名

#### 5.2.1 トランザクション署名
- **原則**: ニーモニックフレーズをネットワーク経由で送信しない
- **実装**: `src/lib/transaction/client-sign.ts`
- **フロー**:
  1. クライアント側でニーモニックからウォレット復元
  2. トランザクション構築
  3. クライアント側で署名
  4. 署名済みトランザクションのみを送信

### 5.3 PIN保護

#### 5.3.1 PIN設定
- **長さ**: 6桁数字
- **ハッシュ化**: SHA-256
- **実装**: `src/lib/keystore/pin.ts`

#### 5.3.2 PIN検証
- **失敗回数制限**: 3回
- **ロック時間**: 5分
- **実装**: `src/lib/keystore/pin.ts::verifyPIN()`

### 5.4 セキュリティチェックリスト

本番環境デプロイ前に確認:
- [ ] `security.requirePIN: true`
- [ ] `security.showMnemonicInUI: false`
- [ ] `security.useStrongEncryption: true`
- [ ] HTTPS環境でデプロイ
- [ ] 環境変数が正しく設定されている
- [ ] ニーモニックがネットワークログに出力されていない
- [ ] DevToolsでニーモニックが見えない

---

## 6. データ構造

### 6.1 ウォレットデータ（IndexedDB）

```typescript
interface WalletData {
  address: string;              // Ethereumアドレス (0x...)
  encryptedMnemonic: string;    // AES-GCM暗号化されたニーモニック
  iv: string;                   // 初期化ベクトル (Base64)
  salt: string;                 // ソルト (Base64)
  pinHash: string;              // PINのSHA-256ハッシュ
  createdAt: number;            // 作成タイムスタンプ
}
```

### 6.2 トランザクション履歴

```typescript
interface TransactionHistory {
  txHash: string;               // トランザクションハッシュ
  timestamp: number;            // Unixタイムスタンプ（ミリ秒）
  date: string;                // ISO形式の日時
  explorerUrl: string;         // Polygonscan URL
  type: 'sent' | 'received';   // 送金/受取
  amount: number;              // JPYC単位
  counterparty?: string;       // 相手のアドレス
}
```

### 6.3 送金パラメータ

```typescript
interface SendJpycParams {
  mnemonic: string;            // ニーモニックフレーズ
  toAddress: string;           // 送金先アドレス
  amount: number;              // 送金額（JPYC単位）
}
```

### 6.4 送金結果

```typescript
interface SendJpycResult {
  success: boolean;             // 成功/失敗
  txHash?: string;             // トランザクションハッシュ
  error?: string;              // エラーメッセージ
  explorerUrl?: string;        // エクスプローラーURL
}
```

---

## 7. API・インターフェース

### 7.1 Polygon RPC

#### 7.1.1 プロバイダー
```typescript
// src/lib/polygon/client.ts
export const polygonProvider = new ethers.JsonRpcProvider(
  RPC_URL,
  { chainId: 137, name: 'polygon-mainnet' }
);
```

#### 7.1.2 主要関数
```typescript
// MATIC残高取得
getMaticBalance(address: string): Promise<number>

// トランザクション履歴取得
getTransactionHistory(address: string, limit: number): Promise<TransactionHistory[]>
```

### 7.2 JPYCコントラクト

#### 7.2.1 コントラクトアドレス
```
0xE7C3D8C9a439feDe00D2600032D5dB0Be71C3c29 (Polygon Mainnet)
```

#### 7.2.2 ERC-20 ABI
```typescript
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];
```

#### 7.2.3 主要関数
```typescript
// JPYC残高取得
getJpycBalance(address: string): Promise<number>

// JPYC送金
sendJpyc(params: SendJpycParams): Promise<SendJpycResult>
```

### 7.3 ウォレット管理

#### 7.3.1 ウォレット生成
```typescript
// src/lib/keystore/generate.ts
generateNewWallet(): {
  mnemonic: string;
  secretKey: string;
  address: string;
  wallet: HDNodeWallet;
}
```

#### 7.3.2 ウォレット復元
```typescript
restoreWalletFromMnemonic(mnemonic: string): {
  mnemonic: string;
  secretKey: string;
  address: string;
  wallet: HDNodeWallet;
}
```

#### 7.3.3 ストレージ操作
```typescript
// src/lib/keystore/storage.ts
saveWallet(address: string, mnemonic: string, pin: string): Promise<void>
loadWallet(pin: string): Promise<WalletData | null>
hasWallet(): Promise<boolean>
deleteWallet(): Promise<void>
getPINHash(): Promise<string | null>
```

### 7.4 暗号化

#### 7.4.1 ストレージ暗号化
```typescript
// src/lib/crypto/encryption.ts
encryptWithPassword(plaintext: string, password: string): Promise<EncryptedData>
decryptWithPassword(encrypted: EncryptedData, password: string): Promise<string>
```

#### 7.4.2 セッション暗号化
```typescript
// src/lib/crypto/session-crypto.ts
encryptAndStoreSession(address: string, mnemonic: string): Promise<void>
decryptSessionMnemonic(): Promise<string | null>
isSessionValid(): boolean
clearSessionWallet(): void
```

---

## 8. 環境設定

### 8.1 環境変数

`.env.local` ファイルに以下を設定:

```bash
# JPYC設定
NEXT_PUBLIC_JPYC_ADDRESS=0xE7C3D8C9a439feDe00D2600032D5dB0Be71C3c29

# Polygon設定
NEXT_PUBLIC_POLYGON_RPC_URL=https://polygon-rpc.com
NEXT_PUBLIC_POLYGON_CHAIN_ID=137
NEXT_PUBLIC_NETWORK=polygon-mainnet

# Polygonscan API（オプション、トランザクション履歴用）
NEXT_PUBLIC_POLYGONSCAN_API_KEY=YourApiKeyHere

# アプリケーションURL
NEXT_PUBLIC_BASE_URL=http://localhost:3002
```

### 8.2 設定ファイル

#### 8.2.1 コミュニティ設定
`src/config/community.ts`:
```typescript
export const COMMUNITY_CONFIG = {
  token: {
    name: 'PainAme Coin',  // カスタマイズ可能
    symbol: 'PAC',
    decimals: 6,
  },
  branding: {
    appName: 'PaiPay',
    primaryColor: '#ef4444',
    logoUrl: 'https://i.imgur.com/ruz4D3L.png',
    backgroundColor: '#fef3c7',
  },
  security: {
    requirePIN: true,              // 本番ではtrue
    pinLength: 6,
    showMnemonicInUI: false,      // 本番ではfalse
    useStrongEncryption: true,     // 本番ではtrue
  },
  network: {
    type: 'testnet' as 'testnet' | 'mainnet',
    rpcUrl: 'https://fullnode.testnet.sui.io:443',
  },
};
```

**注意**: 現在の設定ファイルにはSuiの設定が残っていますが、実際の実装はPolygon/JPYCを使用しています。

---

## 9. 既知の問題・制約事項

### 9.1 マージコンフリクト

以下のファイルにマージコンフリクト（`<<<<<<< HEAD`）が残っています:

1. `src/config/community.ts` (行25-39)
2. `src/app/wallet/page.tsx` (複数箇所)
3. `src/app/send/page.tsx` (複数箇所)
4. `src/app/pin-lock/page.tsx` (複数箇所)
5. `src/lib/polygon/jpyc.ts` (複数箇所)
6. `next.config.js` (行12-21)

**対応**: マージコンフリクトを解決する必要があります。

### 9.2 設定ファイルの不整合

- `src/config/community.ts` にはSuiの設定が残っているが、実際の実装はPolygon/JPYCを使用
- トークン名が「PainAme Coin (PAC)」となっているが、実際はJPYCを使用

**対応**: 設定ファイルをPolygon/JPYC用に更新する必要があります。

### 9.3 セキュリティ設定

- 一部のファイルでセキュリティ設定が開発モードのまま（`useStrongEncryption: false`など）
- 本番環境デプロイ前に確認が必要

### 9.4 制約事項

- **ブラウザ依存**: IndexedDBとWeb Crypto APIが必要
- **ネットワーク依存**: Polygon RPCへの接続が必要
- **ガス代**: 送金にはPOL（MATIC）が必要
- **ブラウザキャッシュ**: キャッシュクリアでウォレットデータが消える可能性

---

## 10. 開発・デプロイ手順

### 10.1 開発環境セットアップ

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env.local
# .env.localを編集

# 開発サーバー起動
npm run dev
# http://localhost:3002 でアクセス
```

### 10.2 ビルド

```bash
# 本番ビルド
npm run build

# 本番サーバー起動
npm start
```

### 10.3 デプロイ

#### 10.3.1 Vercel
```bash
# Vercel CLIでデプロイ
vercel --prod
```

#### 10.3.2 環境変数の設定
Vercelダッシュボードで以下を設定:
- `NEXT_PUBLIC_JPYC_ADDRESS`
- `NEXT_PUBLIC_POLYGON_RPC_URL`
- `NEXT_PUBLIC_POLYGON_CHAIN_ID`
- `NEXT_PUBLIC_POLYGONSCAN_API_KEY` (オプション)

### 10.4 テスト

```bash
# 型チェック
npm run type-check

# リント
npm run lint
```

---

## 11. 今後の改善点

### 11.1 緊急対応
1. **マージコンフリクトの解決**: すべてのコンフリクトを解決
2. **設定ファイルの更新**: Polygon/JPYC用に統一
3. **セキュリティ設定の確認**: 本番環境用に設定

### 11.2 機能追加候補
- トランザクション履歴の詳細表示
- 複数ウォレット管理
- 送金履歴のエクスポート
- 通知機能（送金完了など）

### 11.3 パフォーマンス改善
- トランザクション履歴のキャッシュ
- 残高表示の最適化
- ローディング状態の改善

---

## 12. 参考資料

### 12.1 公式ドキュメント
- [JPYC公式サイト](https://jpyc.jp/)
- [Polygon公式ドキュメント](https://docs.polygon.technology/)
- [ethers.js ドキュメント](https://docs.ethers.org/)
- [Next.js ドキュメント](https://nextjs.org/docs)

### 12.2 関連ファイル
- `README.md`: 開発者向けガイド
- `REQUIREMENTS_V2.md`: 要件定義書
- `TECHNICAL_SPECIFICATION.md`: 技術仕様書
- `SECURITY.md`: セキュリティガイド

---

**作成者**: AI Assistant  
**最終更新**: 2025年1月


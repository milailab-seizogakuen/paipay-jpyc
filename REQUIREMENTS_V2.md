# PaiPay P2P セキュリティ強化版 要件定義書

**バージョン**: v2.0 (Security Enhanced)  
**作成日**: 2025年10月8日  
**目的**: クライアント側署名によるセキュリティ強化とコミュニティ通貨パッケージ化

---

## 📋 目次

1. [現状の問題点](#1-現状の問題点)
2. [改善目標](#2-改善目標)
3. [実装済みコンポーネント](#3-実装済みコンポーネント)
4. [必要な作業](#4-必要な作業)
5. [技術的課題](#5-技術的課題)
6. [成功基準](#6-成功基準)
7. [リスクと対策](#7-リスクと対策)

---

## 1. 現状の問題点

### 🔴 セキュリティリスク

#### 問題1: ニーモニックフレーズの平文送信
```typescript
// 現在の実装
body: JSON.stringify({
  mnemonic: wallet.mnemonic,  // ← ネットワーク経由で送信
  toAddress,
  amount,
})
```

**リスク**:
- ネットワークで傍受される可能性
- サーバーログに記録される可能性
- MITM攻撃のリスク
- HTTPSでも完全には安全ではない

#### 問題2: 弱い暗号化
```typescript
// 現在の暗号化: XOR（簡単に解読可能）
function simpleEncrypt(data: Uint8Array, password: string = 'paipay-p2p-key')
```

**リスク**:
- 固定パスワード
- XORは簡単に解読される
- IndexedDBは暗号化されていない

#### 問題3: 開発用ニーモニックの保存
```typescript
mnemonic?: string; // 開発用（本番では削除推奨）
```

**リスク**:
- DevToolsで平文表示
- メモリダンプで抜き取り可能

---

## 2. 改善目標

### 🎯 主要目標

1. **ニーモニックをネットワーク経由で送信しない**
   - クライアント側でトランザクション署名
   - 署名済みトランザクションのみをサーバーに送信

2. **強力な暗号化の実装**
   - Web Crypto API (AES-GCM 256bit)
   - ユーザー設定のPIN/パスワード

3. **開発者向けパッケージ化**
   - 簡単にカスタマイズ可能
   - 設定ファイルでブランディング変更
   - 開発/本番環境の切り替え

### 📊 非機能要件

- **パフォーマンス**: 署名処理は3秒以内
- **互換性**: 既存のウォレットデータを移行可能
- **使いやすさ**: ユーザー体験を損なわない

---

## 3. 実装済みコンポーネント

### ✅ 完成済み

#### 3.1 クライアント側署名ロジック
**ファイル**: `/src/lib/transaction/client-sign.ts`

```typescript
export async function createAndSignTransaction(params: SendTransactionParams) {
  // 1. ニーモニックから鍵ペア復元
  const keypair = Ed25519Keypair.deriveKeypair(mnemonic);
  
  // 2. トランザクション構築
  const tx = new Transaction();
  // ... コイン取得・送金処理
  
  // 3. クライアント側で署名
  const signedTx = await suiClient.signTransactionBlock({
    signer: keypair,
    transactionBlock: tx,
  });
  
  return {
    signedTransaction: signedTx.transactionBlockBytes,
    signature: signedTx.signature,
    fromAddress,
  };
}
```

**状態**: ✅ 実装完了（未適用）

#### 3.2 強力な暗号化
**ファイル**: `/src/lib/crypto/encryption.ts`

```typescript
// Web Crypto API (AES-GCM)
export async function encryptData(data: Uint8Array, password: string): Promise<string>
export async function decryptData(encryptedBase64: string, password: string): Promise<Uint8Array>
```

**状態**: ✅ 実装完了（未適用）

#### 3.3 設定ファイル
**ファイル**: `/src/config/community.ts`

```typescript
export const COMMUNITY_CONFIG = {
  token: { name, symbol, decimals },
  branding: { appName, primaryColor, logoUrl },
  security: {
    requirePIN: false,              // ← 本番ではtrue
    showMnemonicInUI: true,         // ← 本番ではfalse
    useStrongEncryption: false,     // ← 本番ではtrue
  },
};
```

**状態**: ✅ 実装完了（適用可能）

#### 3.4 ドキュメント
- `README.md`: 開発者向けガイド ✅
- `SECURITY.md`: セキュリティベストプラクティス ✅

---

## 4. 必要な作業

### 🔧 Phase 1: Sui SDK メソッド調査・修正

#### タスク1.1: 正しいメソッド名の確認
**問題**: 
```typescript
// 試したが動かなかった
suiClient.signTransactionBlock()
suiClient.executeTransactionBlock()
```

**調査事項**:
- Sui TypeScript SDK の正確なメソッド名
- パラメータの正確な型定義
- 返り値の正確な構造

**参考ドキュメント**: 
- https://sdk.mystenlabs.com/typescript
- @mysten/sui のバージョン確認

#### タスク1.2: 動作検証
1. 小さなテストスクリプトで検証
2. コンソールで各ステップの出力確認
3. 成功するまでメソッド名・パラメータを調整

### 🔧 Phase 2: クライアント側署名の適用

#### タスク2.1: 送金ページの更新
**ファイル**: `/src/app/send/page.tsx`

```typescript
// Before
body: JSON.stringify({ mnemonic, toAddress, amount })

// After
const signedTx = await createAndSignTransaction({ mnemonic, toAddress, amount });
body: JSON.stringify(signedTx);
```

#### タスク2.2: 送金APIの更新
**ファイル**: `/src/app/api/send/route.ts`

```typescript
// Before
const keypair = Ed25519Keypair.deriveKeypair(mnemonic);
await suiClient.signAndExecuteTransaction({...});

// After
await suiClient.executeTransactionBlock({
  transactionBlock: signedTransaction,
  signature: signature,
});
```

#### タスク2.3: エラーハンドリング
- ネットワークエラー
- 署名エラー
- 残高不足エラー
- タイムアウト

### 🔧 Phase 3: 強力な暗号化の適用（オプション）

#### タスク3.1: PIN設定画面の追加
- 初回ウォレット作成時にPIN設定
- 6桁数字のPIN入力UI

#### タスク3.2: ストレージの更新
**ファイル**: `/src/lib/keystore/storage.ts`

```typescript
// 設定に応じて暗号化方式を切り替え
if (COMMUNITY_CONFIG.security.useStrongEncryption) {
  await encryptData(secretKey, userPIN);
} else {
  simpleEncrypt(secretKey);
}
```

#### タスク3.3: ウォレット復元時のPIN入力
- PIN入力画面
- 復号化処理

### 🔧 Phase 4: テスト

#### 機能テスト
- [ ] ウォレット作成
- [ ] ウォレット復元
- [ ] 送金（クライアント側署名）
- [ ] 残高表示
- [ ] QRスキャン

#### セキュリティテスト
- [ ] ニーモニックがネットワークに流れないことを確認
- [ ] 暗号化されたデータがIndexedDBに保存されることを確認
- [ ] DevToolsでニーモニックが見えないことを確認

---

## 5. 技術的課題

### 🚧 課題1: Sui SDK メソッドの互換性

**問題**:
- `signTransactionBlock` が存在しない可能性
- バージョンによってメソッド名が異なる可能性

**調査方法**:
```typescript
// 利用可能なメソッドを確認
console.log(Object.keys(suiClient));
console.log(typeof suiClient.signTransaction);
console.log(typeof suiClient.signAndExecuteTransaction);
```

**解決策候補**:
1. SDKバージョンを確認・アップデート
2. 別のメソッドを使用
3. トランザクションを手動で構築

### 🚧 課題2: 既存ウォレットの移行

**問題**:
- 現在XOR暗号化されているウォレット
- AES-GCM に移行する必要がある

**解決策**:
1. 旧形式を検出
2. 一度復号化
3. 新形式で再暗号化
4. ユーザーにPIN設定を促す

### 🚧 課題3: パフォーマンス

**問題**:
- クライアント側署名の追加レイテンシ
- 暗号化・復号化の処理時間

**対策**:
- ローディング表示
- 処理時間の測定
- 最適化

---

## 6. 成功基準

### ✅ 必須条件

1. **セキュリティ**
   - ニーモニックがネットワークを経由しない
   - 送金が正常に完了する
   - 既存機能が全て動作する

2. **互換性**
   - 既存のウォレットが使える
   - QRコード機能が動作する
   - モバイル対応

3. **ドキュメント**
   - 開発者が簡単にカスタマイズできる
   - セキュリティガイドが明確

### 🎯 理想条件

1. **PIN/パスワード保護**
2. **強力な暗号化（AES-GCM）**
3. **テストカバレッジ80%以上**

---

## 7. リスクと対策

### ⚠️ リスク1: Sui SDK メソッドが見つからない

**影響度**: 高  
**対策**: 
- SDK公式ドキュメントを徹底調査
- Discordコミュニティに質問
- 別のアプローチを検討

### ⚠️ リスク2: パフォーマンス劣化

**影響度**: 中  
**対策**:
- ベンチマークテスト
- 非同期処理の最適化
- ローディング表示で体感速度改善

### ⚠️ リスク3: ユーザー体験の低下

**影響度**: 中  
**対策**:
- UI/UXの改善
- エラーメッセージの明確化
- チュートリアルの追加

---

## 📝 次のステップ

1. **Sui SDK メソッドの調査** → 正確なAPIを特定
2. **小規模テスト** → 署名・実行を分離してテスト
3. **段階的適用** → まずクライアント側署名のみ
4. **暗号化強化** → PIN機能は後回しでも可
5. **本番デプロイ** → HTTPS環境でテスト

---

## 🤝 相談事項

### 技術的相談
- Sui SDK の正しいメソッド名・使い方
- クライアント側署名の実装パターン
- エラーハンドリングのベストプラクティス

### 設計相談
- PIN設定のUX
- 暗号化方式の選択
- 移行パスの設計

---

**この要件定義書をベースに、もう一人のエージェントと相談して実装を進めましょう！**

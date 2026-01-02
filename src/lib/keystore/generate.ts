/**
 * 鍵生成ユーティリティ
 * Ethereum/Polygon ブロックチェーン用の秘密鍵とニーモニックフレーズを生成
 */

import { ethers } from 'ethers';
import * as bip39 from 'bip39';

/**
 * 新しいウォレットを生成
 * @returns ニーモニックフレーズ、秘密鍵、公開アドレス
 */
export function generateNewWallet() {
  // 1. ニーモニックフレーズ生成（12単語）
  const mnemonic = bip39.generateMnemonic(128); // 128 bits = 12 words

  // 2. ニーモニックからHDウォレットを導出
  const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic);

  // 3. 公開アドレスを取得（Ethereum形式: 0x...）
  const address = wallet.address;

  // 4. 秘密鍵をエクスポート（保存用）
  const secretKey = wallet.privateKey;

  return {
    mnemonic,           // 12単語のフレーズ
    secretKey,          // 秘密鍵（0x...形式の文字列）
    address,            // Ethereumアドレス (0x... 42文字)
    wallet,             // Walletオブジェクト（署名用）
  };
}

/**
 * ニーモニックフレーズから秘密鍵を復元
 * @param mnemonic - 12単語のニーモニックフレーズ
 * @returns 秘密鍵、公開アドレス、ニーモニック
 */
export function restoreWalletFromMnemonic(mnemonic: string) {
  // ニーモニックの検証
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new Error('無効なニーモニックフレーズです');
  }

  // ニーモニックからHDウォレットを導出
  const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic);
  const address = wallet.address;
  const secretKey = wallet.privateKey;

  return {
    mnemonic,           // ニーモニックも返す
    secretKey,
    address,
    wallet,
  };
}

/**
 * 秘密鍵からWalletを復元
 * @param secretKey - 秘密鍵（0x...形式の文字列）
 * @returns Walletオブジェクト
 */
export function restoreWalletFromSecretKey(secretKey: string) {
  const wallet = new ethers.Wallet(secretKey);
  return wallet;
}

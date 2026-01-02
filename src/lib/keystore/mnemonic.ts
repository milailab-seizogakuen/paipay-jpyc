/**
 * ニーモニックフレーズのユーティリティ
 */

import * as bip39 from 'bip39';

/**
 * ニーモニックフレーズを単語配列に変換
 */
export function mnemonicToArray(mnemonic: string): string[] {
  return mnemonic.trim().split(/\s+/);
}

/**
 * 単語配列をニーモニックフレーズに変換
 */
export function arrayToMnemonic(words: string[]): string {
  return words.join(' ');
}

/**
 * ニーモニックフレーズの検証
 */
export function validateMnemonic(mnemonic: string): boolean {
  return bip39.validateMnemonic(mnemonic);
}

/**
 * ニーモニックフレーズを隠す（表示用）
 * 例: "abandon ability able" → "a****** a****** a****"
 */
export function maskMnemonic(mnemonic: string): string {
  return mnemonicToArray(mnemonic)
    .map(word => word.charAt(0) + '*'.repeat(word.length - 1))
    .join(' ');
}

/**
 * ランダムに単語を選択（確認用）
 */
export function getRandomWordIndices(count: number = 3): number[] {
  const indices: number[] = [];
  while (indices.length < count) {
    const randomIndex = Math.floor(Math.random() * 12);
    if (!indices.includes(randomIndex)) {
      indices.push(randomIndex);
    }
  }
  return indices.sort((a, b) => a - b);
}

/**
 * セキュアストレージ
 * IndexedDBを使って秘密鍵をAES-GCM暗号化して保存
 */

import { encryptWithPassword, decryptWithPassword } from '@/lib/crypto/encryption';
import { hashPIN } from './pin';

const DB_NAME = 'PaiPayP2PWallet';
const STORE_NAME = 'keystore';
const DB_VERSION = 2; // バージョンアップ

interface WalletData {
  address: string;
  encryptedMnemonic: string; // AES-GCM暗号化されたニーモニック
  iv: string;                // 初期化ベクトル（Base64）
  salt: string;              // ソルト（Base64）
  pinHash: string;           // PINのハッシュ
  createdAt: number;
}

/**
 * IndexedDBの初期化
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * ウォレットを保存（PIN付き）
 */
export async function saveWallet(
  address: string,
  mnemonic: string,
  pin: string
): Promise<void> {
  const db = await openDB();

  // PINをハッシュ化
  const pinHash = await hashPIN(pin);

  // ニーモニックをAES-GCM暗号化
  const encrypted = await encryptWithPassword(mnemonic, pin);

  const walletData: WalletData = {
    address,
    encryptedMnemonic: encrypted.ciphertext,
    iv: encrypted.iv,
    salt: encrypted.salt,
    pinHash,
    createdAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(walletData, 'wallet');

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * ウォレットを読み込み（PIN付き）
 */
export async function loadWallet(pin: string): Promise<{
  address: string;
  secretKey: Uint8Array;
  mnemonic: string;
} | null> {
  try {
    const db = await openDB();

    return new Promise(async (resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get('wallet');

      request.onsuccess = async () => {
        try {
          const data = request.result as WalletData | undefined;
          if (!data) {
            resolve(null);
            return;
          }

          // ニーモニックを復号化
          const mnemonic = await decryptWithPassword(
            {
              ciphertext: data.encryptedMnemonic,
              iv: data.iv,
              salt: data.salt,
            },
            pin
          );

          // ニーモニックからウォレットを復元
          const { ethers } = await import('ethers');
          const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic);
          const secretKey = wallet.privateKey;

          resolve({
            address: data.address,
            secretKey: new Uint8Array(Buffer.from(secretKey.slice(2), 'hex')), // Remove 0x prefix
            mnemonic,
          });
        } catch (error) {
          console.error('Failed to decrypt wallet:', error);
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to load wallet:', error);
    return null;
  }
}

/**
 * PINハッシュを取得（PIN検証用）
 */
export async function getPINHash(): Promise<string | null> {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get('wallet');

      request.onsuccess = () => {
        const data = request.result as WalletData | undefined;
        resolve(data?.pinHash || null);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get PIN hash:', error);
    return null;
  }
}

/**
 * ウォレットが存在するかチェック
 */
export async function hasWallet(): Promise<boolean> {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get('wallet');

      request.onsuccess = () => {
        resolve(!!request.result);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to check wallet:', error);
    return false;
  }
}

/**
 * ウォレットを削除
 */
export async function deleteWallet(): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete('wallet');

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

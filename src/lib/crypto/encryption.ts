/**
 * 強力な暗号化ユーティリティ
 * Web Crypto API を使用した AES-GCM 暗号化
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const SALT = encoder.encode('paipay-p2p-secure-salt-v1');
const ITERATIONS = 100000;

/**
 * PIN/パスワードから暗号化キーを導出
 */
async function deriveKey(password: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: SALT,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * データを暗号化
 */
export async function encryptData(data: Uint8Array, password: string): Promise<string> {
  const key = await deriveKey(password);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 初期化ベクトル

  const encryptedData = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    data as BufferSource
  );

  // IV + 暗号化データ を Base64 エンコード
  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedData), iv.length);

  return btoa(String.fromCharCode.apply(null, Array.from(combined) as any));
}

/**
 * データを復号化
 */
export async function decryptData(encryptedBase64: string, password: string): Promise<Uint8Array> {
  const key = await deriveKey(password);
  const combined = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0));

  // IV と暗号化データを分離
  const iv = combined.slice(0, 12);
  const encryptedData = combined.slice(12);

  const decryptedData = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encryptedData
  );

  return new Uint8Array(decryptedData);
}

/**
 * パスワードで文字列を暗号化
 */
export async function encryptWithPassword(
  plaintext: string,
  password: string
): Promise<{ ciphertext: string; iv: string; salt: string }> {
  const data = encoder.encode(plaintext);

  // ソルトとIVを生成
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // パスワードからキーを導出
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  // 暗号化
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    data as BufferSource
  );

  // Base64エンコード
  const ciphertext = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(encryptedData)) as any));
  const ivBase64 = btoa(String.fromCharCode.apply(null, Array.from(iv) as any));
  const saltBase64 = btoa(String.fromCharCode.apply(null, Array.from(salt) as any));

  return { ciphertext, iv: ivBase64, salt: saltBase64 };
}

/**
 * パスワードで文字列を復号化
 */
export async function decryptWithPassword(
  encrypted: { ciphertext: string; iv: string; salt: string },
  password: string
): Promise<string> {
  // Base64デコード
  const ciphertext = Uint8Array.from(atob(encrypted.ciphertext), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(encrypted.iv), c => c.charCodeAt(0));
  const salt = Uint8Array.from(atob(encrypted.salt), c => c.charCodeAt(0));

  // パスワードからキーを導出
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  // 復号化
  const decryptedData = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    ciphertext
  );

  return decoder.decode(decryptedData);
}

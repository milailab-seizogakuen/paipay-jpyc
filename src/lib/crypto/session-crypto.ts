/**
 * sessionStorage用のランダムキー暗号化
 * メモリ内にキーを保持し、タブ閉じる/リロードで消滅
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// メモリ内キー（モジュールスコープ変数）
// タブ閉じる/リロードで自動的に消滅
let sessionEncryptionKey: CryptoKey | null = null;

/**
 * ランダムキーを生成（AES-GCM 256bit）
 */
async function generateRandomKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
        {
            name: 'AES-GCM',
            length: 256,
        },
        false, // extractable: false（キーをエクスポート不可）
        ['encrypt', 'decrypt']
    );
}

/**
 * セッションキーを初期化（初回のみ）
 */
async function ensureSessionKey(): Promise<CryptoKey> {
    if (!sessionEncryptionKey) {
        sessionEncryptionKey = await generateRandomKey();
    }
    return sessionEncryptionKey;
}

/**
 * ニーモニックを暗号化してsessionStorageに保存
 */
export async function encryptAndStoreSession(
    address: string,
    mnemonic: string
): Promise<void> {
    const key = await ensureSessionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // 暗号化
    const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoder.encode(mnemonic)
    );

    // IV + 暗号文をBase64エンコード
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), iv.length);
    const base64 = btoa(String.fromCharCode(...combined));

    // sessionStorageに保存
    sessionStorage.setItem('authenticated', 'true');
    sessionStorage.setItem('wallet_address', address);
    sessionStorage.setItem('wallet_encrypted', base64);
}

/**
 * sessionStorageから復号化してニーモニックを取得
 */
export async function decryptSessionMnemonic(): Promise<string | null> {
    try {
        const encrypted = sessionStorage.getItem('wallet_encrypted');
        if (!encrypted || !sessionEncryptionKey) {
            return null;
        }

        // Base64デコード
        const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
        const iv = combined.slice(0, 12);
        const ciphertext = combined.slice(12);

        // 復号化
        const decryptedData = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            sessionEncryptionKey,
            ciphertext
        );

        return decoder.decode(decryptedData);
    } catch (error) {
        console.error('Failed to decrypt session mnemonic');
        return null;
    }
}

/**
 * セッション情報をクリア
 */
export function clearSessionWallet(): void {
    sessionStorage.removeItem('authenticated');
    sessionStorage.removeItem('wallet_address');
    sessionStorage.removeItem('wallet_encrypted');
    sessionStorage.removeItem('wallet_mnemonic'); // 旧形式も削除
    sessionEncryptionKey = null; // メモリからもキーを削除
}

/**
 * セッションが有効かチェック
 */
export function isSessionValid(): boolean {
    return !!(
        sessionStorage.getItem('authenticated') &&
        sessionStorage.getItem('wallet_address') &&
        sessionStorage.getItem('wallet_encrypted') &&
        sessionEncryptionKey
    );
}

/**
 * PIN管理ロジック
 * - PINのハッシュ化・検証
 * - 失敗回数管理
 * - ロック機能
 */

interface LockState {
  failedAttempts: number;
  lockedUntil: number | null;
}

const LOCK_STATE_KEY = 'pin_lock_state';

/**
 * PINをハッシュ化
 * 注意: ブラウザ環境なのでbcryptの代わりにPBKDF2を使用
 */
export async function hashPIN(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  
  // PBKDF2でハッシュ化（100,000回反復）
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    'raw',
    data,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    key,
    256
  );
  
  // saltとハッシュを結合して保存
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${saltHex}:${hashHex}`;
}

/**
 * PINを検証
 */
export async function verifyPIN(pin: string, storedHash: string): Promise<boolean> {
  try {
    const [saltHex, expectedHashHex] = storedHash.split(':');
    
    // saltを復元
    const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
    
    // 入力されたPINをハッシュ化
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    
    const key = await crypto.subtle.importKey(
      'raw',
      data,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      key,
      256
    );
    
    const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex === expectedHashHex;
  } catch (error) {
    console.error('PIN verification error:', error);
    return false;
  }
}

/**
 * ロック状態を取得
 */
function getLockState(): LockState {
  const stored = localStorage.getItem(LOCK_STATE_KEY);
  if (!stored) {
    return { failedAttempts: 0, lockedUntil: null };
  }
  return JSON.parse(stored);
}

/**
 * ロック状態を保存
 */
function saveLockState(state: LockState): void {
  localStorage.setItem(LOCK_STATE_KEY, JSON.stringify(state));
}

/**
 * ロック中かどうか確認
 */
export function isLocked(): { locked: boolean; remainingSeconds: number } {
  const state = getLockState();
  
  if (!state.lockedUntil) {
    return { locked: false, remainingSeconds: 0 };
  }
  
  const now = Date.now();
  if (now >= state.lockedUntil) {
    // ロック期限切れ
    saveLockState({ failedAttempts: 0, lockedUntil: null });
    return { locked: false, remainingSeconds: 0 };
  }
  
  const remainingMs = state.lockedUntil - now;
  return { locked: true, remainingSeconds: Math.ceil(remainingMs / 1000) };
}

/**
 * 失敗を記録
 */
export function recordFailedAttempt(): LockState {
  const state = getLockState();
  state.failedAttempts += 1;
  
  // ロック時間を計算
  let lockDuration = 0;
  if (state.failedAttempts >= 9) {
    lockDuration = 30 * 60 * 1000; // 30分
  } else if (state.failedAttempts >= 6) {
    lockDuration = 5 * 60 * 1000; // 5分
  } else if (state.failedAttempts >= 3) {
    lockDuration = 30 * 1000; // 30秒
  }
  
  if (lockDuration > 0) {
    state.lockedUntil = Date.now() + lockDuration;
  }
  
  saveLockState(state);
  return state;
}

/**
 * 失敗回数をリセット
 */
export function resetFailedAttempts(): void {
  saveLockState({ failedAttempts: 0, lockedUntil: null });
}

/**
 * 現在の失敗回数を取得
 */
export function getFailedAttempts(): number {
  return getLockState().failedAttempts;
}

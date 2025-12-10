'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PINInput from '@/components/PINInput';
import { getPINHash, loadWallet } from '@/lib/keystore/storage';
import { verifyPIN, isLocked, recordFailedAttempt, resetFailedAttempts, getFailedAttempts } from '@/lib/keystore/pin';
import { encryptAndStoreSession } from '@/lib/crypto/session-crypto';

export default function PINLockPage() {
  const router = useRouter();

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [locked, setLocked] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  // ロック状態を定期的にチェック
  useEffect(() => {
    checkLockStatus();
    const interval = setInterval(checkLockStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  // 失敗回数を取得
  useEffect(() => {
    setFailedCount(getFailedAttempts());
  }, []);

  const checkLockStatus = () => {
    const lockStatus = isLocked();
    setLocked(lockStatus.locked);
    setRemainingSeconds(lockStatus.remainingSeconds);
  };

  // PIN入力完了
  const handlePINComplete = async (inputPin: string) => {
    if (locked) return;

    setIsVerifying(true);
    setError('');

    try {
      // PINハッシュを取得
      const storedHash = await getPINHash();
      if (!storedHash) {
        setError('ウォレットが見つかりません');
        setIsVerifying(false);
        return;
      }

      // PIN検証
      const isValid = await verifyPIN(inputPin, storedHash);

      if (isValid) {
        // 成功 - ウォレットを読み込んで認証状態をセット
        const wallet = await loadWallet(inputPin);
        if (wallet) {
          resetFailedAttempts();

          // ✅ ランダムキーで暗号化してsessionStorageに保存
          await encryptAndStoreSession(wallet.address, wallet.mnemonic);

          router.push('/wallet');
        } else {
          setError('ウォレットの読み込みに失敗しました');
          setPin('');
          setIsVerifying(false);
        }
      } else {
        // 失敗
        const state = recordFailedAttempt();
        setFailedCount(state.failedAttempts);

        if (state.lockedUntil) {
          setError('PINが間違っています。ロックされました。');
          checkLockStatus();
        } else {
          setError('PINが間違っています');
        }

        setPin('');
        setIsVerifying(false);
      }
    } catch (error) {
      console.error('PIN verification error:', error);
      setError('エラーが発生しました');
      setPin('');
      setIsVerifying(false);
    }
  };

  // ウォレット復元へ
  const handleRestore = () => {
    router.push('/setup?mode=restore');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">

        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-5xl text-red-500">
              {locked ? 'lock_clock' : 'lock'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {locked ? 'ロック中' : 'PainAme P2P'}
          </h1>
          <p className="text-gray-600 text-sm">
            {locked
              ? `${Math.floor(remainingSeconds / 60)}分${remainingSeconds % 60}秒後に再試行できます`
              : 'PINを入力してください'
            }
          </p>
        </div>

        {/* ロック中の表示 */}
        {locked && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6 text-center">
            <span className="material-symbols-outlined text-6xl text-red-500 mb-3">timer</span>
            <p className="text-2xl font-bold text-red-600 mb-1">
              {Math.floor(remainingSeconds / 60)}:{(remainingSeconds % 60).toString().padStart(2, '0')}
            </p>
            <p className="text-sm text-red-600">
              PINを{failedCount}回間違えました
            </p>
          </div>
        )}

        {/* PIN入力 */}
        {!locked && (
          <div className="mb-6">
            <PINInput
              value={pin}
              onChange={setPin}
              onComplete={handlePINComplete}
              error={!!error}
              disabled={isVerifying || locked}
            />
          </div>
        )}

        {/* 検証中 */}
        {isVerifying && (
          <div className="text-center mb-6">
            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">確認中...</p>
          </div>
        )}

        {/* エラーメッセージ */}
        {error && !locked && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-red-600 text-center">{error}</p>
            {failedCount > 0 && (
              <p className="text-xs text-red-500 text-center mt-2">
                失敗回数: {failedCount}/3回
              </p>
            )}
          </div>
        )}

        {/* ウォレット復元ボタン */}
        <button
          onClick={handleRestore}
          className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm"
        >
          ウォレットを復元
        </button>

        {/* 注意事項 */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            PINを忘れた場合は、リカバリーフレーズから復元してください
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PINInput from '@/components/PINInput';
import { saveWallet } from '@/lib/keystore/storage';
import { encryptAndStoreSession } from '@/lib/crypto/session-crypto';

export default function PINSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<'first' | 'confirm'>('first');
  const [firstPIN, setFirstPIN] = useState('');
  const [confirmPIN, setConfirmPIN] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // URLパラメータからウォレット情報を取得
  const address = searchParams.get('address');
  const mnemonic = searchParams.get('mnemonic');

  useEffect(() => {
    // ウォレット情報がない場合はセットアップ画面に戻す
    if (!address || !mnemonic) {
      router.push('/setup');
    }
  }, [address, mnemonic, router]);

  // 1回目のPIN入力完了
  const handleFirstPINComplete = (pin: string) => {
    setFirstPIN(pin);
    setStep('confirm');
    setError('');
  };

  // 2回目のPIN入力完了
  const handleConfirmPINComplete = async (pin: string) => {
    setConfirmPIN(pin);

    if (pin !== firstPIN) {
      setError('PINが一致しません');
      setConfirmPIN('');
      return;
    }

    // ウォレットを保存
    await handleSave(pin);
  };

  // ウォレット保存
  const handleSave = async (pin: string) => {
    if (!address || !mnemonic) return;

    setIsSaving(true);
    setError('');

    try {
      await saveWallet(address, mnemonic, pin);

      // 成功したらウォレット画面へ
      // ✅ ランダムキーで暗号化してsessionStorageに保存
      await encryptAndStoreSession(address, mnemonic);

      router.push('/wallet');
    } catch (error: any) {
      console.error('Failed to save wallet:', error);
      setError('ウォレットの保存に失敗しました');
      setIsSaving(false);
    }
  };

  // やり直し
  const handleReset = () => {
    setStep('first');
    setFirstPIN('');
    setConfirmPIN('');
    setError('');
  };

  if (!address || !mnemonic) {
    return null; // リダイレクト待ち
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">

        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-5xl text-red-500">lock</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            ウォレットを保護
          </h1>
          <p className="text-gray-600 text-sm">
            {step === 'first'
              ? '4桁のPINを設定してください'
              : 'もう一度入力してください'
            }
          </p>
        </div>

        {/* PIN入力 */}
        <div className="mb-8">
          <PINInput
            value={step === 'first' ? firstPIN : confirmPIN}
            onChange={step === 'first' ? setFirstPIN : setConfirmPIN}
            onComplete={step === 'first' ? handleFirstPINComplete : handleConfirmPINComplete}
            error={!!error}
            disabled={isSaving}
          />
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-red-600 text-center">{error}</p>
            <button
              onClick={handleReset}
              className="w-full mt-3 text-sm text-red-500 hover:text-red-600 font-medium"
            >
              やり直す
            </button>
          </div>
        )}

        {/* 保存中 */}
        {isSaving && (
          <div className="text-center mb-6">
            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">保存中...</p>
          </div>
        )}

        {/* 注意事項 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex gap-3">
            <span className="material-symbols-outlined text-yellow-600 flex-shrink-0">warning</span>
            <div>
              <p className="text-sm text-yellow-800 font-medium mb-1">重要な注意</p>
              <p className="text-xs text-yellow-700">
                このPINを忘れるとウォレットにアクセスできなくなります。
                リカバリーフレーズがあれば復元可能です。
              </p>
            </div>
          </div>
        </div>

        {/* 進捗表示 */}
        {step === 'confirm' && (
          <div className="mt-6 flex justify-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  );
}

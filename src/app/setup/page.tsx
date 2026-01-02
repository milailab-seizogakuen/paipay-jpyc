'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateNewWallet, restoreWalletFromMnemonic } from '@/lib/keystore/generate';
import { saveWallet } from '@/lib/keystore/storage';
import QRScanner from '@/components/QRScanner';

export default function SetupPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'select' | 'create' | 'restore'>('select');
  const [step, setStep] = useState<'input' | 'backup' | 'complete'>('input');
  const [wallet, setWallet] = useState<{
    mnemonic: string;
    address: string;
    secretKey: string;
  } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [mnemonicInput, setMnemonicInput] = useState('');
  const [restoreError, setRestoreError] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  // QRスキャン結果を受け取る
  const handleQRScan = (scannedText: string) => {
    setMnemonicInput(scannedText);
    setShowScanner(false);
    setRestoreError('');
  };

  // ウォレット生成
  const handleCreateWallet = async () => {
    setIsCreating(true);
    try {
      const newWallet = generateNewWallet();
      setWallet({
        mnemonic: newWallet.mnemonic,
        address: newWallet.address,
        secretKey: newWallet.secretKey,
      });
      setMode('create');
      setStep('backup');
    } catch (error) {
      console.error('Wallet creation failed:', error);
      alert('ウォレット作成に失敗しました');
    } finally {
      setIsCreating(false);
    }
  };

  // ウォレット復元
  const handleRestoreWallet = async () => {
    setRestoreError('');
    setIsCreating(true);

    try {
      // 入力をトリム・正規化
      const trimmedMnemonic = mnemonicInput.trim().replace(/\s+/g, ' ');

      // 12単語かチェック
      const words = trimmedMnemonic.split(' ');
      if (words.length !== 12) {
        throw new Error('リカバリーフレーズは12単語である必要があります');
      }

      const restoredWallet = restoreWalletFromMnemonic(trimmedMnemonic);
      setWallet({
        mnemonic: restoredWallet.mnemonic,
        address: restoredWallet.address,
        secretKey: restoredWallet.secretKey,
      });

      // PIN設定画面へリダイレクト
      router.push(`/pin-setup?address=${encodeURIComponent(restoredWallet.address)}&mnemonic=${encodeURIComponent(restoredWallet.mnemonic)}`);

    } catch (error: any) {
      console.error('Wallet restoration failed:', error);
      setRestoreError(error.message || 'ウォレット復元に失敗しました');
    } finally {
      setIsCreating(false);
    }
  };

  // バックアップ確認後、PIN設定へ
  const handleConfirmBackup = () => {
    if (!wallet) return;
    // PIN設定画面へリダイレクト
    router.push(`/pin-setup?address=${encodeURIComponent(wallet.address)}&mnemonic=${encodeURIComponent(wallet.mnemonic)}`);
  };

  // ウォレット画面へ
  const handleGoToWallet = () => {
    router.push('/wallet');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-yellow-50">
      <div className="max-w-md w-full">

        {/* モード選択 */}
        {mode === 'select' && (
          <div className="bg-white rounded-3xl p-8 shadow-xl">
            <img
              src="https://i.imgur.com/ruz4D3L.png"
              alt="PaiPay Logo"
              className="h-12 w-auto mx-auto mb-6 drop-shadow-lg"
            />
            <h1 className="text-3xl font-bold mb-4 text-center text-gray-800">
              ウォレット設定
            </h1>
            <p className="text-gray-600 mb-8 text-center">
              新しいウォレットを作成するか、<br />
              既存のウォレットを復元してください
            </p>

            <div className="space-y-4">
              <button
                onClick={handleCreateWallet}
                disabled={isCreating}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4 rounded-xl font-bold hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isCreating ? (
                  <>
                    <div className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    作成中...
                  </>
                ) : (
                  '新しいウォレットを作成'
                )}
              </button>

              <button
                onClick={() => setMode('restore')}
                className="w-full bg-white border-2 border-gray-300 text-gray-700 px-6 py-4 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                既存のウォレットを復元
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-xl">
              <p className="text-xs text-blue-800">
                💡 復元には12個の単語（リカバリーフレーズ）が必要です
              </p>
            </div>
          </div>
        )}

        {/* ウォレット復元画面 */}
        {mode === 'restore' && step === 'input' && (
          <div className="bg-white rounded-3xl p-8 shadow-xl">
            <button
              onClick={() => setMode('select')}
              className="mb-4 text-gray-600 hover:text-gray-800 flex items-center gap-2"
            >
              ← 戻る
            </button>

            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
              ウォレット復元
            </h2>
            <p className="text-gray-600 mb-6 text-center text-sm">
              12個の単語を入力してください
            </p>

            {/* QRコードで入力ボタン */}
            <button
              onClick={() => setShowScanner(true)}
              className="w-full mb-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <span className="text-xl">📷</span>
              QRコードで入力
            </button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">または手入力</span>
              </div>
            </div>

            <div className="mb-6">
              <textarea
                value={mnemonicInput}
                onChange={(e) => {
                  setMnemonicInput(e.target.value);
                  setRestoreError('');
                }}
                placeholder="fiscal usual weasel flag ... attitude noise"
                className="w-full h-32 p-4 border-2 border-gray-300 rounded-xl resize-none focus:border-red-500 focus:outline-none font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">
                12個の単語をスペース区切りで入力してください
              </p>
            </div>

            {restoreError && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-800">❌ {restoreError}</p>
              </div>
            )}

            <button
              onClick={handleRestoreWallet}
              disabled={isCreating || !mnemonicInput.trim()}
              className="w-full bg-red-500 text-white px-6 py-4 rounded-xl font-bold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <>
                  <div className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  復元中...
                </>
              ) : (
                'ウォレットを復元'
              )}
            </button>

            <div className="mt-6 p-4 bg-red-50 rounded-xl">
              <p className="text-xs text-red-800">
                ⚠️ リカバリーフレーズは他人に教えないでください
              </p>
            </div>

            {/* QRスキャナーモーダル */}
            {showScanner && (
              <QRScanner
                onScan={handleQRScan}
                onClose={() => setShowScanner(false)}
              />
            )}
          </div>
        )}

        {/* Step 2: バックアップ確認（新規作成時のみ） */}
        {mode === 'create' && step === 'backup' && wallet && (
          <div className="bg-white rounded-3xl p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
              リカバリーフレーズ
            </h2>
            <p className="text-gray-600 mb-6 text-center text-sm">
              この12個の単語を安全な場所にメモしてください
            </p>

            {/* ニーモニックフレーズ表示 */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-3 gap-3">
                {wallet.mnemonic.split(' ').map((word, index) => (
                  <div
                    key={index}
                    className="bg-white p-3 rounded-lg border border-gray-200"
                  >
                    <span className="text-xs text-gray-400">{index + 1}.</span>
                    <p className="text-sm font-bold text-gray-800">{word}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 警告 */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div className="text-sm text-red-800">
                  <p className="font-bold mb-1">絶対に他人に教えないでください！</p>
                  <p className="text-xs">
                    この12単語があれば、誰でもあなたのウォレットにアクセスできます。
                  </p>
                </div>
              </div>
            </div>

            {/* アドレス表示 */}
            <div className="mb-6">
              <p className="text-xs text-gray-500 mb-2">あなたのウォレットアドレス:</p>
              <div className="bg-gray-100 p-3 rounded-lg">
                <p className="text-xs font-mono break-all text-gray-700">
                  {wallet.address}
                </p>
              </div>
            </div>

            <button
              onClick={handleConfirmBackup}
              className="w-full bg-red-500 text-white px-6 py-4 rounded-xl font-bold hover:bg-red-600 transition-colors"
            >
              メモしました、次へ
            </button>
          </div>
        )}


      </div>
    </div>
  );
}

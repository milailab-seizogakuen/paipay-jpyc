'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadWallet } from '@/lib/keystore/storage';
import { getMaticBalance, getTransactionHistory } from '@/lib/polygon/client';
import { getJpycBalance, sendJpyc } from '@/lib/polygon/jpyc';
import QRScanner from '@/components/QRScannerWrapper';
import { decryptSessionMnemonic, isSessionValid } from '@/lib/crypto/session-crypto';

interface SendResult {
  success: boolean;
  txHash?: string;
  error?: string;
  explorerUrl?: string;
}

export default function SendPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState<{ address: string; secretKey: Uint8Array; mnemonic?: string } | null>(null);
  const [balance, setBalance] = useState<{ pol: number; jpyc: number } | null>(null);

  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');

  const [showConfirm, setShowConfirm] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);

  // ウォレット読み込み
  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      // 認証チェック
      const authenticated = sessionStorage.getItem('authenticated');
      const address = sessionStorage.getItem('wallet_address');

      if (!authenticated || !address) {
        router.push('/pin-lock');
        return;
      }

      // ✅ セッションの有効性チェック
      if (!isSessionValid()) {
        router.push('/pin-lock');
        return;
      }

      // ✅ 暗号化されたニーモニックを復号化
      const mnemonic = await decryptSessionMnemonic();

      if (!mnemonic) {
        console.warn('Failed to decrypt mnemonic');
        setWallet({
          address,
          secretKey: new Uint8Array(),
          mnemonic: undefined,
        });
      } else {
        setWallet({
          address,
          secretKey: new Uint8Array(),
          mnemonic,
        });
      }

      const jpycBalance = await getJpycBalance(address);
      const polBalance = await getMaticBalance(address);
      setBalance({ jpyc: jpycBalance, pol: polBalance });
    } catch (error) {
      console.error('Failed to load wallet:', error);
    }
  };

  // 確認画面を表示
  const handleShowConfirm = () => {
    // バリデーション
    if (!toAddress || !amount) {
      alert('送金先アドレスと金額を入力してください');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('有効な金額を入力してください');
      return;
    }

    if (!balance || amountNum > balance.jpyc) {
      alert('JPYC残高が不足しています');
      return;
    }

    // ✅ POL（ガス代）残高チェック
    if (balance.pol < 0.001) {
      alert(
        `ガス代（POL）が不足しています\n\n` +
        `現在の残高: ${balance.pol.toFixed(6)} POL\n` +
        `推奨残高: 0.001 POL以上\n\n` +
        `POLを入手してから再度お試しください。`
      );
      return;
    }

    if (!toAddress.startsWith('0x') || toAddress.length !== 42) {
      alert('有効なEthereumアドレスを入力してください（0xで始まる42文字）');
      return;
    }

    setShowConfirm(true);
  };

  // 送金実行（クライアント側署名）
  const handleSend = async () => {
    if (!wallet || !wallet.mnemonic) return;

    setIsSending(true);
    setResult(null);

    try {
      // JPYC送金を実行
      const result = await sendJpyc({
        mnemonic: wallet.mnemonic,
        toAddress,
        amount: parseFloat(amount),
      });

      if (!result.success) {
        throw new Error(result.error || 'トランザクション送信に失敗しました');
      }

      console.log('✅ 送金成功:', result.txHash);

      setResult({
        success: true,
        txHash: result.txHash,
        explorerUrl: result.explorerUrl,
      });

      // 成功時、5秒後にウォレットに戻る
      setTimeout(() => {
        router.push('/wallet');
      }, 5000);
    } catch (error: any) {
      console.error('❌ Send error:', error);
      setResult({
        success: false,
        error: error.message || 'トランザクション送信に失敗しました',
      });
    } finally {
      setIsSending(false);
    }
  };

  // キャンセル
  const handleCancel = () => {
    setShowConfirm(false);
  };

  // ローディング
  if (!wallet || !balance) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* QRスキャナーモーダル */}
      {showQRScanner && (
        <QRScanner
          onScan={(address) => {
            setToAddress(address);
            setShowQRScanner(false);
          }}
          onClose={() => setShowQRScanner(false)}
        />
      )}

      <div className="max-w-md mx-auto px-4 py-6">

        {/* ヘッダー */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/wallet')}
            className="text-gray-700 hover:text-gray-900 transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-800">P2P送金</h1>
        </div>

        {/* POL残高不足の警告 */}
        {balance && balance.pol < 0.001 && (
          <div className="rounded-2xl p-4 mb-6 bg-yellow-50 border border-yellow-200">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-yellow-600 text-2xl">warning</span>
              <div className="flex-1">
                <h3 className="font-bold text-yellow-800 mb-1">ガス代（POL）が不足しています</h3>
                <p className="text-sm text-yellow-700">
                  現在の残高: {balance.pol.toFixed(6)} POL<br />
                  推奨残高: 0.001 POL以上<br />
                  <span className="text-xs">POLを入手してから送金してください。</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 結果表示 */}
        {result && (
          <div className={`rounded-2xl p-6 mb-6 text-center ${result.success
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
            }`}>
            {result.success ? (
              <>
                <div className="text-5xl mb-4">✅</div>
                <h2 className="text-xl font-bold text-green-600 mb-4">送金完了！</h2>
                <div className="space-y-2 text-sm text-green-800">
                  <p><strong>金額:</strong> {amount} JPYC</p>
                  <p><strong>送金先:</strong> {toAddress.slice(0, 10)}...{toAddress.slice(-8)}</p>
                </div>
                <a
                  href={result.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                >
                  Explorerで確認
                </a>
                <p className="text-xs text-green-600 mt-4">5秒後にウォレットに戻ります</p>
              </>
            ) : (
              <>
                <div className="text-5xl mb-4">❌</div>
                <h2 className="text-xl font-bold text-red-600 mb-4">送金エラー</h2>
                <p className="text-sm text-red-700 mb-4">{result.error}</p>
                <button
                  onClick={() => setResult(null)}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                >
                  戻る
                </button>
              </>
            )}
          </div>
        )}

        {/* 確認モーダル */}
        {showConfirm && !result && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
              <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">送金確認</h2>

              <div className="space-y-3 mb-6">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">送金先</p>
                  <p className="text-sm font-mono break-all text-gray-800">
                    {toAddress}
                  </p>
                </div>

                <div className="bg-red-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">金額</p>
                  <p className="text-2xl font-bold text-red-600">
                    {amount} <span className="text-sm">JPYC</span>
                  </p>
                </div>

                {memo && (
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">メモ</p>
                    <p className="text-sm text-gray-800">{memo}</p>
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-6">
                <p className="text-xs text-yellow-800">
                  ⚠️ この操作は取り消せません。送金先アドレスを必ず確認してください。
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleCancel}
                  disabled={isSending}
                  className="bg-gray-100 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSend}
                  disabled={isSending}
                  className="bg-red-500 text-white px-4 py-3 rounded-xl hover:bg-red-600 transition-colors font-medium disabled:opacity-50"
                >
                  {isSending ? '送金中...' : '送金する'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 入力フォーム */}
        {!showConfirm && !result && (
          <>
            {/* 残高表示 */}
            <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
              <p className="text-sm text-gray-500 mb-2">利用可能残高</p>
              <p className="text-3xl font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {balance.jpyc.toLocaleString()} <span className="text-lg text-gray-500">JPYC</span>
              </p>
            </div>

            {/* 送金先入力 */}
            <div className="bg-white rounded-2xl p-6 mb-4 shadow-lg">
              <label className="block text-sm font-bold text-gray-700 mb-3">
                送金先アドレス
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                  placeholder="0x..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono text-sm"
                />
                <button
                  onClick={() => setShowQRScanner(true)}
                  className="bg-red-500 text-white px-4 py-3 rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center min-w-[60px]"
                  title="QRコードをスキャン"
                >
                  <span className="material-symbols-outlined">qr_code_scanner</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Ethereumアドレス（0xで始まる42文字）を入力するかQRコードをスキャンしてください
              </p>
            </div>

            {/* 金額入力 */}
            <div className="bg-white rounded-2xl p-6 mb-4 shadow-lg">
              <label className="block text-sm font-bold text-gray-700 mb-3">
                送金額
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.000001"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-lg"
                />
                <div className="absolute right-4 top-3 text-gray-500 text-sm">
                  JPYC
                </div>
              </div>
              <button
                onClick={() => setAmount(balance.jpyc.toString())}
                className="mt-2 text-xs text-red-500 hover:text-red-600 font-medium"
              >
                最大額を入力
              </button>
            </div>

            {/* メモ入力 */}
            <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
              <label className="block text-sm font-bold text-gray-700 mb-3">
                メモ（任意）
              </label>
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="例: お礼、ランチ代"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {/* 送金ボタン */}
            <button
              onClick={handleShowConfirm}
              disabled={!toAddress || !amount || !balance || balance.pol < 0.001}
              className="w-full bg-red-500 text-white px-6 py-4 rounded-xl font-bold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              確認画面へ
            </button>
          </>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { getPINHash } from '@/lib/keystore/storage';
import { getMaticBalance, getTransactionHistory } from '@/lib/polygon/client';
import { getJpycBalance } from '@/lib/polygon/jpyc';
import { useRouter } from 'next/navigation';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import { isSessionValid } from '@/lib/crypto/session-crypto';

export default function WalletPage() {
  const router = useRouter();
  const [address, setAddress] = useState<string>('');
  const [balance, setBalance] = useState<{ pol: number; jpyc: number } | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ウォレット読み込み
  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setIsLoading(true);

      // 認証チェック
      const authenticated = sessionStorage.getItem('authenticated');
      if (!authenticated || !isSessionValid()) {
        // 未認証またはセッション無効の場合、ウォレットの存在確認
        const pinHash = await getPINHash();
        if (pinHash) {
          // ウォレットは存在するがPIN未入力
          router.push('/pin-lock');
          return;
        } else {
          // ウォレットが存在しない
          router.push('/setup');
          return;
        }
      }

      // sessionStorageからアドレスを取得（PIN入力時に保存されている想定）
      const storedAddress = sessionStorage.getItem('wallet_address');
      if (!storedAddress) {
        // アドレスがない場合は再認証
        sessionStorage.removeItem('authenticated');
        router.push('/pin-lock');
        return;
      }

      setAddress(storedAddress);

      // 残高を取得
      const jpycBalance = await getJpycBalance(storedAddress);
      const polBalance = await getMaticBalance(storedAddress);
      setBalance({ jpyc: jpycBalance, pol: polBalance });

      // 履歴を取得
      console.log('📜 Fetching transaction history for:', storedAddress);
      const txHistory = await getTransactionHistory(storedAddress, 5);
      console.log('📜 Transaction history:', txHistory);
      setHistory(txHistory);
    } catch (error) {
      console.error('Failed to load wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 手動更新
  const handleRefresh = async () => {
    if (!address) return;

    setIsRefreshing(true);
    try {
      const jpycBalance = await getJpycBalance(address);
      const polBalance = await getMaticBalance(address);
      setBalance({ jpyc: jpycBalance, pol: polBalance });

      const txHistory = await getTransactionHistory(address, 5);
      setHistory(txHistory);
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // ローディング画面
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">ウォレット読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!address || !balance) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-6">

        {/* メインカード */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-3xl p-6 mb-6 text-white shadow-xl relative overflow-hidden">
          {/* ロゴエリア */}
          <div className="flex justify-between items-start mb-6">
            <img
              src="https://i.imgur.com/ruz4D3L.png"
              alt="PaiPay Logo"
              className="h-10 w-auto drop-shadow-lg"
            />
            <button
              onClick={() => router.push('/')}
              className="text-white/80 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-xl">home</span>
            </button>
          </div>

          {/* タイトル */}
          <h1 className="text-2xl font-bold mb-6">My Wallet</h1>

          {/* QRコードエリア */}
          <div className="flex justify-center mb-6">
            <div className="bg-white rounded-2xl p-4 shadow-lg">
              <QRCodeDisplay value={address} size={140} />
            </div>
          </div>

          <p className="text-center text-white/80 text-sm">
            受取用QRコード
          </p>

          {/* デコレーションサークル */}
          <div className="absolute top-4 right-20 w-16 h-16 bg-yellow-400 rounded-full opacity-80"></div>
          <div className="absolute top-20 right-4 w-8 h-8 bg-yellow-300 rounded-full opacity-60"></div>
          <div className="absolute bottom-10 left-4 w-12 h-12 bg-yellow-400 rounded-full opacity-50"></div>
        </div>


        {/* 残高カード */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-600 text-lg">トークン残高</p>
            <div className="bg-red-100 p-2 rounded-full">
              <span className="material-symbols-outlined text-red-600">
                account_balance_wallet
              </span>
            </div>
          </div>
          <p className="text-black text-4xl font-black mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {balance.jpyc.toLocaleString()}
          </p>
          <p className="text-gray-500 text-sm mb-6">JPYC</p>

          <div className="border-t border-gray-100 pt-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-gray-600 text-sm">ガス残高</p>
              <div className="bg-yellow-100 p-1 rounded-full">
                <span className="material-symbols-outlined text-yellow-600 text-sm">
                  local_gas_station
                </span>
              </div>
            </div>
            <p className="text-black text-xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {balance.pol.toFixed(3)} POL
            </p>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => router.push('/send')}
            className="bg-red-500 text-white px-6 py-4 rounded-xl hover:bg-red-600 transition-colors shadow-lg font-medium flex flex-col items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-2xl">send</span>
            送金
          </button>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-gray-100 text-gray-700 px-6 py-4 rounded-xl hover:bg-gray-200 transition-colors shadow-lg font-medium flex flex-col items-center justify-center gap-2 disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-2xl ${isRefreshing ? 'animate-spin' : ''}`}>
              {isRefreshing ? 'sync' : 'refresh'}
            </span>
            {isRefreshing ? '更新中' : '更新'}
          </button>
        </div>

        {/* アドレス表示 */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
          <h3 className="text-sm font-bold text-gray-700 mb-3">ウォレットアドレス</h3>
          <div className="bg-gray-50 p-3 rounded-xl">
            <p className="text-xs font-mono break-all text-gray-600">
              {address}
            </p>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(address);
              alert('アドレスをコピーしました！');
            }}
            className="mt-3 w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            📋 コピー
          </button>
        </div>

        {/* 重要な警告メッセージ */}
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-5 mb-6 shadow-lg">
          <div className="flex items-start gap-3 mb-3">
            <span className="material-symbols-outlined text-3xl text-yellow-600 flex-shrink-0">warning</span>
            <div>
              <h3 className="text-base font-bold text-yellow-800 mb-2">重要な注意</h3>
              <p className="text-sm text-yellow-700 mb-3">
                ブラウザのキャッシュや履歴を削除すると、ウォレットデータが消えます。
              </p>
              <p className="text-sm text-yellow-700 font-semibold">
                必ずリカバリーフレーズを安全な場所に保存してください。
              </p>
            </div>
          </div>
        </div>

        {/* 取引履歴 */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-lg font-bold text-gray-800 mb-4">最近の取引</h2>

          {history.length === 0 ? (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">receipt_long</span>
              <p className="text-gray-500 text-sm">取引履歴がありません</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((tx) => (
                <div key={tx.txHash} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${tx.type === 'sent'
                      ? 'bg-red-100'
                      : 'bg-green-100'
                      }`}>
                      <span className={`material-symbols-outlined text-sm ${tx.type === 'sent'
                        ? 'text-red-600'
                        : 'text-green-600'
                        }`}>
                        {tx.type === 'sent' ? 'arrow_upward' : 'arrow_downward'}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-800 font-medium text-sm">
                        {tx.type === 'sent' ? '支払い' : '受け取り'}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {new Date(tx.timestamp).toLocaleString('ja-JP', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <a
                    href={tx.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs hover:bg-blue-600 transition-colors font-medium flex items-center gap-1"
                  >
                    詳細
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

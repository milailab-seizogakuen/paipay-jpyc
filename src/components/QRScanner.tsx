'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onScan: (address: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [cameraId, setCameraId] = useState<string | null>(null);

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    try {
      setError('');
      
      // カメラデバイスを取得
      const devices = await Html5Qrcode.getCameras();
      
      if (!devices || devices.length === 0) {
        setError('カメラが見つかりません');
        return;
      }

      // 背面カメラを優先的に選択
      const backCamera = devices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear')
      );
      const selectedCamera = backCamera || devices[0];
      
      setCameraId(selectedCamera.id);
      
      // スキャナーを初期化
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      // カメラを起動
      await scanner.start(
        selectedCamera.id,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // QRコード読み取り成功
          console.log('✅ QRコード読み取り成功:', decodedText);
          onScan(decodedText);
          stopScanner();
        },
        (errorMessage) => {
          // エラーは無視（スキャン中は常にエラーが出るため）
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error('❌ カメラ起動エラー:', err);
      setError(`カメラの起動に失敗しました: ${err.message}`);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (error) {
        console.error('Scanner stop error:', error);
      }
    }
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">QRコードをスキャン</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={startScanner}
              className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              再試行
            </button>
          </div>
        )}

        {isScanning && !error && (
          <p className="text-sm text-gray-600 mb-4 text-center">
            📷 カメラを相手のQRコードに向けてください
          </p>
        )}

        {!isScanning && !error && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <p className="text-sm text-blue-800">カメラを起動中...</p>
          </div>
        )}

        {/* スキャナー表示エリア */}
        <div id="qr-reader" className="rounded-xl overflow-hidden bg-black"></div>

        <button
          onClick={handleClose}
          className="mt-4 w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}

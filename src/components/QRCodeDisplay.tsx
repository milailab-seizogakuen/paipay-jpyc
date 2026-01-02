import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
}

export default function QRCodeDisplay({ value, size = 200 }: QRCodeDisplayProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generateQR = async () => {
      try {
        setIsLoading(true);
        const url = await QRCode.toDataURL(value, {
          width: size,
          margin: 2,
          color: {
            dark: '#DC2626', // 赤色
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M'
        });
        setQrCodeUrl(url);
      } catch (error) {
        console.error('QR Code generation failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (value) {
      generateQR();
    }
  }, [value, size]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!qrCodeUrl) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 text-center">
        <p className="text-sm text-gray-500">QRコード生成エラー</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <img 
        src={qrCodeUrl} 
        alt="Wallet QR Code" 
        className="mx-auto rounded-lg shadow-sm"
        width={size}
        height={size}
      />
    </div>
  );
}

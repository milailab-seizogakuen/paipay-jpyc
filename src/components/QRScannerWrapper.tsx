'use client';
import dynamic from 'next/dynamic';

const QRScanner = dynamic(() => import('./QRScanner'), { ssr: false });

export default QRScanner;

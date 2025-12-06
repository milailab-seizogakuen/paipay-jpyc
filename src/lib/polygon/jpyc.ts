/**
 * JPYC ERC20コントラクト操作
 * Polygon Mainnet上のJPYCトークンとの通信
 */

import { ethers } from 'ethers';
import { polygonProvider } from './client';

// JPYC設定
const JPYC_ADDRESS = process.env.NEXT_PUBLIC_JPYC_ADDRESS || '0xE7C3D8C9a439feDe00D2600032D5dB0Be71C3c29';
const JPYC_DECIMALS = 18;

/**
 * ERC20 ABI（最小限）
 */
const ERC20_ABI = [
    'function transfer(address to, uint256 amount) returns (bool)',
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
];

/**
 * JPYC コントラクトインスタンス（読み取り専用）
 */
export const jpycContract = new ethers.Contract(
    JPYC_ADDRESS,
    ERC20_ABI,
    polygonProvider
);

/**
 * JPYC残高を取得
 * @param address - Ethereumアドレス
 * @returns JPYC残高（数値）
 */
export async function getJpycBalance(address: string): Promise<number> {
    try {
        const balance = await jpycContract.balanceOf(address);
        return Number(ethers.formatUnits(balance, JPYC_DECIMALS));
    } catch (error) {
        console.error('Failed to get JPYC balance:', error);
        throw error;
    }
}

/**
 * JPYC送金パラメータ
 */
export interface SendJpycParams {
    mnemonic: string;
    toAddress: string;
    amount: number;
}

/**
 * JPYC送金結果
 */
export interface SendJpycResult {
    success: boolean;
    txHash?: string;
    error?: string;
    explorerUrl?: string;
}

/**
 * JPYC送金（クライアント側署名）
 * @param params - 送金パラメータ
 * @returns 送金結果
 */
export async function sendJpyc(params: SendJpycParams): Promise<SendJpycResult> {
    const { mnemonic, toAddress, amount } = params;

    try {
        // ニーモニックからウォレットを復元
        const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic).connect(polygonProvider);
        const fromAddress = wallet.address;

        console.log('📤 JPYC送金開始:', {
            from: fromAddress,
            to: toAddress,
            amount,
        });

        // 残高チェック
        const balance = await getJpycBalance(fromAddress);
        if (amount > balance) {
            throw new Error(`残高が不足しています（残高: ${balance} JPYC）`);
        }

        // POL残高チェック（ガス代）
        const polBalance = await polygonProvider.getBalance(fromAddress);
        if (polBalance === BigInt(0)) {
            throw new Error('ガス代（POL）が不足しています');
        }

        // コントラクトインスタンス（署名者付き）
        const contractWithSigner = new ethers.Contract(
            JPYC_ADDRESS,
            ERC20_ABI,
            wallet
        );

        // 送金額をWei単位に変換
        const amountInWei = ethers.parseUnits(amount.toString(), JPYC_DECIMALS);

        // トランザクション送信
        console.log('📝 トランザクション構築中...');
        const tx = await contractWithSigner.transfer(toAddress, amountInWei);

        console.log('⏳ トランザクション送信完了。マイニング待機中...', tx.hash);

        // トランザクション完了を待つ
        const receipt = await tx.wait();

        console.log('✅ トランザクション完了:', receipt.hash);

        return {
            success: true,
            txHash: receipt.hash,
            explorerUrl: `https://polygonscan.com/tx/${receipt.hash}`,
        };
    } catch (error: any) {
        console.error('❌ JPYC送金エラー:', error);
        return {
            success: false,
            error: error.message || 'トランザクション送信に失敗しました',
        };
    }
}

/**
 * JPYC設定
 */
export const JPYC_CONFIG = {
    contractAddress: JPYC_ADDRESS,
    decimals: JPYC_DECIMALS,
    symbol: 'JPYC',
    name: 'JPY Coin',
} as const;

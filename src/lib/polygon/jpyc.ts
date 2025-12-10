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
    } catch (error: any) {
        // エラーメッセージのみ抽出（機密情報を含まない）
        const safeErrorMessage = error?.message || 'Failed to get JPYC balance';
        console.error('Failed to get JPYC balance:', safeErrorMessage);
        throw new Error(safeErrorMessage);
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

        // 送金額をWei単位に変換
        const amountInWei = ethers.parseUnits(amount.toString(), JPYC_DECIMALS);

        // コントラクトインスタンス（署名者付き）
        const contractWithSigner = new ethers.Contract(
            JPYC_ADDRESS,
            ERC20_ABI,
            wallet
        );

        // ✅ ガス代を事前に見積もる
        try {
            const gasEstimate = await contractWithSigner.transfer.estimateGas(
                toAddress,
                amountInWei
            );

            // 現在のガス価格を取得
            const feeData = await polygonProvider.getFeeData();
            const gasPrice = feeData.gasPrice || ethers.parseUnits('50', 'gwei'); // フォールバック

            // 必要なPOL量を計算（20%のバッファを追加）
            const requiredPol = (gasEstimate * gasPrice * BigInt(120)) / BigInt(100);

            // POL残高チェック
            const polBalance = await polygonProvider.getBalance(fromAddress);

            if (polBalance < requiredPol) {
                const requiredPolFormatted = ethers.formatEther(requiredPol);
                const currentPolFormatted = ethers.formatEther(polBalance);
                throw new Error(
                    `ガス代（POL）が不足しています\n必要: ${requiredPolFormatted} POL\n現在: ${currentPolFormatted} POL`
                );
            }

            console.log('✅ ガス代チェック完了:', {
                gasEstimate: gasEstimate.toString(),
                gasPrice: ethers.formatUnits(gasPrice, 'gwei') + ' gwei',
                requiredPol: ethers.formatEther(requiredPol) + ' POL',
                currentPol: ethers.formatEther(polBalance) + ' POL',
            });
        } catch (error: any) {
            // ガス見積もり失敗時
            if (error.message.includes('ガス代')) {
                throw error; // 残高不足エラーはそのまま投げる
            }
            console.warn('ガス見積もり失敗、処理を続行:', error.message);
        }

        // トランザクション送信
        console.log('📝 トランザクション構築中...');
        const tx = await contractWithSigner.transfer(toAddress, amountInWei);

        console.log('⏳ トランザクション送信完了。マイニング待機中...', tx.hash);

        // ✅ バックグラウンドで確認（ユーザーは待たない）
        tx.wait()
            .then((receipt: any) => {
                console.log('✅ トランザクション確認完了:', receipt.hash);
            })
            .catch((waitError: any) => {
                console.warn('⚠️ トランザクション確認中にエラー（送信は成功）:', waitError.message);
            });

        // すぐに成功として返す（送信は成功している）
        return {
            success: true,
            txHash: tx.hash,
            explorerUrl: `https://polygonscan.com/tx/${tx.hash}`,
        };
    } catch (error: any) {
        // エラーメッセージのみ抽出（機密情報を含まない）
        const safeErrorMessage = error?.message || 'トランザクション送信に失敗しました';
        console.error('❌ JPYC送金エラー:', safeErrorMessage);

        return {
            success: false,
            error: safeErrorMessage,
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

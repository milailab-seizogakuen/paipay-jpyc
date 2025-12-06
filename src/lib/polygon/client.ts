/**
 * Polygon RPCクライアント
 * Polygon Mainnet との通信を管理
 */

import { ethers } from 'ethers';

// 環境変数から設定を読み込み
const RPC_URL = process.env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://polygon-rpc.com';
const CHAIN_ID = Number(process.env.NEXT_PUBLIC_POLYGON_CHAIN_ID) || 137;

/**
 * Polygon RPCプロバイダーのシングルトンインスタンス
 */
export const polygonProvider = new ethers.JsonRpcProvider(RPC_URL, {
    chainId: CHAIN_ID,
    name: 'polygon-mainnet',
});

/**
 * アドレスのMATIC残高を取得
 * @param address - Ethereumアドレス
 * @returns MATIC残高（数値）
 */
export async function getMaticBalance(address: string): Promise<number> {
    try {
        const balance = await polygonProvider.getBalance(address);
        return Number(ethers.formatEther(balance));
    } catch (error) {
        console.error('Failed to get MATIC balance:', error);
        throw error;
    }
}

/**
 * トランザクション履歴の型定義
 */
export interface TransactionHistory {
    txHash: string;
    timestamp: number;
    date: string;
    explorerUrl: string;
    type: 'sent' | 'received';
    amount: number;  // JPYC単位
    counterparty?: string;  // 相手のアドレス
}

/**
 * トランザクション履歴を取得
 * 注: Polygonscan APIを使用する場合は、APIキーが必要
 * 
 * @param address - Ethereumアドレス
 * @param limit - 取得件数
 * @returns トランザクション履歴の配列
 */
export async function getTransactionHistory(
    address: string,
    limit: number = 10
): Promise<TransactionHistory[]> {
    try {
        const apiKey = process.env.NEXT_PUBLIC_POLYGONSCAN_API_KEY;

        if (!apiKey) {
            console.warn('Polygonscan API key not configured. Transaction history will be limited.');
            return [];
        }

        // Polygonscan API: ERC20トークン転送履歴を取得
        const jpycAddress = process.env.NEXT_PUBLIC_JPYC_ADDRESS!;
        const url = `https://api.polygonscan.com/api?module=account&action=tokentx&contractaddress=${jpycAddress}&address=${address}&page=1&offset=${limit}&sort=desc&apikey=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== '1' || !data.result) {
            console.warn('Failed to fetch transaction history from Polygonscan');
            return [];
        }

        const formatted: TransactionHistory[] = data.result.map((tx: any) => {
            const isSent = tx.from.toLowerCase() === address.toLowerCase();
            const type: 'sent' | 'received' = isSent ? 'sent' : 'received';
            const counterparty = isSent ? tx.to : tx.from;
            const amount = Number(ethers.formatUnits(tx.value, 18));

            return {
                txHash: tx.hash,
                timestamp: Number(tx.timeStamp) * 1000,
                date: new Date(Number(tx.timeStamp) * 1000).toISOString(),
                explorerUrl: `https://polygonscan.com/tx/${tx.hash}`,
                type,
                amount,
                counterparty,
            };
        });

        return formatted;
    } catch (error) {
        console.error('Failed to get transaction history:', error);
        return [];
    }
}

/**
 * ネットワーク情報
 */
export const networkConfig = {
    network: 'polygon-mainnet',
    rpcUrl: RPC_URL,
    chainId: CHAIN_ID,
    explorerUrl: 'https://polygonscan.com',
};

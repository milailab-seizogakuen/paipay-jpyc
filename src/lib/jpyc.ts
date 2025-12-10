/**
 * JPYC トークン設定
 * P2P送金システム用（Polygon Mainnet）
 */

export const JPYC_CONFIG = {
    // JPYCコントラクトアドレス
    contractAddress: process.env.NEXT_PUBLIC_JPYC_ADDRESS || '0xE7C3D8C9a439feDe00D2600032D5dB0Be71C3c29',

    // デシマル
    decimals: 18,

    // ネットワーク
    network: 'polygon-mainnet' as const,
    rpcUrl: process.env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://polygon-rpc.com',
    chainId: Number(process.env.NEXT_PUBLIC_POLYGON_CHAIN_ID) || 137,

    // 表示名
    symbol: 'JPYC',
    name: 'JPY Coin',
} as const;

/**
 * コミュニティ通貨設定ファイル
 * このファイルを編集することで、独自のコミュニティ通貨を作成できます
 */

export const COMMUNITY_CONFIG = {
  // トークン設定
  token: {
    name: 'PainAme Coin',
    symbol: 'PAC',
    decimals: 6,
  },

  // ブランディング
  branding: {
    appName: 'PaiPay',
    primaryColor: '#ef4444', // Tailwind red-500
    logoUrl: 'https://i.imgur.com/ruz4D3L.png',
    backgroundColor: '#fef3c7', // Tailwind yellow-100
  },

  // セキュリティ設定
  security: {
    // 本番環境では必ずtrueにする
    requirePIN: true, // ✅ 本番ではtrue
    pinLength: 6,
    // 開発用ニーモニック表示（本番では必ずfalse）
    showMnemonicInUI: false, // ✅ 本番ではfalse
    // 強力な暗号化を使用（本番では必ずtrue）
    useStrongEncryption: true, // ✅ 本番ではtrue
  },

  // ネットワーク設定
  network: {
    type: 'testnet' as 'testnet' | 'mainnet',
    rpcUrl: 'https://fullnode.testnet.sui.io:443',
  },
} as const;

// 環境変数から読み込む設定
export const ENV_CONFIG = {
  packageId: process.env.NEXT_PUBLIC_PAINAME_PACKAGE_ID!,
  treasuryCapId: process.env.NEXT_PUBLIC_PAINAME_TREASURY_CAP_ID,
} as const;

// CoinType を自動生成
export const getCoinType = () => {
  return `${ENV_CONFIG.packageId}::pain_ame::PAIN_AME`;
};

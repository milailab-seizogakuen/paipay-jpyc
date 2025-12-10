/**
 * PainAme トークン設定
 * P2P送金システム用
 */

export const PAINAME_CONFIG = {
  // トークン設定（.env.localから）
  packageId: process.env.NEXT_PUBLIC_PAINAME_PACKAGE_ID!,
  treasuryCapId: process.env.NEXT_PUBLIC_PAINAME_TREASURY_CAP_ID!,
  
  // コインタイプ（送金に必要）
  get coinType() {
    return `${this.packageId}::pain_ame::PAIN_AME`;
  },
  
  // デシマル
  decimals: 6,
  
  // ネットワーク
  network: 'testnet' as const,
  rpcUrl: 'https://fullnode.testnet.sui.io:443',
  
  // 表示名
  symbol: 'PAC',
  name: 'PainAme Coin',
} as const;

// テスト用配布元（開発時のみ使用）
export const TEST_DISTRIBUTOR = {
  address: '0xd50bdae6694027c7e4689e53ba0ae28f1c40eb8f503fd1028d951d443b630423',
  mnemonic: process.env.NEXT_PUBLIC_DISTRIBUTOR_MNEMONIC!,
} as const;

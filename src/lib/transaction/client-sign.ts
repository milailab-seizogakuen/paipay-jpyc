/**
 * クライアント側トランザクション署名
 * セキュリティ: ニーモニックをサーバーに送信しない
 */

import { ethers } from 'ethers';
import { sendJpyc, SendJpycParams, SendJpycResult } from '@/lib/polygon/jpyc';

export interface SendTransactionParams {
  mnemonic: string;
  toAddress: string;
  amount: number;
  memo?: string;
}

/**
 * クライアント側でトランザクションを構築・署名
 * JPYC ERC20トークンの送金を実行
 */
export async function createAndSignTransaction(
  params: SendTransactionParams
): Promise<SendJpycResult> {
  const { mnemonic, toAddress, amount, memo } = params;

  console.log('📤 JPYC送金トランザクション開始:', {
    to: toAddress,
    amount,
    memo,
  });

  // JPYC送金を実行
  const result = await sendJpyc({
    mnemonic,
    toAddress,
    amount,
  });

  return result;
}

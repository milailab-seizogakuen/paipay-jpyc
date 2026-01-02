// ニーモニックからアドレスを確認するテストスクリプト
// Node.js で実行: node test-mnemonic.js

const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');

// 正しいリカバリーフレーズ
const mnemonic = "fiscal usual weasel flag angle gate blood lizard scissors cabbage attitude noise";

try {
  const keypair = Ed25519Keypair.deriveKeypair(mnemonic);
  const address = keypair.getPublicKey().toSuiAddress();
  
  console.log('✅ 復元成功');
  console.log('復元されたアドレス:', address);
  console.log('');
  console.log('期待するアドレス:   0x62ed36f0c8c119c0eadf7dcb9f1ba5c64f90bc260ccd591e35a69a450dd8d331');
  console.log('一致:', address === '0x62ed36f0c8c119c0eadf7dcb9f1ba5c64f90bc260ccd591e35a69a450dd8d331');
} catch (error) {
  console.error('❌ エラー:', error.message);
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-3xl p-8 text-white shadow-xl text-center max-w-md">
        <img 
          src="https://i.imgur.com/ruz4D3L.png" 
          alt="PaiPay Logo" 
          className="h-12 w-auto mx-auto mb-6 drop-shadow-lg"
        />
        <h1 className="text-3xl font-bold mb-4">PaiPay P2P</h1>
        <p className="text-white/90 mb-6">パインアメ送金システム</p>
        <div className="space-y-3">
          <a 
            href="/setup" 
            className="block bg-white text-red-600 px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors"
          >
            ウォレット作成
          </a>
          <a 
            href="/wallet/1" 
            className="block bg-white/20 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/30 transition-colors"
          >
            テスト: ウォレット1
          </a>
        </div>
        <p className="text-xs text-white/70 mt-8">🚀 P2P送金システム - 開発中</p>
      </div>
    </div>
  )
}

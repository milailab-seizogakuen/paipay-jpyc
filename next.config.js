/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest\.json$/],
});

const nextConfig = {
  reactStrictMode: true,

  // 本番ビルド時にconsole.logを自動削除
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'], // error/warnは残す
    } : false,
  },

  // Netlifyで静的エクスポートを使う場合（プラグインが動作しない場合）
  // output: 'export',
  // trailingSlash: true,
};

module.exports = withPWA(nextConfig);

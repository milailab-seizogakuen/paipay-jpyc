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
<<<<<<< HEAD

  // 本番ビルド時にconsole.logを自動削除
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'], // error/warnは残す
    } : false,
  },
=======
>>>>>>> 532daf6575718948328ce94c9dd23d195774d3ea
};

module.exports = withPWA(nextConfig);

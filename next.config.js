/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'disclosure.priconne-redive.jp',
        port: '',
        pathname: '/priconne-redive/**',
      },
      {
        protocol: 'https',
        hostname: 'www.princessconnect.so-net.tw',
        port: '',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'dszw1qtcnsa5e.cloudfront.net',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig 
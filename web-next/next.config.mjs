/** @type {import('next').NextConfig} */
const nextConfig = {
  // GitHub Pages serves static files only — export a fully static site.
  output: 'export',
  // Project pages live at https://<user>.github.io/slice/
  basePath: '/slice',
  assetPrefix: '/slice',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,

  webpack: (config) => {
    // wagmi's Coinbase connector reaches for optional deps that are not
    // installed and are not needed for injected/WalletConnect flows.
    config.resolve.alias = {
      ...config.resolve.alias,
      '@x402/evm': false,
      '@coinbase/cdp-sdk': false,
    };
    // Optional pretty-printers pulled in by walletconnect's logger.
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};
export default nextConfig;

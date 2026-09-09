/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // wagmi's Coinbase connector reaches for optional deps that are not
    // installed and are not needed for injected/WalletConnect flows.
    config.resolve.alias = { ...config.resolve.alias, '@x402/evm': false, '@coinbase/cdp-sdk': false };
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};
export default nextConfig;

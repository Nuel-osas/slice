import './landing.css';

export const metadata = {
  // Base Build app verification
  other: { 'base:app_id': '6aa1eac93ee3d6b47f7f053c' },
  metadataBase: new URL('https://mirrl.xyz'),
  openGraph: { title: 'Slice', description: 'Build your own index of Coinbase tokenized stocks on Base, then hold it.', type: 'website' },
  title: 'Slice: your own index of tokenized stocks on Base',
  description:
    'Weight Coinbase tokenized stocks into a personal index, price it live from Chainlink, see what any Base wallet actually holds, and get the exact trades to rebalance.',
  icons: {
    icon:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' fill='%23ffffff'/%3E%3Cpath d='M12 12 L12 3 A9 9 0 0 1 21 12 Z' fill='%230052ff'/%3E%3Cpath d='M12 12 L21 12 A9 9 0 1 1 12 3 Z' fill='none' stroke='%230052ff' stroke-width='1.5'/%3E%3C/svg%3E",
  },
};

export const viewport = { themeColor: '#efefef' };

export default function RootLayout({ children }) {
  return (
    <html lang="en"><body>{children}</body></html>
  );
}

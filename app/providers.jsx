'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider, getDefaultConfig, lightTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { base } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

const config = getDefaultConfig({
  appName: 'Slice',
  // WalletConnect (Reown) cloud project id; injected and Coinbase Wallet work without it.
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'slice_base_tokenized_stocks',
  chains: [base],
  ssr: true,
});

export default function Providers({ children }) {
  const [qc] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={qc}>
        <RainbowKitProvider
          initialChain={base}
          theme={lightTheme({ accentColor: '#0052ff', accentColorForeground: '#fff', borderRadius: 'small', overlayBlur: 'small' })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

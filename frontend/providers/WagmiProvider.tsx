'use client'

import { PropsWithChildren, useState } from 'react'
import { WagmiProvider as BaseWagmiProvider } from 'wagmi'
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import { http } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { coreTestnet } from '../src/libs/coreChain'
import { base, optimism } from 'wagmi/chains'

const wagmiConfig = getDefaultConfig({
  appName: 'LotusGift',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo',
  chains: [base, optimism, coreTestnet],
  ssr: true,
  transports: {
    [base.id]: http(),
    [optimism.id]: http(),
    [coreTestnet.id]: http(coreTestnet.rpcUrls.default.http[0]),
  },
})

export function WagmiProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient())
  return (
    <BaseWagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider initialChain={coreTestnet}>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </BaseWagmiProvider>
  )
}



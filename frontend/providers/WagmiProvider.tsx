'use client'

import { PropsWithChildren, useState } from 'react'
import { WagmiProvider as BaseWagmiProvider, createConfig, http } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { coreTestnet } from '../src/libs/coreChain'

const wagmiConfig = createConfig({
  chains: [coreTestnet],
  connectors: [injected()],
  transports: {
    [coreTestnet.id]: http(coreTestnet.rpcUrls.default.http[0]),
  },
})

export function WagmiProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient())
  return (
    <BaseWagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </BaseWagmiProvider>
  )
}



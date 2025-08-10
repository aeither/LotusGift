'use client'

import { BitteAiChat } from '@bitte-ai/chat'
import '@bitte-ai/chat/styles.css'
import { useAccount, useWalletClient } from 'wagmi'
import ClientOnly from '@/components/ClientOnly'

export default function BitteAIPage() {
  const { address } = useAccount()
  const { data: wallet } = useWalletClient()
  const agentId = process.env.NEXT_PUBLIC_BITTE_AGENT_ID || ''

  const sendTx = async (tx: any) => {
    if (!wallet) throw new Error('Wallet not connected')
    const value = tx?.value != null ? BigInt(tx.value) : undefined
    return wallet.sendTransaction({
      to: tx?.to as `0x${string}` | undefined,
      data: tx?.data as `0x${string}` | undefined,
      value,
    })
  }

  return (
    <ClientOnly>
      <main className="max-w-2xl mx-auto p-4 grid gap-4">
        <h1 className="text-2xl font-semibold">Bitte AI Agent</h1>
        {!agentId && (
          <div className="text-sm text-red-600">Set NEXT_PUBLIC_BITTE_AGENT_ID in .env.local</div>
        )}
        <BitteAiChat agentId={agentId} apiUrl="/api/bitte/chat" format="markdown" wallet={{ evm: { sendTransaction: sendTx as any, address } }} />
      </main>
    </ClientOnly>
  )
}



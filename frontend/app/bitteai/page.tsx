'use client'

import { BitteAiChat } from '@bitte-ai/chat'
import '@bitte-ai/chat/styles.css'
import { useAccount, useSendTransaction } from 'wagmi'
import ClientOnly from '@/components/ClientOnly'

export default function BitteAIPage() {
  const { address } = useAccount()
  const { sendTransaction } = useSendTransaction()
  const agentId = process.env.NEXT_PUBLIC_BITTE_AGENT_ID || ''

  return (
    <ClientOnly>
      <main className="max-w-2xl mx-auto p-4 grid gap-4">
        <h1 className="text-2xl font-semibold">Bitte AI Agent</h1>
        {!agentId && (
          <div className="text-sm text-red-600">Set NEXT_PUBLIC_BITTE_AGENT_ID in .env.local</div>
        )}
        <BitteAiChat agentId={agentId} apiUrl="/api/bitte/chat" format="markdown" wallet={{ evm: { sendTransaction, address } }} />
      </main>
    </ClientOnly>
  )
}



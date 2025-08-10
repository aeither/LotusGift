'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useAccount } from 'wagmi'
import { base, optimism } from 'wagmi/chains'
import { zircuit as zircuitChain } from 'viem/chains'
import { QUOTE_REQUEST as TEMPLATE } from '@/libs/bridgeTemplate'

type ChainOption = { id: number; name: string }

const CHAINS: ChainOption[] = [
  { id: base.id, name: 'Base' },
  { id: optimism.id, name: 'Optimism' },
  { id: zircuitChain.id, name: 'Zircuit' },
]

export default function GiftForm() {
  const { address } = useAccount()
  const [destChainId, setDestChainId] = useState<number>(zircuitChain.id)
  const [receiver, setReceiver] = useState<string>('')
  const [amountUsdc, setAmountUsdc] = useState<string>('1')

  const startSwap = async () => {
    if (!address) return toast.error('Connect wallet first')
    if (!receiver) return toast.error('Enter receiver address')
    const srcAmountWei = String(Math.round(Number(amountUsdc) * 1_000_000))

    const req = {
      ...TEMPLATE,
      srcAmountWei,
      destChainId,
    }

    const p = fetch('/api/bridge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request: req, receiver }),
    }).then(async (r) => {
      if (!r.ok) throw new Error(await r.text())
      return r.json()
    })

    toast.promise(p, {
      loading: 'Submitting trade…',
      success: 'Trade submitted. Tracking…',
      error: 'Failed to submit trade',
    })
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-2">
        <label className="text-sm">Receiver</label>
        <input className="border border-neutral-200 rounded-md p-2" placeholder="0x…" value={receiver} onChange={(e) => setReceiver(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <label className="text-sm">Amount (USDC)</label>
        <input className="border border-neutral-200 rounded-md p-2" placeholder="1.00" value={amountUsdc} onChange={(e) => setAmountUsdc(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <label className="text-sm">Destination chain</label>
        <select className="border border-neutral-200 rounded-md p-2" value={destChainId} onChange={(e) => setDestChainId(Number(e.target.value))}>
          {CHAINS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <button className="bg-red-600 text-white rounded-md py-2" onClick={startSwap}>
        Swap & Send
      </button>
    </div>
  )
}



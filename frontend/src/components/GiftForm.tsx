'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { useAccount, useWalletClient, usePublicClient, useChainId, useSwitchChain, useSendTransaction, useWriteContract } from 'wagmi'
import { erc20Abi, getAddress, isAddress } from 'viem'
import { base, optimism } from 'wagmi/chains'
import { zircuit as zircuitChain } from 'viem/chains'
import { QUOTE_REQUEST as TEMPLATE } from '@/libs/bridgeTemplate'
import { sanitizeUsdcInput, estimateOrder, getOrderStatus } from '@/libs/tradeClient'

type ChainOption = { id: number; name: string }

const CHAINS: ChainOption[] = [
  { id: base.id, name: 'Base' },
  { id: optimism.id, name: 'Optimism' },
  { id: zircuitChain.id, name: 'Zircuit' },
]

export default function GiftForm() {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const currentChainId = useChainId()
  const publicClient = usePublicClient()
  const { switchChainAsync } = useSwitchChain()
  const { sendTransactionAsync } = useSendTransaction()
  const { writeContractAsync } = useWriteContract()
  const [destChainId, setDestChainId] = useState<number>(zircuitChain.id)
  const [receiver, setReceiver] = useState<string>('')
  const [amountUsdc, setAmountUsdc] = useState<string>('1')

  const startSwap = async () => {
    if (!address) return toast.error('Connect wallet first')
    if (!receiver) return toast.error('Enter receiver address')
    if (!isAddress(receiver)) return toast.error('Receiver must be a valid EVM address')
    // Parse tolerant input like "1 usdc" or "1,00"
    const numeric = amountUsdc.replace(/[^0-9.,]/g, '').replace(',', '.')
    if (!numeric || Number.isNaN(Number(numeric))) {
      return toast.error('Enter a valid USDC amount')
    }
    let srcAmountWei: string
    try {
      srcAmountWei = sanitizeUsdcInput(numeric)
    } catch {
      return toast.error('Invalid USDC amount')
    }

    const req: Parameters<typeof estimateOrder>[0] = {
      ...TEMPLATE,
      srcAmountWei,
      destChainId,
      userAccount: address as `0x${string}`,
      destReceiver: getAddress(receiver) as `0x${string}`,
    }

    // Log how QUOTE_REQUEST looks after user input
    console.log('QUOTE_REQUEST →', req)
    console.log('receiver →', receiver)
    console.log('wallet connected →', Boolean(walletClient), 'address →', address)

    const estimate = await estimateOrder(req)
    console.log('estimate →', estimate)
    // const estimate = await toast.promise(estimateOrder(req), {
    //   loading: 'Requesting quote…',
    //   success: 'Quote received',
    //   error: 'Failed to get quote',
    // })

    const data = (estimate as any).data || estimate
    const trade = (data as any)?.trade
    const tx = (data as any)?.tx
    console.log('estimate.raw →', estimate)
    console.log('estimate.data →', data)
    console.log('Trade →', trade)
    console.log('estimate.tx →', tx)
    if (!tx?.to || !tx?.data) {
      toast.error('Invalid quote tx payload. Check console for details.')
      return
    }

    // Ensure correct chain
    if (currentChainId !== req.srcChainId) {
      await switchChainAsync({ chainId: req.srcChainId })
    }

    // Check allowance for USDC (if non-native)
    const spender = tx.to as `0x${string}`
    const token = req.srcToken as `0x${string}`
    if (token.toLowerCase() !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
      const allowance = await publicClient!.readContract({
        address: token,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address as `0x${string}`, spender],
      })
      if ((allowance as bigint) < BigInt(req.srcAmountWei)) {
        const { request } = await publicClient!.simulateContract({
          address: token,
          abi: erc20Abi,
          functionName: 'approve',
          args: [spender, BigInt(req.srcAmountWei)],
          account: address as `0x${string}`,
        })
        const approveHash = await toast.promise(
          writeContractAsync(request as any),
          { loading: 'Approving USDC…', success: 'Approved', error: 'Approval failed' },
        )
        await publicClient!.waitForTransactionReceipt({ hash: approveHash as `0x${string}` })
      }
    }

    // Send trade tx
    const tradeHash = await toast.promise(
      sendTransactionAsync({
        to: tx.to as `0x${string}`,
        data: tx.data as `0x${string}`,
        value: tx.value ? BigInt(tx.value) : 0n,
        chainId: req.srcChainId,
      }),
      { loading: 'Submitting trade…', success: 'Trade submitted', error: 'Trade submission failed' },
    )
    await publicClient!.waitForTransactionReceipt({ hash: tradeHash as `0x${string}` })

    // Poll order status (basic)
    let status = 'PENDING'
    for (let i = 0; i < 20; i++) {
      const s = await getOrderStatus(tradeHash as string)
      status = (s.status || s?.data?.status || '').toString()
      if (['SUCCESS', 'FAILED', 'REFUNDED', 'UNKNOWN'].includes(status)) break
      await new Promise((r) => setTimeout(r, 2000))
    }
    toast.success(`Trade status: ${status || 'UNKNOWN'}`)
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-2">
        <label className="text-sm">Receiver</label>
        <input className="border border-neutral-200 rounded-md p-2" placeholder="0x…" value={receiver} onChange={(e) => setReceiver(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <label className="text-sm">Amount (USDC)</label>
        <input className="border border-neutral-200 rounded-md p-2" inputMode="decimal" placeholder="1.00" value={amountUsdc} onChange={(e) => setAmountUsdc(e.target.value)} />
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
      <Button className="bg-red-600 text-white cursor-pointer" onClick={startSwap}>
        Swap & Send
      </Button>
    </div>
  )
}



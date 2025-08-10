import { Address, erc20Abi, getAddress, parseUnits } from 'viem'
import { createPublicClient, http } from 'viem'
import { base, optimism, zircuit, arbitrum, mainnet } from 'viem/chains'

export type QuoteRequest = {
  srcChainId: number
  srcToken: Address
  srcAmountWei: string
  destToken: Address
  destChainId: number
  slippageBps: number
  userAccount: Address
  destReceiver: Address
}

export const SUPPORTED = [base, optimism, zircuit, arbitrum, mainnet]

export function getPublicClientById(chainId: number) {
  const chain = SUPPORTED.find((c) => c.id === chainId)
  if (!chain) throw new Error(`Unsupported chain: ${chainId}`)
  return createPublicClient({ chain, transport: http() })
}

// Direct Engine config (client-side) – for demo only. Do not ship hardcoded keys to production.
const ENGINE_API_BASE = process.env.NEXT_PUBLIC_ZIRCUIT_ENGINE_API_BASE || 'https://trading.ai.zircuit.com/api/engine/v1'
const ENGINE_API_KEY = 'ETHVietnam2025'

export async function estimateOrder(req: QuoteRequest) {
  console.log('tradeClient.estimateOrder →', req)
  const res = await fetch(`${ENGINE_API_BASE}/order/estimate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Demo: Authorization sent from client. Replace with server-side proxy for production.
    // eslint-disable-next-line @typescript-eslint/naming-convention
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ENGINE_API_KEY}` },
    body: JSON.stringify(req),
  })
  if (!res.ok) {
    const err = await res.text()
    console.error('tradeClient.estimateOrder error:', err)
    throw new Error(err)
  }
  return res.json()
}

export async function getOrderStatus(txHash: string) {
  console.log('tradeClient.getOrderStatus →', txHash)
  const p = new URLSearchParams({ txHash })
  const res = await fetch(`${ENGINE_API_BASE}/order/status?${p.toString()}`, {
    method: 'GET',
    // Demo header – move server-side for production.
    headers: { Authorization: `Bearer ${ENGINE_API_KEY}` },
  })
  if (!res.ok) {
    const err = await res.text()
    console.error('tradeClient.getOrderStatus error:', err)
    throw new Error(err)
  }
  return res.json()
}

export function sanitizeUsdcInput(value: string) {
  const numeric = value.replace(/[^0-9.,]/g, '').replace(',', '.')
  if (!numeric || Number.isNaN(Number(numeric))) throw new Error('Invalid amount')
  return parseUnits(numeric, 6).toString()
}



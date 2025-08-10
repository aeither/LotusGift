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
  userAccount?: Address
  destReceiver?: Address
}

export const SUPPORTED = [base, optimism, zircuit, arbitrum, mainnet]

export function getPublicClientById(chainId: number) {
  const chain = SUPPORTED.find((c) => c.id === chainId)
  if (!chain) throw new Error(`Unsupported chain: ${chainId}`)
  return createPublicClient({ chain, transport: http() })
}

export async function estimateOrder(req: QuoteRequest) {
  const res = await fetch('/api/bridge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: 'order/estimate', payload: req }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function getOrderStatus(txHash: string) {
  const res = await fetch('/api/bridge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: 'order/status', txHash }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export function sanitizeUsdcInput(value: string) {
  const numeric = value.replace(/[^0-9.,]/g, '').replace(',', '.')
  if (!numeric || Number.isNaN(Number(numeric))) throw new Error('Invalid amount')
  return parseUnits(numeric, 6).toString()
}



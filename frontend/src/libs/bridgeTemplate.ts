import type { QuoteRequest } from './tradeClient'

// Default quote request template used by the frontend bridge flow
// Mirrors the structure expected by the trading engine
export const QUOTE_REQUEST: QuoteRequest = {
  // Base mainnet
  srcChainId: 8453,
  // USDC on Base
  srcToken: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
  // 1 USDC (6 decimals) — caller should override
  srcAmountWei: '1000000',
  // Native token (ETH)
  destToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  // Zircuit Mainnet
  destChainId: 48900,
  // 1% slippage in basis points
  slippageBps: 100,
}



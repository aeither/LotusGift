import { coreTestnet } from './coreChain';

// Export all supported chains as a reusable array
export const SUPPORTED_CHAINS = [
  coreTestnet,
] as const;

// Export chain IDs for easy checking
export const SUPPORTED_CHAIN_IDS = SUPPORTED_CHAINS.map(chain => chain.id);

// Currency configuration for different chains
export const CURRENCY_CONFIG = {
  48900: { // Zircuit Mainnet
    symbol: 'ETH',
    multiplier: 1,
    defaultAmounts: ['0.01', '0.05', '0.1']
  },
  default: { // Fallback configuration
    symbol: 'ETH',
    multiplier: 1,
    defaultAmounts: ['0.001', '0.005', '0.05']
  }
} as const; 
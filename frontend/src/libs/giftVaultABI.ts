export const giftVaultABI = [
  {
    type: 'function',
    name: 'createGift',
    stateMutability: 'payable',
    inputs: [
      { name: 'receiver', type: 'address' },
      { name: 'message', type: 'string' },
      { name: 'category', type: 'string' },
    ],
    outputs: [{ name: 'giftId', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'claimGift',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'giftId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'gifts',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [
      { name: 'sender', type: 'address' },
      { name: 'receiver', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'message', type: 'string' },
      { name: 'category', type: 'string' },
      { name: 'hasClaimed', type: 'bool' },
      { name: 'timestamp', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'nextGiftId',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'withdraw',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'to', type: 'address' }],
    outputs: [],
  },
  { type: 'function', name: 'owner', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'address' }] },
] as const



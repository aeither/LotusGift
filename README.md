# GiftVault: Smart Contract-Powered Gifting Platform

GiftVault lets family and friends send message-attached micro-gifts that the intended recipient can later claim from a smart contract. Gifts are recorded on-chain with sender, receiver, amount, message, category, and timestamp.

This repository contains:
- A minimal GiftVault smart contract (ETH-only gifts for now)
- A Next.js mini frontend page to simulate sending gifts and test notifications
- A minimal Hono backend exposing a manifest and sample tools (for Bitte-style agents)
- Optional trading example scripts (separate from GiftVault)

## What’s implemented today

### Smart contracts
- Location: `frontend/contracts/src/GiftVault.sol`
- Core data model and functions:

```solidity
struct Gift {
  address sender;
  address receiver;
  uint256 amount; // in wei (ETH)
  string message;
  string category; // e.g., birthday, celebration
  bool hasClaimed;
  uint256 timestamp;
}

function createGift(address receiver, string calldata message, string calldata category)
  external payable returns (uint256 giftId);

function claimGift(uint256 giftId) external;
```

- Emits `GiftCreated` and `GiftClaimed` events.
- ETH-only gifts via `msg.value`. No ERC-20 support yet.
- No encryption, expiry, or private messaging yet.

There is also a simple `KeyValueStore.sol` in `frontend/contracts/src/` used for basic key→value storage demos.

### Frontend
- Location: `frontend/`
- Next.js 14 app with a demo page at `app/gift/page.tsx` that:
  - Shows a simple form (receiver, amount, message, category)
  - Simulates a “send gift” action and triggers a MiniKit notification (UI demo only)
  - Not yet wired to the on-chain contract write; wiring via `wagmi/viem` is planned
- `app/api/notification/route.ts`: Proxy endpoint to forward notification requests (default: Coinbase CDP URL; override via env)
- `app/api/webhook/route.ts`: Placeholder webhook for future integrations
- `providers/MiniKitProvider.tsx`: MiniKit provider setup for Base chain

### Backend (Hono)
- Location: `backend/server.ts`
- Minimal API with:
  - `/health` health check
  - `/api/ai-plugin` (and `/.well-known/ai-plugin.json`) manifest
  - Sample tools: `/api/coinflip` (GET), `/api/greeting` (POST)

## Run the project

### Prerequisites
- Node.js 18+
- pnpm installed globally (`npm i -g pnpm`) or use npx for one-off commands
- Foundry if building the contracts (`forge`) – see `frontend/contracts/INSTALL.md`

### Environment variables
Create the following as needed:

Frontend (`frontend/.env.local`):
```
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_onchainkit_api_key
NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME=GiftVault
NEXT_PUBLIC_ICON_URL=https://your-host/icon.png
# Optional: override notification proxy target
NEXT_PUBLIC_NOTIFICATION_PROXY_URL=https://api.developer.coinbase.com/cdp/notifications
```

Backend (`.env` at repo root):
```
# Optional, used in the Hono server manifest metadata
BITTE_API_KEY=your_bitte_api_key
```

Trading scripts (optional, separate feature in `scripts/`):
```
API_KEY=ETHVietnam2025
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
# For gasless example script only
RELAYER_PRIVATE_KEY=0xYOUR_RELAYER_PRIVATE_KEY
```

### Install and run

Backend (Hono):
```
pnpm install
npx tsx backend/server.ts
# Manifest: http://localhost:3001/api/ai-plugin
# Health:   http://localhost:3001/health
```

Frontend (Next.js):
```
cd frontend
pnpm install
pnpm dev
# Open http://localhost:3000/gift
```

Contracts (Foundry):
```
cd frontend/contracts
forge build
forge test
# See script/ for deployment helpers (e.g., DeployGiftVault.s.sol)
```

Optional trading scripts (unrelated to GiftVault core):
```
# Direct execution example
npx tsx scripts/trade.ts

# Gasless (relayer) example
npx tsx scripts/trade-gasless.ts
```

## Interacting with GiftVault (example)

Using viem to create and claim a gift (ETH-only):

```ts
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { base } from 'viem/chains'

const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`)
const client = createWalletClient({ account, chain: base, transport: http() })
const giftVault = '0xYourDeployedGiftVaultAddress'

// createGift(receiver, message, category), sending ETH as value
await client.writeContract({
  address: giftVault,
  abi: [
    { name: 'createGift', type: 'function', stateMutability: 'payable', inputs: [
      { name: 'receiver', type: 'address' },
      { name: 'message', type: 'string' },
      { name: 'category', type: 'string' },
    ], outputs: [{ name: 'giftId', type: 'uint256' }] },
  ] as const,
  functionName: 'createGift',
  args: ['0xReceiver', 'Happy Birthday!', 'birthday'],
  value: 10n ** 16n, // 0.1 ETH
})

// claimGift(giftId) from the receiver account
```

## Roadmap (near-term)
- Wire frontend `app/gift/page.tsx` to on-chain `createGift`/`claimGift` via `wagmi` + `viem`
- Add read views (list gifts for address, event indexing)
- Optional: ERC-20 gift support, expiry/return-to-sender logic, richer notifications

## Notes on scope and accuracy
- Gifts are ETH-only today. No private message encryption or ZK features are implemented.
- The frontend “send gift” is currently a UI simulation; on-chain writes are not yet connected.
- The Hono backend provides a minimal agent manifest and sample tools; it does not process gifts.
- Trading scripts are examples unrelated to GiftVault’s core flow.

## License
MIT
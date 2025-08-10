# LotusGift

AI-assisted onchain gifting with a delightful red-envelope UX. Create a message-attached gift on a smart contract, notify the recipient via Base MiniKit, and optionally bridge value cross-chain using the Zircuit trading engine. Includes a minimal Bitte AI agent for chat + wallet-aware actions.

### Vision
- Make onchain gifting delightful, instant, and interoperable.
- Pair human warmth (messages) with programmable money and AI assistance.
- One flow that works across wallets, chains, and surfaces.

### Problem → Solution
- **Problem**: Sending small, meaningful gifts onchain is clunky: approvals, quotes, bridges, and poor UX. Cross-chain adds more friction. Messages are an afterthought.
- **Solution**: LotusGift unifies gift creation, AI-crafted messages, MiniKit notifications, and optional cross-chain settlement (Base → Zircuit) behind a clean, mobile‑first UI.

---

## Architecture (Bitte AI, Zircuit Engine, Smart Contract, Base MiniKit)

- **Frontend (Next.js 14)**
  - Mobile-first UI and visual polish (envelope animation, simple forms, toasts)
  - Base MiniKit for wallet, in-app surfaces, and notifications
    - `frontend/providers/MiniKitProvider.tsx`
  - Bitte AI chat surface with wallet execution
    - Page: `frontend/app/bitteai/page.tsx` (uses `@bitte-ai/chat`)
    - API proxy: `frontend/app/api/bitte/chat/route.ts`
  - Zircuit trading engine bridge (server-side)
    - API proxy: `frontend/app/api/bridge/route.ts`
    - Client helpers: `frontend/src/libs/tradeClient.ts`, `frontend/src/libs/engine.ts`, `frontend/src/libs/bridgeTemplate.ts`
  - Gift UX
    - Home: `frontend/app/page.tsx` (hero, `EnvelopeCard`, `GiftForm`)
    - Onchain Gift page: `frontend/app/gift/page.tsx` (create/claim gifts with `wagmi/viem`)
  - Notifications / Webhooks
    - Notification proxy: `frontend/app/api/notification/route.ts`
    - Webhook placeholder: `frontend/app/api/webhook/route.ts`

- **Smart Contracts**
  - `frontend/contracts/src/GiftVault.sol`
  - Functions: `createGift(address receiver, string message, string category)` (payable), `claimGift(uint256 giftId)`
  - Events: `GiftCreated`, `GiftClaimed`
  - The example dapp reads/writes via `frontend/app/gift/page.tsx` using `NEXT_PUBLIC_GIFT_VAULT_ADDRESS` (currently wired for Core Testnet by default; configurable).

- **Zircuit Trading Engine (Cross-Chain Settlement)**
  - Server-proxied to keep API keys server-side and enable CORS-free requests
  - Estimate: POST `/api/bridge` with `{ path: 'order/estimate', payload }`
  - Status: POST `/api/bridge` with `{ path: 'order/status', txHash }`
  - Default template: Base USDC → Zircuit native ETH (see `bridgeTemplate.ts`)

- **Bitte AI Agent (Backend: Hono)**
  - `backend/server.ts` exposes a manifest (`/api/ai-plugin`) and sample tools (`/api/coinflip`, `/api/greeting`, `/api/gift-message`)
  - Used to demonstrate how agents can reason, call tools, and coordinate wallet actions

---

## Innovations (UX + Protocol)
- **User-centered design**: red-envelope micro-interactions, tolerant amount input, accessible form labels, responsive layout.
- **Seamless approvals**: detect allowance and approve only when needed; safe server-proxied quoting.
- **Cross-chain in one flow**: request quote, approve (if needed), submit trade, poll status.
- **AI in the loop**: Bitte chat can draft gift messages and prepare transactions; Hono tools demonstrate agent-driven actions.
- **Notifications**: MiniKit in-app notifications confirm actions and improve trust.

---

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (or npm)
- Foundry (for contracts) – see `frontend/contracts/INSTALL.md`

### Environment variables

Frontend (`frontend/.env.local`)
```
# Base MiniKit / OnchainKit
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_onchainkit_api_key
NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME=LotusGift
NEXT_PUBLIC_ICON_URL=https://your-host/icon.png

# WalletConnect / wagmi
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_wc_project_id

# GiftVault
NEXT_PUBLIC_GIFT_VAULT_ADDRESS=0xYourDeployedGiftVault

# Bitte AI (UI proxy)
BITTE_API_KEY=your_bitte_api_key
BITTE_API_BASE=https://api.bitte.ai
NEXT_PUBLIC_BITTE_AGENT_ID=your_agent_id

# Zircuit Trading Engine (server-proxied)
ZIRCUIT_ENGINE_API_BASE=https://trading.ai.zircuit.com/api/engine/v1
ZIRCUIT_ENGINE_API_KEY=your_engine_api_key

# Optional notification proxy
NEXT_PUBLIC_NOTIFICATION_PROXY_URL=https://api.developer.coinbase.com/cdp/notifications
```

Backend (`.env` at repo root)
```
BITTE_API_KEY=your_bitte_api_key
BITTE_AGENT_URL=http://localhost:3001
PORT=3001
```

### Install & Run
```
# Root backend (Hono)
pnpm install
npx tsx backend/server.ts

# Frontend (Next.js)
cd frontend
pnpm install
pnpm dev
# Open http://localhost:3000
```

### Contracts (Foundry)
```
cd frontend/contracts
forge build
forge test
```

---

## Key Flows
- **Create onchain gift**: `/gift` writes to `GiftVault` (ETH), shows incoming gifts for the connected receiver, and supports claim/withdraw.
- **Swap & Send (optional)**: Home page `GiftForm` requests a quote and executes a cross-chain trade (Base → Zircuit) via the server proxy; handles ERC‑20 approvals and status polling.
- **Chat with Bitte AI**: `/bitteai` renders the chat UI; the agent can propose transactions and call tools.

## Repository Layout
- `frontend/` Next.js app, providers, routes, UI, libs
- `frontend/contracts/` Foundry project for `GiftVault.sol`
- `backend/` Hono agent server and OpenAPI manifest
- `scripts/` Zircuit engine scripts (optional examples)

## License
MIT
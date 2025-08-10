
## 🚀 Deployment Commands

All commands must be run from `frontend/contracts`. Ensure `forge` is installed and you have a funded `PRIVATE_KEY` set in `.env`.

```bash
# one-time
cp .env.example .env  # or create .env with PRIVATE_KEY=0x...
source .env
rm -rf cache out && forge build
```

### Zircuit Mainnet - Chain ID: 48900 (0xbf04)
```bash
source .env && rm -rf cache out && forge build && forge script script/DeployGiftVault.s.sol:DeployGiftVault \
  --chain 48900 \
  --rpc-url https://mainnet.zircuit.com \
  --broadcast -vvvv \
  --private-key ${PRIVATE_KEY}
```

After deployment, copy the printed `GiftVault` address and update the frontend env file:

```bash
# from repository root
echo "NEXT_PUBLIC_GIFT_VAULT_ADDRESS=0x..." >> frontend/.env.local
```

## 🌐 Network Details

### Zircuit Mainnet
| Parameter | Value |
|-----------|-------|
| **Network Name** | Zircuit Mainnet |
| **Chain ID** | 48900 (0xbf04) |
| **RPC Endpoint** | https://mainnet.zircuit.com |
| **Currency Symbol** | ETH |

> RPC reference: [Zircuit Mainnet RPC](https://mainnet.zircuit.com)

## 📋 Contract Verification

Use the Zircuit explorer verification UI/API if available. Provide:
- Compiler: solc 0.8.30
- Optimizer: enabled, 200 runs, viaIR true
- Contract: `src/GiftVault.sol:GiftVault`

## 🔗 Useful Resources

- **Zircuit Mainnet RPC**: https://mainnet.zircuit.com

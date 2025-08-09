# trading-engine-workshop


## How to run the script
1. Install packages with pnpm: `pnpm install`
2. Create a `.env` file in the project root with the following:
```
API_KEY=ETHVietnam2025
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
```
3. Modify `./scripts/trade.ts` and update the `QUOTE_REQUEST` so the transaction matches what you intend.
4. Run the script with tsx: `npx tsx scripts/trade.ts`
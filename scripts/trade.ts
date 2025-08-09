// Trading Engine API Usage Examples (TypeScript)
import 'dotenv/config'
import {
    createWalletClient,
    http,
    getAddress,
    erc20Abi,
    createPublicClient,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import {
    base,
    optimism,
    zircuit,
    arbitrum,
    mainnet,
    baseSepolia,
    optimismSepolia,
    arbitrumSepolia,
    sepolia,
} from 'viem/chains'

const API_BASE_URL = 'https://trading.ai.zircuit.com/api/engine/v1'
const API_KEY = process.env.API_KEY
const PRIVATE_KEY = process.env.PRIVATE_KEY

const SUPPORTED_CHAINS = [
    base,
    optimism,
    zircuit,
    arbitrum,
    mainnet,
    baseSepolia,
    optimismSepolia,
    arbitrumSepolia,
    sepolia,
]

// Example request USDC -> ETH swap Base -> Zircuit
const QUOTE_REQUEST = {
    srcChainId: 8453, // Base Mainnet
    srcToken: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', // USDC
    srcAmountWei: '1000000', // 1 USDC (6 decimals)
    destToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // ETH
    destChainId: 48900, // Zircuit Mainnet
    slippageBps: 100,
    // userAccount: will be set in executeTrade
    // destReceiver: will be set in executeTrade
}

const getPublicClient = (chainId: number) => {
    const chain = SUPPORTED_CHAINS.find((c) => c.id === chainId)
    if (!chain) {
        throw new Error(`Unsupported chain: ${chainId}`)
    }
    return createPublicClient({ chain, transport: http() })
}

const getWalletClient = (chainId: number, account: any) => {
    const chain = SUPPORTED_CHAINS.find((c) => c.id === chainId)
    if (!chain) {
        throw new Error(`Unsupported chain: ${chainId}`)
    }
    return createWalletClient({
        chain,
        transport: http(),
        account,
    })
}

const isNativeToken = (tokenAddress: string) => {
    return getAddress(tokenAddress) ===
        getAddress('0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee')
}

async function waitUntilTradeIsCompleted(txHash: string): Promise<any> {
    const response = await getTradeStatus(txHash)
    if (
        response.status === 'SUCCESS' ||
        response.status === 'FAILED' ||
        response.status === 'REFUNDED' ||
        response.status === 'UNKNOWN'
    ) {
        return response
    }
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return waitUntilTradeIsCompleted(txHash)
}

async function getTradeStatus(txHash: string): Promise<any> {
    const response = await apiRequest(`/order/status?txHash=${txHash}`, {
        method: 'GET',
    })
    console.log('Trade status:', response.status)
    return response
}

async function getTradeEstimate(quoteRequest: any): Promise<any> {
    const response = await apiRequest('/order/estimate', {
        method: 'POST',
        body: JSON.stringify(quoteRequest),
    })

    console.log('Trade estimate:', response)

    const { trade, tx } = response.data
    console.log('Trade:', trade)

    return {
        tradeId: trade.tradeId,
        expectedAmount: trade.destTokenAmount,
        minExpectedAmount: trade.destTokenMinAmount,
        txData: tx,
        fees: trade.fees,
    }
}

async function approveTokenIfNeeded(
    tokenAddress: string,
    userAccount: any,
    spenderAddress: string,
    amount: string,
    chainId: number,
): Promise<string | null> {
    if (!PRIVATE_KEY) {
        throw new Error('PRIVATE_KEY environment variable not set')
    }

    if (isNativeToken(tokenAddress)) {
        console.log('Native token - no approval needed')
        return null
    }

    const publicClient = getPublicClient(chainId)

    const allowance = await publicClient.readContract({
        address: tokenAddress as any,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [userAccount.address, spenderAddress as any],
    })

    if (BigInt(allowance as any) >= BigInt(amount)) {
        console.log('Sufficient allowance already exists')
        return null
    }

    console.log('Insufficient allowance, sending approval transaction...')

    const walletClient = getWalletClient(chainId, userAccount)

    // Simulate approval before sending
    const { request } = await publicClient.simulateContract({
        account: userAccount,
        address: tokenAddress as any,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spenderAddress as any, BigInt(amount)],
    })

    const tx = await walletClient.writeContract(request)

    console.log('Approval transaction sent:', tx)

    await publicClient.waitForTransactionReceipt({ hash: tx })

    return tx as any
}

async function apiRequest(endpoint: string, options: RequestInit = {}) {
    if (!API_KEY) {
        throw new Error('API_KEY environment variable not set')
    }

    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
        ...(options.headers || {}),
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    })

    if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
            const errorData = JSON.parse(errorText)
            errorMessage = (errorData as any).error || (errorData as any).message || errorMessage
        } catch {
            errorMessage = errorText || errorMessage
        }
        throw new Error(errorMessage)
    }

    return response.json()
}

const executeTrade = async () => {
    if (!PRIVATE_KEY) {
        throw new Error('PRIVATE_KEY environment variable not set')
    }

    const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`)
    console.log('Trading with wallet address:', account.address)

    const quoteRequest = {
        ...QUOTE_REQUEST,
        userAccount: account.address,
        destReceiver: account.address,
    }

    console.log('Step 1: Getting trade estimate...')
    const estimate = await getTradeEstimate(quoteRequest)

    console.log('Fees:', estimate.fees)
    console.log('Expected amount:', estimate.expectedAmount)
    console.log('Min expected amount:', estimate.minExpectedAmount)
    console.log('In production, remember to check the min expected amount before executing/signing the trade!')

    console.log('Step 2: Checking token approval...')
    const spenderAddress = estimate.txData.to
    await approveTokenIfNeeded(
        quoteRequest.srcToken,
        account,
        spenderAddress,
        quoteRequest.srcAmountWei,
        quoteRequest.srcChainId,
    )

    console.log('Step 3: Executing trade...')
    const walletClient = getWalletClient(quoteRequest.srcChainId, account)

    const tx = await walletClient.sendTransaction({
        account,
        to: estimate.txData.to,
        value: BigInt(estimate.txData.value),
        data: estimate.txData.data,
    })

    console.log('✅ Trade executed successfully!')
    console.log('Transaction hash:', tx)

    const tradeStatus = await waitUntilTradeIsCompleted(tx)
    console.log('Final Trade status:', tradeStatus.status)

    return {
        success: true,
        txHash: tx,
        tradeId: estimate.tradeId,
        tradeStatus,
    }
}

executeTrade().catch((error) => {
    console.error('❌ Backend trade execution failed:', error)
    process.exitCode = 1
})



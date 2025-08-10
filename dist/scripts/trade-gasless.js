import 'dotenv/config';
import { createWalletClient, createPublicClient, encodeFunctionData, erc20Abi, getAddress, isAddress, http, } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arbitrum, arbitrumSepolia, base, baseSepolia, mainnet, optimism, optimismSepolia, sepolia, zircuit, } from 'viem/chains';
const API_BASE_URL = 'https://trading.ai.zircuit.com/api/engine/v1';
const API_KEY = process.env.API_KEY;
const USER_PRIVATE_KEY = process.env.PRIVATE_KEY;
const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY;
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
];
// Minimal ABI for GudEngine.execute((Trade))
// NOTE: This structure is inferred from docs. If contract shape differs, update fields accordingly.
const gudEngineAbi = [
    {
        type: 'function',
        name: 'execute',
        stateMutability: 'payable',
        inputs: [
            {
                name: 'trade',
                type: 'tuple',
                components: [
                    { name: 'tradeId', type: 'bytes32' },
                    { name: 'nonce', type: 'uint256' },
                    { name: 'userAccount', type: 'address' },
                    { name: 'destReceiver', type: 'address' },
                    { name: 'srcToken', type: 'address' },
                    { name: 'srcTokenAmount', type: 'uint256' },
                    { name: 'srcChainId', type: 'uint256' },
                    { name: 'destToken', type: 'address' },
                    { name: 'destTokenMinAmount', type: 'uint256' },
                    { name: 'destChainId', type: 'uint256' },
                    { name: 'adapter', type: 'address' },
                    { name: 'protocolNativeFee', type: 'uint256' },
                    { name: 'data', type: 'bytes' },
                    { name: 'deadline', type: 'uint256' },
                    {
                        name: 'fees',
                        type: 'tuple[]',
                        components: [
                            { name: 'bps', type: 'uint256' },
                            { name: 'recipient', type: 'address' },
                        ],
                    },
                    { name: 'guardianSignature', type: 'bytes' },
                    { name: 'signature', type: 'bytes' },
                ],
            },
        ],
        outputs: [],
    },
];
const isNativeToken = (tokenAddress) => getAddress(tokenAddress) ===
    getAddress('0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee');
const getPublicClient = (chainId) => {
    const chain = SUPPORTED_CHAINS.find((c) => c.id === chainId);
    if (!chain)
        throw new Error(`Unsupported chain: ${chainId}`);
    return createPublicClient({ chain, transport: http() });
};
const getWalletClient = (chainId, account) => {
    const chain = SUPPORTED_CHAINS.find((c) => c.id === chainId);
    if (!chain)
        throw new Error(`Unsupported chain: ${chainId}`);
    return createWalletClient({ chain, transport: http(), account });
};
// Example request USDC -> ETH swap Base -> Zircuit (ERC-20 input required for gasless)
const QUOTE_REQUEST = {
    srcChainId: 8453, // Base Mainnet
    srcToken: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', // USDC
    srcAmountWei: '1000000', // 1 USDC (6 decimals)
    destToken: '0x3b952c8C9C44e8Fe201e2b26F6B2200203214cfF', // USDC
    destChainId: 48900, // Zircuit Mainnet
    slippageBps: 100,
};
async function apiRequest(endpoint, options = {}) {
    if (!API_KEY)
        throw new Error('API_KEY environment variable not set');
    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
        ...(options.headers || {}),
    };
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.error || errorData.message || errorMessage;
            }
            catch {
                errorMessage = errorText || errorMessage;
            }
            throw new Error(errorMessage);
        }
        return response.json();
    }
    catch (error) {
        console.error('API Request failed:', error);
        throw error;
    }
}
async function getTradeStatus(txHash) {
    const response = await apiRequest(`/order/status?txHash=${txHash}`, { method: 'GET' });
    console.log('Trade status:', response.status);
    return response;
}
async function waitUntilTradeIsCompleted(txHash) {
    const response = await getTradeStatus(txHash);
    if (['SUCCESS', 'FAILED', 'REFUNDED', 'UNKNOWN'].includes(response.status))
        return response;
    await new Promise((r) => setTimeout(r, 1000));
    return waitUntilTradeIsCompleted(txHash);
}
async function getTradeEstimate(quoteRequest) {
    console.log('Quote request:', JSON.stringify(quoteRequest, null, 2));
    try {
        const response = await apiRequest('/order/estimate', {
            method: 'POST',
            body: JSON.stringify(quoteRequest),
        });
        if (!response?.data)
            throw new Error('No data in response');
        const { trade, tx } = response.data;
        if (!trade || !tx)
            throw new Error('Invalid response structure');
        return {
            tradeId: trade.tradeId,
            expectedAmount: trade.destTokenAmount,
            minExpectedAmount: trade.destTokenMinAmount,
            txData: tx,
            fees: trade.fees,
            eip712: trade.eip712, // crucial for gasless
        };
    }
    catch (error) {
        console.error('Trade estimate error:', error);
        throw error;
    }
}
// Address normalization for potentially padded/duplicated-0x inputs from some providers
const normalizeAndChecksumAddress = (value) => {
    if (!value)
        throw new Error('Empty address');
    let addr = value;
    if (addr.startsWith('0x0x'))
        addr = '0x' + addr.slice(4); // remove duplicated 0x
    // If 32-byte padded (0x + 24 zeros + 40-hex)
    const noPrefix = addr.slice(2);
    if (/^0{24}[0-9a-fA-F]{40}$/.test(noPrefix)) {
        addr = '0x' + noPrefix.slice(-40);
    }
    if (!isAddress(addr))
        throw new Error(`Invalid address: ${addr}`);
    return getAddress(addr);
};
async function checkTokenApproval(tokenAddress, userAccount, spenderAddress, amount, chainId) {
    if (isNativeToken(tokenAddress))
        return { needsApproval: false };
    const publicClient = getPublicClient(chainId);
    const allowance = await publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [userAccount.address, spenderAddress],
    });
    const hasAllowance = BigInt(allowance) >= BigInt(amount);
    return { needsApproval: !hasAllowance };
}
async function signTradeData(walletClient, eip712Data) {
    const signature = await walletClient.signTypedData({
        types: eip712Data.types,
        domain: eip712Data.domain,
        message: eip712Data.message,
        primaryType: eip712Data.primaryType,
    });
    return signature;
}
async function executeGaslessTrade(estimate, userSignature, relayerClient) {
    const tradeStruct = {
        ...estimate.eip712.message,
        signature: userSignature,
        userAccount: normalizeAndChecksumAddress(estimate.eip712.message.userAccount),
        destReceiver: normalizeAndChecksumAddress(estimate.eip712.message.destReceiver),
        srcToken: normalizeAndChecksumAddress(estimate.eip712.message.srcToken),
        destToken: normalizeAndChecksumAddress(estimate.eip712.message.destToken),
        adapter: normalizeAndChecksumAddress(estimate.eip712.message.adapter),
    };
    const calldata = encodeFunctionData({
        abi: gudEngineAbi,
        functionName: 'execute',
        args: [tradeStruct],
    });
    const txHash = await relayerClient.sendTransaction({
        to: normalizeAndChecksumAddress(estimate.txData.to),
        data: calldata,
        value: BigInt(estimate.txData.value ?? 0),
    });
    return txHash;
}
const executeTradeGasless = async () => {
    if (!USER_PRIVATE_KEY)
        throw new Error('PRIVATE_KEY not set');
    if (!RELAYER_PRIVATE_KEY)
        throw new Error('RELAYER_PRIVATE_KEY not set');
    // Validate private key format and normalize to 0x + 64 hex
    const formatPrivateKey = (key) => {
        const k = key.startsWith('0x') ? key : `0x${key}`;
        if (k.length !== 66)
            throw new Error(`Invalid private key length: ${k.length}. Expected 66 including 0x`);
        return k;
    };
    const userAccount = privateKeyToAccount(formatPrivateKey(USER_PRIVATE_KEY));
    const relayerAccount = privateKeyToAccount(formatPrivateKey(RELAYER_PRIVATE_KEY));
    const quoteRequest = {
        ...QUOTE_REQUEST,
        userAccount: userAccount.address,
        destReceiver: userAccount.address,
    };
    console.log('Step 1: Getting trade estimate...');
    const estimate = await getTradeEstimate(quoteRequest);
    if (!estimate.eip712) {
        console.log('❌ Gasless execution not available (likely native ETH as source).');
        console.log('Please use scripts/trade.ts for direct execution or switch to an ERC-20 source token.');
        return;
    }
    console.log('Step 2: Check token approval (informational)...');
    const approval = await checkTokenApproval(quoteRequest.srcToken, userAccount, estimate.txData.to, quoteRequest.srcAmountWei, quoteRequest.srcChainId);
    if (approval.needsApproval) {
        console.warn('⚠️  User allowance is insufficient. Approvals require on-chain tx from the user.');
        console.warn('    Consider using EIP-2612 permit for fully gasless approvals, or pre-approve GudEngine.');
    }
    console.log('Step 3: User signs EIP-712 trade data...');
    const userWallet = getWalletClient(quoteRequest.srcChainId, userAccount);
    const signature = await signTradeData(userWallet, estimate.eip712);
    console.log('Step 4: Relayer executes trade...');
    const relayerWallet = getWalletClient(estimate.txData.chainId || quoteRequest.srcChainId, relayerAccount);
    const tx = await executeGaslessTrade(estimate, signature, relayerWallet);
    console.log('✅ Gasless trade submitted! Hash:', tx);
    const status = await waitUntilTradeIsCompleted(tx);
    console.log('Final Trade status:', status.status);
};
executeTradeGasless().catch((err) => {
    console.error('❌ Gasless trade execution failed:', err);
    process.exitCode = 1;
});

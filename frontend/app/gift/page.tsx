'use client';
import { useEffect, useMemo, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useMiniKit, useOpenUrl, useNotification, useAddFrame, useComposeCast, usePrimaryButton } from '@coinbase/onchainkit/minikit';
import { Button } from '@/components/ui/Button'
import { formatEther, parseEther } from 'viem';
import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { giftVaultABI } from '../../src/libs/giftVaultABI';
import { coreTestnet } from '../../src/libs/coreChain';

export default function GiftPage() {
  const { setFrameReady, isFrameReady } = useMiniKit();
  const addFrame = useAddFrame();
  const { composeCast } = useComposeCast();
  const notify = useNotification();
  const openUrl = useOpenUrl();
  const [receiver, setReceiver] = useState('');
  const [amount, setAmount] = useState('0.01');
  const [message, setMessage] = useState('Happy Birthday!');
  const [category, setCategory] = useState('birthday');
  const [contractAddress, setContractAddress] = useState<string>(process.env.NEXT_PUBLIC_GIFT_VAULT_ADDRESS || '');

  const { address: userAddress } = useAccount();
  const { data: nextGiftId } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: giftVaultABI,
    functionName: 'nextGiftId',
    chainId: coreTestnet.id,
    query: { enabled: Boolean(contractAddress) },
  });

  const [writeHash, setWriteHash] = useState<`0x${string}` | undefined>();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: writeHash });
  const { writeContractAsync } = useWriteContract();

  if (!isFrameReady) setFrameReady();

  // Set a MiniKit primary button to trigger send action when embedded
  usePrimaryButton(
    { text: 'Send Gift' },
    () => {
      if (!isConfirming) createGift();
    },
  )

  const createGift = async () => {
    if (!contractAddress) return alert('Set NEXT_PUBLIC_GIFT_VAULT_ADDRESS');
    try {
      const hash = await writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi: giftVaultABI,
        functionName: 'createGift',
        args: [receiver as `0x${string}`, message, category],
        value: parseEther(amount || '0'),
        chainId: coreTestnet.id,
      });
      setWriteHash(hash);
      await notify({ title: '🎁 Gift created', body: `To: ${receiver} | ${message}` });
      // Offer quick share on Farcaster
      try {
        composeCast({ text: `I just sent a LotusGift to ${receiver}! 🎁 ${amount} ETH — ${message}` });
      } catch {}
    } catch (e: any) {
      alert(e?.shortMessage || e?.message || String(e));
    }
  };

  const claimGift = async (giftId: bigint) => {
    if (!contractAddress) return;
    try {
      const hash = await writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi: giftVaultABI,
        functionName: 'claimGift',
        args: [giftId],
        chainId: coreTestnet.id,
      });
      setWriteHash(hash);
    } catch (e: any) {
      alert(e?.shortMessage || e?.message || String(e));
    }
  };

  const withdrawAll = async () => {
    if (!contractAddress) return;
    try {
      const hash = await writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi: giftVaultABI,
        functionName: 'withdraw',
        args: [userAddress as `0x${string}`],
        chainId: coreTestnet.id,
      });
      setWriteHash(hash);
    } catch (e: any) {
      alert(e?.shortMessage || e?.message || String(e));
    }
  };

  const { data: giftsToShow } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: giftVaultABI,
    functionName: 'nextGiftId',
    chainId: coreTestnet.id,
    query: { enabled: Boolean(contractAddress) },
  });

  const giftIds = useMemo(() => {
    if (!giftsToShow) return [] as bigint[];
    const n = Number(giftsToShow as bigint);
    return Array.from({ length: n }, (_, i) => BigInt(i));
  }, [giftsToShow]);

  const { data: giftsData } = useReadContracts({
    contracts: giftIds.map((id) => ({
      address: contractAddress as `0x${string}`,
      abi: giftVaultABI,
      functionName: 'gifts' as const,
      args: [id] as const,
      chainId: coreTestnet.id,
    })),
    query: { enabled: Boolean(contractAddress) && giftIds.length > 0 },
  });

  return (
    <main className="max-w-xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">LotusGift</h1>
        <ConnectButton />
      </div>
      <p className="text-neutral-600">Send a message-attached micro-gift</p>
      <div className="text-xs text-neutral-500">Contract: {contractAddress || '(set NEXT_PUBLIC_GIFT_VAULT_ADDRESS)'}</div>

      <div className="grid gap-3 mt-4">
        <input className="border border-neutral-200 rounded-md p-2" placeholder="Receiver (0x...)" value={receiver} onChange={(e) => setReceiver(e.target.value)} />
        <input className="border border-neutral-200 rounded-md p-2" placeholder="Amount (ETH)" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <input className="border border-neutral-200 rounded-md p-2" placeholder="Message" value={message} onChange={(e) => setMessage(e.target.value)} />
        <input className="border border-neutral-200 rounded-md p-2" placeholder="Category (birthday)" value={category} onChange={(e) => setCategory(e.target.value)} />
        <Button className="bg-neutral-900 text-white cursor-pointer" onClick={createGift} disabled={isConfirming}>Send Gift</Button>
        <div className="flex gap-2">
          <Button variant="outline" className="cursor-pointer" onClick={() => addFrame().catch(() => {})}>Add to MiniKit</Button>
          <Button variant="outline" className="cursor-pointer" onClick={() => openUrl('https://base.org/builders/minikit')}>Learn MiniKit</Button>
        </div>
      </div>

      <hr className="my-6 border-neutral-200" />
      <h3 className="font-medium mb-2">My Incoming Gifts</h3>
      <div className="grid gap-2">
        {giftIds.map((id, idx) => {
          const res = giftsData?.[idx];
          const data = (res as any)?.result as
            | [
            `0x${string}`,
            `0x${string}`,
            bigint,
            string,
            string,
            boolean,
            bigint,
            ]
            | undefined;
          if (!data) return null;
          const [sender, receiverAddr, amountWei, messageStr, categoryStr, hasClaimed] = data;
          if (userAddress?.toLowerCase() !== receiverAddr.toLowerCase()) return null;
          return (
            <div key={String(id)} className="flex items-center gap-2">
              <div className="flex-1 text-sm">
                #{String(id)} from {sender.slice(0, 6)}… → {formatEther(amountWei)} ETH — {messageStr} [{categoryStr}] {hasClaimed ? '✅' : ''}
              </div>
              {!hasClaimed && <Button className="cursor-pointer" onClick={() => claimGift(id)}>Claim</Button>}
            </div>
          );
        })}
      </div>

      <hr className="my-6 border-neutral-200" />
      <h3 className="font-medium mb-2">Admin</h3>
      <div className="flex gap-2">
        <Button className="bg-red-600 text-white cursor-pointer" onClick={withdrawAll}>Withdraw All</Button>
      </div>
    </main>
  );
}


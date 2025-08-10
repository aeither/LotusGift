'use client';
import { useEffect, useMemo, useState } from 'react';
import { useMiniKit, useOpenUrl, useNotification } from '@coinbase/onchainkit/minikit';
import { formatEther, parseEther } from 'viem';
import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { giftVaultABI } from '../../src/libs/giftVaultABI';
import { coreTestnet } from '../../src/libs/coreChain';

export default function GiftPage() {
  const { setFrameReady, isFrameReady } = useMiniKit();
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
    <main style={{ padding: 16, maxWidth: 520, margin: '0 auto' }}>
      <h1>LotusGift</h1>
      <p style={{ opacity: 0.8 }}>Send a message-attached micro-gift</p>
      <div style={{ fontSize: 12, opacity: 0.7 }}>Contract: {contractAddress || '(set NEXT_PUBLIC_GIFT_VAULT_ADDRESS)'}</div>

      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        <input placeholder="Receiver (0x...)" value={receiver} onChange={(e) => setReceiver(e.target.value)} />
        <input placeholder="Amount (ETH)" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <input placeholder="Message" value={message} onChange={(e) => setMessage(e.target.value)} />
        <input placeholder="Category (birthday)" value={category} onChange={(e) => setCategory(e.target.value)} />
        <button onClick={createGift} disabled={isConfirming}>Send Gift</button>
        <button onClick={() => openUrl('https://base.org/builders/minikit')}>Learn MiniKit</button>
      </div>

      <hr style={{ margin: '24px 0', opacity: 0.2 }} />
      <h3>My Incoming Gifts</h3>
      <div style={{ display: 'grid', gap: 8 }}>
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
            <div key={String(id)} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ flex: 1, fontSize: 13 }}>
                #{String(id)} from {sender.slice(0, 6)}… → {formatEther(amountWei)} CORE — {messageStr} [{categoryStr}] {hasClaimed ? '✅' : ''}
              </div>
              {!hasClaimed && <button onClick={() => claimGift(id)}>Claim</button>}
            </div>
          );
        })}
      </div>

      <hr style={{ margin: '24px 0', opacity: 0.2 }} />
      <h3>Admin</h3>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={withdrawAll}>Withdraw All</button>
      </div>
    </main>
  );
}


'use client';
import { useState } from 'react';
import { useMiniKit, useOpenUrl, useNotification } from '@coinbase/onchainkit/minikit';

export default function GiftPage() {
  const { setFrameReady, isFrameReady } = useMiniKit();
  const notify = useNotification();
  const openUrl = useOpenUrl();
  const [receiver, setReceiver] = useState('');
  const [amount, setAmount] = useState('0.01');
  const [message, setMessage] = useState('Happy Birthday!');
  const [category, setCategory] = useState('birthday');

  if (!isFrameReady) setFrameReady();

  const fakeSend = async () => {
    // Placeholder UI; integrate wagmi writeContract once address & abi are wired
    await notify({ title: '🎁 New gift waiting!', body: `To: ${receiver} | ${message}` });
    alert(`Simulated gift: ${amount} ETH → ${receiver} | ${message} [${category}]`);
  };

  return (
    <main style={{ padding: 16, maxWidth: 520, margin: '0 auto' }}>
      <h1>GiftVault</h1>
      <p style={{ opacity: 0.8 }}>Send a message-attached micro-gift</p>

      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        <input placeholder="Receiver (0x...)" value={receiver} onChange={(e) => setReceiver(e.target.value)} />
        <input placeholder="Amount (ETH)" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <input placeholder="Message" value={message} onChange={(e) => setMessage(e.target.value)} />
        <input placeholder="Category (birthday)" value={category} onChange={(e) => setCategory(e.target.value)} />
        <button onClick={fakeSend}>Send Gift</button>
        <button onClick={() => openUrl('https://base.org/builders/minikit')}>Learn MiniKit</button>
      </div>
    </main>
  );
}


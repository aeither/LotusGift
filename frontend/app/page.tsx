'use client';
import { useEffect } from 'react';
import { useMiniKit, useAddFrame, useOpenUrl, useClose, useNotification, useViewProfile } from '@coinbase/onchainkit/minikit';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Hero from '@/components/Hero';
import EnvelopeCard from '@/components/EnvelopeCard';
import CatRain from '@/components/CatRain';
import GiftForm from '@/components/GiftForm';
import { useState } from 'react';

export default function HomePage() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const addFrame = useAddFrame();
  const openUrl = useOpenUrl();
  const close = useClose();
  const sendNotification = useNotification();
  const viewProfile = useViewProfile();

  const handleAddFrame = async () => {
    try {
      const result = await addFrame();
      if (result?.url) {
        console.log('Mini App added:', result.url);
      }
    } catch (e) {
      console.error('AddFrame failed', e);
    }
  };

  const handleViewProfile = () => {
    try {
      viewProfile();
    } catch (e) {
      console.error('ViewProfile failed', e);
    }
  };

  useEffect(() => {
    if (!isFrameReady) setFrameReady();
  }, [isFrameReady, setFrameReady]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed bottom-2 right-2 opacity-80 scale-90 md:scale-100">
        <CatRain />
      </div>
      <header className="container py-4">
        <nav className="flex items-center justify-between">
          <a href="#" className="font-semibold text-lg relative">LotusGift</a>
          <div className="flex items-center gap-3">
            <a href="#gift" className="text-sm relative">Create gift</a>
            <button onClick={handleAddFrame} className="text-sm relative underline-offset-2 hover:underline">Add to MiniKit</button>
            <button onClick={handleViewProfile} className="text-sm relative underline-offset-2 hover:underline">My Profile</button>
          </div>
        </nav>
      </header>

      <main id="content">
        <Hero onStart={() => document.getElementById('gift')?.scrollIntoView({ behavior: 'smooth' })} />

        <section id="gift" aria-labelledby="gift-title" className="animate-enter container pb-10">
          <h1 id="gift-title" className="sr-only">Lì xì – Mobile Gifting App</h1>
          <div className="grid gap-6 md:grid-cols-2">
            <EnvelopeCard />
            <div className="grid gap-4 content-start">
              <GiftForm />
              <Link href="/gift" className="bg-white border border-neutral-200 rounded-md py-3 text-center">View/Claim Gifts</Link>
              <AIGiftMessageGenerator />
            </div>
          </div>
        </section>
      </main>

      <footer className="container py-10 text-center text-xs text-neutral-500">© {new Date().getFullYear()} Lì xì • Made with love</footer>
    </div>
  );
}

function AIGiftMessageGenerator() {
  const [recipient, setRecipient] = useState('Emily')
  const [amount, setAmount] = useState('25')
  const [currency, setCurrency] = useState('USDC')
  const [category, setCategory] = useState('birthday')
  const [message, setMessage] = useState('Wishing you a wonderful year ahead—treat yourself to something fun! 🎉')
  const [sender, setSender] = useState('Alex')
  const [result, setResult] = useState<{ subject: string; text: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/gift-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient, amount, currency, category, message, sender }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setResult({ subject: data.subject, text: data.text })
    } catch (e: any) {
      setError(e?.message || 'Failed to generate message')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-neutral-200 rounded-md p-3 bg-white">
      <div className="text-sm font-medium mb-2">AI Gift Message</div>
      <div className="grid gap-2">
        <input className="border border-neutral-200 rounded-md p-2" placeholder="Recipient" value={recipient} onChange={(e) => setRecipient(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <input className="border border-neutral-200 rounded-md p-2" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <input className="border border-neutral-200 rounded-md p-2" placeholder="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} />
        </div>
        <input className="border border-neutral-200 rounded-md p-2" placeholder="Category (birthday)" value={category} onChange={(e) => setCategory(e.target.value)} />
        <textarea className="border border-neutral-200 rounded-md p-2" placeholder="Optional custom message or leave as-is" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
        <input className="border border-neutral-200 rounded-md p-2" placeholder="Sender" value={sender} onChange={(e) => setSender(e.target.value)} />
        <button onClick={generate} disabled={loading} className="rounded-md bg-neutral-900 text-white px-3 py-2 disabled:opacity-50">
          {loading ? 'Generating…' : 'Generate'}
        </button>
        {error && <div className="text-red-600 text-xs">{error}</div>}
        {result && (
          <div className="grid gap-1 text-sm">
            <div className="font-medium">Subject</div>
            <div className="border border-neutral-200 rounded-md p-2 bg-neutral-50 break-words">{result.subject}</div>
            <div className="font-medium mt-2">Message</div>
            <div className="border border-neutral-200 rounded-md p-2 bg-neutral-50 break-words whitespace-pre-wrap">{result.text}</div>
          </div>
        )}
      </div>
    </div>
  )
}


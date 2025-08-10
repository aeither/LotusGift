'use client';
import { useEffect } from 'react';
import { useMiniKit, useAddFrame, useOpenUrl, useClose, useNotification, useViewProfile } from '@coinbase/onchainkit/minikit';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Hero from '@/components/Hero';
import EnvelopeCard from '@/components/EnvelopeCard';
import CatRain from '@/components/CatRain';

export default function HomePage() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const addFrame = useAddFrame();
  const openUrl = useOpenUrl();
  const close = useClose();
  const sendNotification = useNotification();
  const viewProfile = useViewProfile();

  useEffect(() => {
    if (!isFrameReady) setFrameReady();
  }, [isFrameReady, setFrameReady]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <CatRain />
      <header className="container py-4">
        <nav className="flex items-center justify-between">
          <a href="#" className="font-semibold text-lg relative">Lì xì</a>
          <div className="flex items-center gap-3">
            <a href="#gift" className="text-sm relative">Tạo phong bao</a>
            <ConnectButton />
          </div>
        </nav>
      </header>

      <main id="content">
        <Hero onStart={() => document.getElementById('gift')?.scrollIntoView({ behavior: 'smooth' })} />

        <section id="gift" aria-labelledby="gift-title" className="animate-enter container pb-10">
          <h1 id="gift-title" className="sr-only">Lì xì – Mobile Gifting App</h1>
          <div className="grid gap-6 md:grid-cols-2">
            <EnvelopeCard />
            <div className="grid gap-3 content-start">
              <Link href="/gift" className="bg-red-600 text-white rounded-md py-3 text-center">Bắt đầu tặng lì xì</Link>
              <button className="bg-white border border-neutral-200 rounded-md py-3" onClick={() => openUrl('https://base.org/builders/minikit')}>Built with MiniKit</button>
            </div>
          </div>
        </section>
      </main>

      <footer className="container py-10 text-center text-xs text-neutral-500">© {new Date().getFullYear()} Lì xì • Made with love</footer>
    </div>
  );
}


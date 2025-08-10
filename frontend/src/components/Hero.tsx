'use client'

import Image from 'next/image'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export default function Hero({ onStart }: { onStart: () => void }) {
  return (
    <section className="container mx-auto grid gap-6 py-10 md:py-16">
      <div className="mx-auto text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-600">
          🎋 Tết gifting, onchain
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Lì xì on Zircuit
        </h1>
        <p className="mt-2 max-w-xl mx-auto text-neutral-600">
          Send lucky red envelopes with a message. Simple, fast, and secure.
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <button onClick={onStart} className="rounded-md bg-red-600 text-white px-4 py-2">
            Create Envelope
          </button>
          <ConnectButton />
        </div>
      </div>
      <div className="relative mx-auto aspect-[3/2] w-full max-w-2xl overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <Image src="/zircuit-cat.png" alt="Lucky cat" fill className="object-cover" priority />
      </div>
    </section>
  )
}



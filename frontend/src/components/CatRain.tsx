'use client'

import { useMemo } from 'react'

const CAT_SRC = '/zircuit-cat.png'

type RainSpec = {
  left: number
  size: number
  duration: number
  delay: number
  sway: number
}

const randomIn = (min: number, max: number) => Math.random() * (max - min) + min

const CatRain = () => {
  const count = typeof window !== 'undefined' && window.innerWidth > 768 ? 22 : 14

  const specs = useMemo<RainSpec[]>(
    () =>
      Array.from({ length: count }).map(() => ({
        left: randomIn(0, 100),
        size: Math.round(randomIn(24, 48)),
        duration: randomIn(10, 18),
        delay: randomIn(0, 8),
        sway: randomIn(3, 6),
      })),
    [count],
  )

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {specs.map((c, i) => (
        <div
          key={i}
          className="absolute -top-12 will-change-transform"
          style={{ left: `${c.left}vw`, animation: `cat-sway ${c.sway}s ease-in-out ${c.delay / 2}s infinite` }}
        >
          <img
            src={CAT_SRC}
            alt=""
            aria-hidden="true"
            className="block select-none"
            style={{ width: `${c.size}px`, height: 'auto', animation: `cat-fall ${c.duration}s linear ${c.delay}s infinite` }}
            decoding="async"
            draggable={false}
          />
        </div>
      ))}
      <style jsx>{`
        @keyframes cat-fall {
          from { transform: translateY(-10vh); opacity: 0; }
          to { transform: translateY(110vh); opacity: 1; }
        }
        @keyframes cat-sway {
          0% { transform: translateX(-10px); }
          50% { transform: translateX(10px); }
          100% { transform: translateX(-10px); }
        }
      `}</style>
    </div>
  )
}

export default CatRain



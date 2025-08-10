'use client'

import { toast } from 'sonner'

export default function PromiseToast() {
  return (
    <button
      className="rounded-md bg-neutral-900 text-white px-3 py-2"
      onClick={() => {
        const myPromise = new Promise<{ name: string }>((resolve) => {
          setTimeout(() => {
            resolve({ name: 'My toast' })
          }, 3000)
        })

        toast.promise(myPromise, {
          loading: 'Loading...',
          success: (data: { name: string }) => `${data.name} toast has been added`,
          error: 'Error',
        })
      }}
    >
      Render toast
    </button>
  )
}



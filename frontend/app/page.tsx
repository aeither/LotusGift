'use client';
import { useEffect } from 'react';
import { useMiniKit, useAddFrame, useOpenUrl, useClose, useNotification, useViewProfile } from '@coinbase/onchainkit/minikit';

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
    <main style={{ padding: 16 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>{process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'MiniKit App'}</strong>
        <div>
          <button onClick={async () => console.log('Frame added:', await addFrame())}>Save</button>
          <button onClick={close} style={{ marginLeft: 8 }}>Close</button>
          <button onClick={() => viewProfile()} style={{ marginLeft: 8 }}>Profile</button>
        </div>
      </header>

      <section style={{ marginTop: 24 }}>
        <p>Launch context: {String(context?.location ?? 'standalone')}</p>
        <button onClick={() => openUrl('https://base.org/builders/minikit')}>Built with MiniKit</button>
      </section>

      {context?.client?.added && (
        <section style={{ marginTop: 24 }}>
          <button
            onClick={() =>
              sendNotification({ title: 'Test Notification', body: 'Hello from MiniKit!' })
            }
          >
            Send Notification
          </button>
        </section>
      )}
    </main>
  );
}


'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  useMiniKit,
  useAddFrame,
  useNotification,
  useOpenUrl,
  useClose,
  useComposeCast,
  useViewCast,
  usePrimaryButton,
  useViewProfile,
  useAuthenticate,
} from '@coinbase/onchainkit/minikit'

export default function MiniKitDemoPage() {
  const { setFrameReady, isFrameReady, context, notificationProxyUrl } = useMiniKit()
  const addFrame = useAddFrame()
  const sendNotification = useNotification()
  const openUrl = useOpenUrl()
  const closeApp = useClose()
  const { composeCast } = useComposeCast()
  const { viewCast } = useViewCast()
  const viewMyProfile = useViewProfile()
  const [fidToView, setFidToView] = useState('')
  const viewUserProfile = useViewProfile(fidToView ? Number(fidToView) : undefined as any)
  const { signIn } = useAuthenticate()

  const [frameInfo, setFrameInfo] = useState<string>('')
  const [addFrameToken, setAddFrameToken] = useState<string>('')
  const [addFrameUrl, setAddFrameUrl] = useState<string>('')
  const [castHash, setCastHash] = useState<string>('')
  const [authResult, setAuthResult] = useState<string>('')
  const [notificationStatus, setNotificationStatus] = useState<string>('')

  // Configure a primary button (shown in Farcaster client)
  usePrimaryButton(
    { text: 'Primary: Demo Action' },
    () => {
      alert('Primary button clicked!')
    },
  )

  useEffect(() => {
    if (!isFrameReady) setFrameReady()
  }, [isFrameReady, setFrameReady])

  useEffect(() => {
    setFrameInfo(
      JSON.stringify(
        {
          isFrameReady,
          hasContext: Boolean(context),
          notificationProxyUrl,
        },
        null,
        2,
      ),
    )
  }, [isFrameReady, context, notificationProxyUrl])

  const handleAddFrame = async () => {
    const result = await addFrame()
    if (result) {
      setAddFrameUrl(result.url)
      setAddFrameToken(result.token)
    }
  }

  const handleSendNotification = async () => {
    try {
      await sendNotification({ title: 'LotusGift', body: 'MiniKit Notification: Hello from the demo page!' })
      setNotificationStatus('Sent ✅')
    } catch (e: any) {
      setNotificationStatus(`Failed ❌ ${e?.message || e}`)
    }
  }

  const handleCompose = () => {
    composeCast({ text: 'Building Mini Apps with MiniKit on Base! 🌱' })
  }

  const handleComposeWithEmbed = () => {
    composeCast({ text: 'Check out this frame!', embeds: ['https://warpcast.com/'] })
  }

  const handleViewCast = () => {
    if (!castHash) return alert('Enter a cast hash')
    viewCast({ hash: castHash })
  }

  const handleAuth = async () => {
    try {
      const domain = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
      const siweUri = typeof window !== 'undefined' ? `${window.location.origin}/login` : 'http://localhost:3000/login'
      const res = await signIn({ domain, siweUri })
      setAuthResult(res ? 'Authenticated ✅' : 'Cancelled / No result')
    } catch (e: any) {
      setAuthResult(`Auth error: ${e?.message || e}`)
    }
  }

  const Section: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
    <section style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, display: 'grid', gap: 8 }}>
      <div style={{ display: 'grid', gap: 4 }}>
        <strong>{title}</strong>
        <span style={{ opacity: 0.7, fontSize: 14 }}>{description}</span>
      </div>
      <div>{children}</div>
    </section>
  )

  const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => (
    <button
      {...props}
      style={{
        padding: '8px 12px',
        border: '1px solid #e5e7eb',
        borderRadius: 6,
        background: '#f9fafb',
        color: '#111827',
        cursor: 'pointer',
      }}
    />
  )

  return (
    <main style={{ padding: 16, maxWidth: 880, margin: '0 auto', display: 'grid', gap: 16 }}>
      <h1>MiniKit Demo</h1>
      <p style={{ opacity: 0.8 }}>Quickly test MiniKit hooks inside LotusGift</p>

      <Section
        title="Provider & Context"
        description="Shows readiness and available context provided by MiniKitProvider. Call setFrameReady() when the UI is ready."
      >
        <pre style={{ background: '#0b1020', color: '#e6edf3', padding: 12, borderRadius: 8, overflow: 'auto' }}>{frameInfo}</pre>
      </Section>

      <div style={{ display: 'grid', gap: 16 }}>
        <Section
          title="Add Frame"
          description="Adds this Mini App to the user's list and returns notification details (url/token)."
        >
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button onClick={handleAddFrame}>Add Frame</Button>
            {addFrameUrl && (
              <div style={{ fontSize: 12 }}>
                url: <code>{addFrameUrl}</code>
              </div>
            )}
            {addFrameToken && (
              <div style={{ fontSize: 12 }}>
                token: <code title={addFrameToken}>{addFrameToken.slice(0, 12)}…</code>
              </div>
            )}
          </div>
        </Section>

        <Section
          title="Notifications"
          description="Sends a notification via the configured backend proxy (defaults to /api/notification)."
        >
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button onClick={handleSendNotification}>Send Notification</Button>
            <span style={{ fontSize: 12, opacity: 0.8 }}>{notificationStatus}</span>
          </div>
        </Section>

        <Section title="Open URL" description="Opens a URL using MiniKit (falls back to window.open outside a frame).">
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={() => openUrl('https://base.org/builders/minikit')}>Open MiniKit Docs</Button>
            <Button onClick={() => openUrl('https://onchainkit.xyz')}>Open OnchainKit</Button>
          </div>
        </Section>

        <Section title="Close App" description="Closes the Mini App when embedded in a MiniKit-compatible client.">
          <Button onClick={closeApp}>Close</Button>
        </Section>

        <Section title="Compose Cast" description="Opens Farcaster compose with text or embed.">
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={handleCompose}>Compose Text</Button>
            <Button onClick={handleComposeWithEmbed}>Compose with Embed</Button>
          </div>
        </Section>

        <Section title="View Cast" description="Views a specific cast by its hash.">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              placeholder="Cast hash (0x...)"
              value={castHash}
              onChange={(e) => setCastHash(e.target.value)}
              style={{ flex: 1, padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }}
            />
            <Button onClick={handleViewCast}>View Cast</Button>
          </div>
        </Section>

        <Section title="Primary Button" description="Sets a primary button inside the Farcaster host UI for this Mini App.">
          <span style={{ fontSize: 12, opacity: 0.8 }}>Configured: "Primary: Demo Action"</span>
        </Section>

        <Section title="View Profile" description="Opens profiles using MiniKit (your own FID or a specific FID).">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button onClick={viewMyProfile}>View My Profile</Button>
            <input
              placeholder="FID"
              value={fidToView}
              onChange={(e) => setFidToView(e.target.value)}
              style={{ width: 160, padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }}
            />
            <Button onClick={viewUserProfile}>View User Profile</Button>
          </div>
        </Section>

        <Section title="Authenticate" description="Sign in with Farcaster (SIWE-like). Display basic result.">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button onClick={handleAuth}>Sign In</Button>
            <span style={{ fontSize: 12, opacity: 0.8 }}>{authResult}</span>
          </div>
        </Section>
      </div>
    </main>
  )
}



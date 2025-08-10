import { NextRequest } from 'next/server'

// Proxy to Bitte agent API. Configure your Bitte backend base URL if needed.
const BITTE_API_BASE = process.env.BITTE_API_BASE || 'https://api.bitte.ai'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const res = await fetch(`${BITTE_API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.BITTE_API_KEY || ''}` },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return Response.json(data, { status: res.status })
  } catch (e: any) {
    return new Response(e?.message || 'Bad request', { status: 400 })
  }
}



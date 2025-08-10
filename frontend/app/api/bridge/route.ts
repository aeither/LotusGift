import { NextRequest } from 'next/server'

const ENGINE_API_BASE = process.env.ZIRCUIT_ENGINE_API_BASE || 'https://trading.ai.zircuit.com/api/engine/v1'
const ENGINE_API_KEY = process.env.ZIRCUIT_ENGINE_API_KEY

export async function POST(req: NextRequest) {
  try {
    const { path, payload, txHash } = await req.json()
    if (!ENGINE_API_KEY) return new Response('Missing server API key', { status: 500 })

    let url = `${ENGINE_API_BASE}`
    let method: 'POST' | 'GET' = 'POST'
    let body: any = undefined

    if (path === 'order/estimate') {
      url += '/order/estimate'
      method = 'POST'
      body = JSON.stringify(payload)
    } else if (path === 'order/status') {
      if (!txHash) return new Response('txHash required', { status: 400 })
      url += `/order/status?txHash=${encodeURIComponent(txHash)}`
      method = 'GET'
    } else {
      return new Response('Unsupported path', { status: 400 })
    }

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ENGINE_API_KEY}`,
      },
      body,
      cache: 'no-store',
    })

    const text = await res.text()
    const out = (() => { try { return JSON.parse(text) } catch { return { raw: text } } })()
    return Response.json(out, { status: res.status })
  } catch (e: any) {
    return new Response(e?.message || 'Bad request', { status: 400 })
  }
}

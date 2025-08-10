import { NextRequest } from 'next/server'
import { engineEstimate, engineStatus } from '@/libs/engine'

const ENGINE_API_BASE = process.env.ZIRCUIT_ENGINE_API_BASE || 'https://trading.ai.zircuit.com/api/engine/v1'
const ENGINE_API_KEY = process.env.ZIRCUIT_ENGINE_API_KEY

export async function POST(req: NextRequest) {
  try {
    const { path, payload, txHash } = await req.json()
    if (!ENGINE_API_KEY) {
      console.error('bridge: missing ZIRCUIT_ENGINE_API_KEY')
      return new Response('Missing server API key', { status: 500 })
    }

    if (path === 'order/estimate') {
      console.log('bridge: estimate payload →', payload)
      const { data, status } = await engineEstimate({ baseUrl: ENGINE_API_BASE, apiKey: ENGINE_API_KEY }, payload)
      return Response.json(data, { status })
    } else if (path === 'order/status') {
      if (!txHash) return new Response('txHash required', { status: 400 })
      const { data, status } = await engineStatus({ baseUrl: ENGINE_API_BASE, apiKey: ENGINE_API_KEY }, txHash)
      return Response.json(data, { status })
    } else {
      console.error('bridge: unsupported path', path)
      return new Response('Unsupported path', { status: 400 })
    }
  } catch (e: any) {
    console.error('bridge: handler error', e)
    return new Response(e?.message || 'Bad request', { status: 400 })
  }
}

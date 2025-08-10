import { NextRequest } from 'next/server'
import { QUOTE_REQUEST as TEMPLATE } from '@/libs/bridgeTemplate'

export async function POST(req: NextRequest) {
  try {
    const { request } = await req.json()
    // For now, this is a placeholder that echoes the request.
    // You can wire this to your backend executor or directly call the engine API from here.
    return Response.json({ ok: true, received: { ...TEMPLATE, ...request } })
  } catch (e: any) {
    return new Response(e?.message || 'Bad request', { status: 400 })
  }
}



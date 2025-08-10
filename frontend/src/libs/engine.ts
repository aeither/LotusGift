import type { QuoteRequest } from './tradeClient'

export type EngineConfig = {
  baseUrl: string
  apiKey: string
}

async function engineFetch<T>(config: EngineConfig, path: string, init?: RequestInit): Promise<{ status: number; data: T }> {
  const res = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  })
  const text = await res.text()
  let data: any
  try { data = JSON.parse(text) } catch { data = { raw: text } }
  if (!res.ok) {
    const err = new Error(typeof data === 'object' && data?.error ? data.error : text || `HTTP ${res.status}`)
    ;(err as any).status = res.status
    ;(err as any).body = data
    throw err
  }
  return { status: res.status, data }
}

export async function engineEstimate(config: EngineConfig, req: QuoteRequest) {
  return engineFetch<any>(config, '/order/estimate', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

export async function engineStatus(config: EngineConfig, txHash: string) {
  const p = new URLSearchParams({ txHash })
  return engineFetch<any>(config, `/order/status?${p.toString()}`, { method: 'GET' })
}



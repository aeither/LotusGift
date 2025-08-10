import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      recipient?: string
      amount?: string | number
      currency?: string
      category?: string
      message?: string
      sender?: string
    }

    const recipient = (body?.recipient || 'friend').toString().trim()
    const currency = (body?.currency || 'ETH').toString().toUpperCase()
    const amountStr = body?.amount != null ? String(body.amount) : ''
    const category = (body?.category || '').toString().trim()
    const custom = (body?.message || '').toString().trim()
    const sender = (body?.sender || '').toString().trim()

    const prettyAmount = amountStr ? `${amountStr} ${currency}` : `${currency}`
    const subject = `🎁 LotusGift for ${recipient}`
    const parts: string[] = []
    parts.push(`You have received ${prettyAmount}`)
    if (category) parts.push(`for ${category}`)
    if (sender) parts.push(`from ${sender}`)
    const header = parts.join(' ')

    const bodyText = custom || 'Open the app to view your message and claim the gift.'
    const text = `${header}. ${bodyText}`

    return Response.json({ subject, text, recipient, amount: amountStr, currency, category, sender, timestamp: new Date().toISOString() })
  } catch (e: any) {
    return new Response(e?.message || 'Bad request', { status: 400 })
  }
}



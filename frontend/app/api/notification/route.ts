export async function POST(req: Request) {
  try {
    const body = await req.json();
    const proxyUrl = process.env.NEXT_PUBLIC_NOTIFICATION_PROXY_URL || 'https://api.developer.coinbase.com/cdp/notifications';

    const resp = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await resp.json();
    return Response.json(data, { status: resp.status });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}

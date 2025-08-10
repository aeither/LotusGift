import 'dotenv/config'
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'

const PORT = Number(process.env.PORT || 3001)
const HOST = process.env.HOST || 'localhost'

// Prefer BITTE_API_KEY, fall back to legacy name if provided
const BITTE_API_KEY = process.env.BITTE_API_KEY

function getBaseUrl(): string {
  // Explicit override for deployments
  if (process.env.BITTE_AGENT_URL) {
    return String(process.env.BITTE_AGENT_URL)
  }
  // Common platform environment URLs
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  }
  if (process.env.RENDER_EXTERNAL_URL) {
    return String(process.env.RENDER_EXTERNAL_URL)
  }
  // Local fallback
  return `http://localhost:${PORT}`
}

const app = new Hono()

// CORS for browser requests
app.use('*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
)

// Health check endpoint
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

// OpenAPI manifest endpoint
app.get('/api/ai-plugin', (c) => c.json(buildManifest()))
// Also expose under the well-known path
app.get('/.well-known/ai-plugin.json', (c) => c.json(buildManifest()))
// Common alias
app.get('/openapi.json', (c) => c.json(buildManifest()))

// Coinflip tool (GET)
app.get('/api/coinflip', (c) => {
  const result = Math.random() < 0.5 ? 'heads' : 'tails'
  const message = `The coin landed on ${result}!`
  return c.json({ result, message })
})

// Greeting tool (POST)
app.post('/api/greeting', async (c) => {
  try {
    const body = await c.req.json<{ name?: string }>()
    const name = body?.name?.trim()
    if (!name) return c.json({ error: 'Name is required' }, 400)

    const greetings = [
      `Hello ${name}! Welcome to Bitte Open Agents!`,
      `Hi there, ${name}! Great to see you here!`,
      `Greetings ${name}! Ready to explore decentralized agents?`,
      `Hey ${name}! Let's build something amazing together!`,
    ]
    const greeting = greetings[Math.floor(Math.random() * greetings.length)]
    const timestamp = new Date().toISOString()
    return c.json({ greeting, timestamp })
  } catch (err) {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }
})

// Gift message generator (POST)
app.post('/api/gift-message', async (c) => {
  try {
    const body = await c.req.json<{
      recipient?: string
      amount?: string | number
      currency?: string
      category?: string
      message?: string
      sender?: string
    }>()

    const recipient = (body?.recipient || 'friend').trim()
    const currency = (body?.currency || 'ETH').toUpperCase()
    const amountStr = String(body?.amount ?? '')
    const category = (body?.category || '').trim()
    const custom = (body?.message || '').trim()
    const sender = (body?.sender || '').trim()

    const prettyAmount = amountStr ? `${amountStr} ${currency}` : `${currency}`
    const subject = `🎁 LotusGift for ${recipient}`
    const parts: string[] = []
    parts.push(`You have received ${prettyAmount}`)
    if (category) parts.push(`for ${category}`)
    if (sender) parts.push(`from ${sender}`)
    const header = parts.join(' ')

    const bodyText = custom || 'Open the app to view your message and claim the gift.'
    const text = `${header}. ${bodyText}`

    return c.json({ subject, text, recipient, amount: amountStr, currency, category, sender, timestamp: new Date().toISOString() })
  } catch (err) {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }
})

export function buildManifest() {
  const baseUrl = getBaseUrl()
  return {
    openapi: '3.0.3',
    info: {
      title: 'Minimal Bitte Agent (Hono)',
      description:
        'A minimal agent exposing a coinflip and greeting tool. Extend with your own tools.',
      version: '0.1.0',
    },
    servers: [{ url: baseUrl }],
    paths: {
      '/api/coinflip': {
        get: {
          operationId: 'coinflip',
          summary: 'Flip a coin and return heads or tails',
          description: 'Returns a random coin flip result',
          responses: {
            '200': {
              description: 'Successful coin flip',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      result: { type: 'string', enum: ['heads', 'tails'] },
                      message: { type: 'string' },
                    },
                    required: ['result', 'message'],
                  },
                },
              },
            },
          },
        },
      },
      '/api/greeting': {
        post: {
          operationId: 'greeting',
          summary: 'Generate a personalized greeting',
          description: 'Creates a personalized greeting message',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { name: { type: 'string' } },
                  required: ['name'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Greeting generated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      greeting: { type: 'string' },
                      timestamp: { type: 'string' },
                    },
                    required: ['greeting', 'timestamp'],
                  },
                },
              },
            },
            '400': {
              description: 'Bad request',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: { type: 'string' },
                    },
                    required: ['error'],
                  },
                },
              },
            },
          },
        },
      },
      '/api/gift-message': {
        post: {
          operationId: 'giftMessage',
          summary: 'Generate a human-friendly gift message',
          description: 'Builds a short message the UI can show or send in a notification for a gift.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    recipient: { type: 'string' },
                    amount: { oneOf: [{ type: 'string' }, { type: 'number' }] },
                    currency: { type: 'string', default: 'ETH' },
                    category: { type: 'string' },
                    message: { type: 'string' },
                    sender: { type: 'string' },
                  },
                  required: ['recipient'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Gift message generated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      subject: { type: 'string' },
                      text: { type: 'string' },
                      recipient: { type: 'string' },
                      amount: { type: 'string' },
                      currency: { type: 'string' },
                      category: { type: 'string' },
                      sender: { type: 'string' },
                      timestamp: { type: 'string' },
                    },
                    required: ['subject', 'text', 'recipient', 'timestamp'],
                  },
                },
              },
            },
            '400': {
              description: 'Bad request',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { error: { type: 'string' } },
                    required: ['error'],
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {},
    'x-mb': {
      account_id: process.env.ACCOUNT_ID || 'your-account.near',
      assistant: {
        name: 'Minimal Hono Agent',
        description:
          'A minimal agent with coinflip and greeting tools built with Hono.',
        instructions:
          'Use coinflip for randomness; use greeting to greet users by name. Always be helpful and friendly.',
        tools: [
          { type: 'generate-evm-tx' },
          { type: 'generate-transaction' },
          { type: 'sign-message' },
        ],
        categories: ['Utility', 'Entertainment'],
        chainIds: [1, 8453, 137],
      },
    },
  }
}

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`🚀 Hono backend running at ${getBaseUrl()}`)
  console.log(`📋 Manifest: ${getBaseUrl()}/api/ai-plugin`)
  console.log(`🔧 Health check: ${getBaseUrl()}/health`)
})



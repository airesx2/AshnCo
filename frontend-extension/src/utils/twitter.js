import {
  TWITTER_API_KEY,
  TWITTER_API_SECRET,
  TWITTER_ACCESS_TOKEN,
  TWITTER_ACCESS_SECRET,
} from './credentials.js'

const API = 'https://api.twitter.com'

// ── OAuth 1.0a signer ────────────────────────────────────────────────────────

async function sign(method, url) {
  const nonce     = crypto.randomUUID().replace(/-/g, '')
  const timestamp = Math.floor(Date.now() / 1000).toString()

  const oauthParams = {
    oauth_consumer_key:     TWITTER_API_KEY,
    oauth_nonce:            nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp:        timestamp,
    oauth_token:            TWITTER_ACCESS_TOKEN,
    oauth_version:          '1.0',
  }

  const paramString = Object.keys(oauthParams)
    .sort()
    .map(k => `${pct(k)}=${pct(oauthParams[k])}`)
    .join('&')

  const baseString = [method.toUpperCase(), pct(url), pct(paramString)].join('&')
  const signingKey = `${pct(TWITTER_API_SECRET)}&${pct(TWITTER_ACCESS_SECRET)}`

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(signingKey),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(baseString))
  const signature = btoa(String.fromCharCode(...new Uint8Array(sig)))

  return 'OAuth ' + Object.entries({ ...oauthParams, oauth_signature: signature })
    .map(([k, v]) => `${pct(k)}="${pct(v)}"`)
    .join(', ')
}

function pct(str) {
  return encodeURIComponent(String(str))
}

// ── API ──────────────────────────────────────────────────────────────────────

// Post a tweet — called after P2's LLM returns formatted text
export async function postTweet(text) {
  const url           = `${API}/2/tweets`
  const authorization = await sign('POST', url)

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: authorization, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })

  if (!res.ok) throw new Error(`Twitter API ${res.status}: ${await res.text()}`)
  return res.json()
}

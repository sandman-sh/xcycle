// ============================================================
// OKX Web3 API Proxy — Server-Side Route Handler
// Performs HMAC SHA256 authentication and proxies requests
// to the OKX DEX Aggregator & Market Data APIs (V6)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const OKX_BASE = 'https://web3.okx.com';

function getOKXHeaders(method: string, requestPath: string, body: string = '') {
  const apiKey = process.env.OKX_API_KEY ?? '';
  const secretKey = process.env.OKX_SECRET_KEY ?? '';
  const passphrase = process.env.OKX_PASSPHRASE ?? '';

  const timestamp = new Date().toISOString();
  const preHash = timestamp + method.toUpperCase() + requestPath + body;
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(preHash)
    .digest('base64');

  return {
    'Content-Type': 'application/json',
    'OK-ACCESS-KEY': apiKey,
    'OK-ACCESS-SIGN': signature,
    'OK-ACCESS-TIMESTAMP': timestamp,
    'OK-ACCESS-PASSPHRASE': passphrase,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (!action) {
    return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 });
  }

  try {
    switch (action) {
      // ── DEX Quote ─────────────────────────────────────────
      case 'quote': {
        const chainIndex = searchParams.get('chainId') || '196';
        const fromToken = searchParams.get('fromTokenAddress') || '';
        const toToken = searchParams.get('toTokenAddress') || '';
        const amount = searchParams.get('amount') || '0';

        const path = `/api/v6/dex/aggregator/quote?chainIndex=${chainIndex}&fromTokenAddress=${fromToken}&toTokenAddress=${toToken}&amount=${amount}`;
        const headers = getOKXHeaders('GET', path);
        const res = await fetch(`${OKX_BASE}${path}`, { headers, next: { revalidate: 10 } });
        const data = await res.json();
        return NextResponse.json(data);
      }

      // ── Token List / Search ───────────────────────────────
      case 'tokens': {
        const chainIndex = searchParams.get('chainId') || '196';
        const path = `/api/v6/dex/aggregator/all-tokens?chainIndex=${chainIndex}`;
        const headers = getOKXHeaders('GET', path);
        const res = await fetch(`${OKX_BASE}${path}`, { headers, next: { revalidate: 60 } });
        const data = await res.json();
        return NextResponse.json(data);
      }

      // ── Supported DEX List ────────────────────────────────
      case 'liquidity': {
        const chainIndex = searchParams.get('chainId') || '196';
        const path = `/api/v6/dex/aggregator/supported/chain?chainIndex=${chainIndex}`;
        const headers = getOKXHeaders('GET', path);
        const res = await fetch(`${OKX_BASE}${path}`, { headers, next: { revalidate: 120 } });
        const data = await res.json();
        return NextResponse.json(data);
      }

      // ── Swap Data (get tx calldata for swap) ──────────────
      case 'swap': {
        const chainIndex = searchParams.get('chainId') || '196';
        const fromToken = searchParams.get('fromTokenAddress') || '';
        const toToken = searchParams.get('toTokenAddress') || '';
        const amount = searchParams.get('amount') || '0';
        const slippage = searchParams.get('slippage') || '0.5';
        const userAddr = searchParams.get('userWalletAddress') || '';

        const path = `/api/v6/dex/aggregator/swap?chainIndex=${chainIndex}&fromTokenAddress=${fromToken}&toTokenAddress=${toToken}&amount=${amount}&slippage=${slippage}&userWalletAddress=${userAddr}`;
        const headers = getOKXHeaders('GET', path);
        const res = await fetch(`${OKX_BASE}${path}`, { headers, next: { revalidate: 0 } });
        const data = await res.json();
        return NextResponse.json(data);
      }

      // ── Token Price / Index ───────────────────────────────
      case 'price': {
        const chainIndex = searchParams.get('chainId') || '196';
        const tokenAddress = searchParams.get('tokenAddress') || '';
        const path = `/api/v6/dex/market/index-price?chainIndex=${chainIndex}&tokenContractAddress=${tokenAddress}`;
        const headers = getOKXHeaders('GET', path);
        const res = await fetch(`${OKX_BASE}${path}`, { headers, next: { revalidate: 15 } });
        const data = await res.json();
        return NextResponse.json(data);
      }

      // ── Token Security / Risk ─────────────────────────────
      case 'security': {
        const chainIndex = searchParams.get('chainId') || '196';
        const tokenAddress = searchParams.get('tokenAddress') || '';
        const path = `/api/v6/dex/token/token-risk?chainIndex=${chainIndex}&tokenContractAddress=${tokenAddress}`;
        const headers = getOKXHeaders('GET', path);
        const res = await fetch(`${OKX_BASE}${path}`, { headers, next: { revalidate: 60 } });
        const data = await res.json();
        return NextResponse.json(data);
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

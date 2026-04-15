// ============================================================
// Real On-Chain Service for X Layer Testnet
// Replaces all mock OnchainOS calls with actual blockchain reads
// and wallet transaction submissions via viem/wagmi
// ============================================================

import {
  createPublicClient,
  http,
  formatEther,
  formatUnits,
  parseUnits,
  parseEther,
  type Address,
  type Hash,
  type PublicClient,
  encodeFunctionData,
  maxUint128,
} from 'viem';
import { xLayerTestnet } from './wagmi';
import {
  CONTRACTS,
  ERC20_ABI,
  POSITION_MANAGER_ABI,
  SWAP_ROUTER_ABI,
} from './contracts';

// ── Public Client (for reads) ─────────────────────────────────
let _publicClient: PublicClient | null = null;

export function getPublicClient(): PublicClient {
  if (!_publicClient) {
    _publicClient = createPublicClient({
      chain: xLayerTestnet,
      transport: http('https://testrpc.xlayer.tech'),
    }) as PublicClient;
  }
  return _publicClient;
}

// ── Types ─────────────────────────────────────────────────────
export interface WalletBalances {
  address: string;
  nativeBalance: string;       // OKB formatted
  nativeBalanceRaw: bigint;
  usdcBalance: string;         // USDC formatted
  usdcBalanceRaw: bigint;
  usdtBalance: string;         // USDT formatted  
  usdtBalanceRaw: bigint;
  wokbBalance: string;         // WOKB formatted
  wokbBalanceRaw: bigint;
  chainId: number;
  network: string;
}

export interface PoolInfo {
  poolAddress: string;
  token0: string;
  token1: string;
  token0Symbol: string;
  token1Symbol: string;
  feeTier: number;
  liquidity: string;
}

export interface OnChainPosition {
  tokenId: bigint;
  token0: Address;
  token1: Address;
  fee: number;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
  tokensOwed0: bigint;
  tokensOwed1: bigint;
}

export interface TxResult {
  hash: Hash;
  success: boolean;
  blockNumber?: bigint;
}

export interface AgentStep {
  skill: string;
  status: 'pending' | 'running' | 'done' | 'error';
  message: string;
  result?: string;
}

// ── Token name map ────────────────────────────────────────────
const TOKEN_NAMES: Record<string, string> = {
  [CONTRACTS.USDC.toLowerCase()]: 'USDC',
  [CONTRACTS.USDT.toLowerCase()]: 'USDT',
  [CONTRACTS.WOKB.toLowerCase()]: 'WOKB',
};

export function getTokenName(address: string): string {
  return TOKEN_NAMES[address.toLowerCase()] ?? address.slice(0, 6);
}

// ── Real On-Chain Reads ───────────────────────────────────────

/**
 * Fetch native (OKB) + ERC20 token balances for a wallet address
 */
export async function fetchWalletBalances(address: Address): Promise<WalletBalances> {
  const client = getPublicClient();

  const [nativeBalance, usdcBalance, usdtBalance, wokbBalance] = await Promise.all([
    client.getBalance({ address }),
    client.readContract({
      address: CONTRACTS.USDC,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address],
    }).catch(() => 0n),
    client.readContract({
      address: CONTRACTS.USDT,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address],
    }).catch(() => 0n),
    client.readContract({
      address: CONTRACTS.WOKB,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address],
    }).catch(() => 0n),
  ]);

  return {
    address,
    nativeBalance: formatEther(nativeBalance),
    nativeBalanceRaw: nativeBalance,
    usdcBalance: formatUnits(usdcBalance as bigint, 6),
    usdcBalanceRaw: usdcBalance as bigint,
    usdtBalance: formatUnits(usdtBalance as bigint, 6),
    usdtBalanceRaw: usdtBalance as bigint,
    wokbBalance: formatEther(wokbBalance as bigint),
    wokbBalanceRaw: wokbBalance as bigint,
    chainId: xLayerTestnet.id,
    network: 'X Layer Testnet',
  };
}

/**
 * Fetch LP positions owned by address from Uniswap V3 NonfungiblePositionManager
 */
export async function fetchLPPositions(address: Address): Promise<OnChainPosition[]> {
  const client = getPublicClient();
  const positions: OnChainPosition[] = [];

  try {
    const balance = await client.readContract({
      address: CONTRACTS.UNISWAP_V3_POSITION_MANAGER,
      abi: POSITION_MANAGER_ABI,
      functionName: 'balanceOf',
      args: [address],
    }) as bigint;

    const count = Number(balance);
    for (let i = 0; i < count && i < 20; i++) {
      try {
        const tokenId = await client.readContract({
          address: CONTRACTS.UNISWAP_V3_POSITION_MANAGER,
          abi: POSITION_MANAGER_ABI,
          functionName: 'tokenOfOwnerByIndex',
          args: [address, BigInt(i)],
        }) as bigint;

        const positionData = await client.readContract({
          address: CONTRACTS.UNISWAP_V3_POSITION_MANAGER,
          abi: POSITION_MANAGER_ABI,
          functionName: 'positions',
          args: [tokenId],
        }) as readonly [bigint, Address, Address, Address, number, number, number, bigint, bigint, bigint, bigint, bigint];

        positions.push({
          tokenId,
          token0: positionData[2],
          token1: positionData[3],
          fee: positionData[4],
          tickLower: positionData[5],
          tickUpper: positionData[6],
          liquidity: positionData[7],
          tokensOwed0: positionData[10],
          tokensOwed1: positionData[11],
        });
      } catch {
        // Position may have been burned, skip
      }
    }
  } catch {
    // Contract might not be deployed on testnet
  }

  return positions;
}

/**
 * Fetch recent Transfer events for a given address from known tokens
 */
export async function fetchRecentTransactions(address: Address, blockRange = 5000n) {
  const client = getPublicClient();
  const currentBlock = await client.getBlockNumber();
  const fromBlock = currentBlock > blockRange ? currentBlock - blockRange : 0n;

  const txRecords: Array<{
    hash: Hash;
    type: 'Transfer In' | 'Transfer Out' | 'Swap' | 'LP Action';
    status: 'confirmed';
    amount: string;
    timestamp: number;
    blockNumber: bigint;
  }> = [];

  // Fetch Transfer events for USDC
  for (const [tokenAddr, tokenName] of [
    [CONTRACTS.USDC, 'USDC'],
    [CONTRACTS.WOKB, 'WOKB'],
    [CONTRACTS.USDT, 'USDT'],
  ] as const) {
    try {
      // Incoming transfers
      const incomingLogs = await client.getLogs({
        address: tokenAddr,
        event: {
          type: 'event',
          name: 'Transfer',
          inputs: [
            { name: 'from', type: 'address', indexed: true },
            { name: 'to', type: 'address', indexed: true },
            { name: 'value', type: 'uint256', indexed: false },
          ],
        },
        args: { to: address },
        fromBlock,
        toBlock: 'latest',
      });

      for (const log of incomingLogs.slice(-10)) {
        const decimals = tokenName === 'WOKB' ? 18 : 6;
        const value = formatUnits(log.args.value ?? 0n, decimals);
        txRecords.push({
          hash: log.transactionHash!,
          type: 'Transfer In',
          status: 'confirmed',
          amount: `+${parseFloat(value).toFixed(2)} ${tokenName}`,
          timestamp: Date.now() - Number(currentBlock - log.blockNumber!) * 2000,
          blockNumber: log.blockNumber!,
        });
      }

      // Outgoing transfers
      const outgoingLogs = await client.getLogs({
        address: tokenAddr,
        event: {
          type: 'event',
          name: 'Transfer',
          inputs: [
            { name: 'from', type: 'address', indexed: true },
            { name: 'to', type: 'address', indexed: true },
            { name: 'value', type: 'uint256', indexed: false },
          ],
        },
        args: { from: address },
        fromBlock,
        toBlock: 'latest',
      });

      for (const log of outgoingLogs.slice(-10)) {
        const decimals = tokenName === 'WOKB' ? 18 : 6;
        const value = formatUnits(log.args.value ?? 0n, decimals);
        txRecords.push({
          hash: log.transactionHash!,
          type: 'Transfer Out',
          status: 'confirmed',
          amount: `-${parseFloat(value).toFixed(2)} ${tokenName}`,
          timestamp: Date.now() - Number(currentBlock - log.blockNumber!) * 2000,
          blockNumber: log.blockNumber!,
        });
      }
    } catch {
      // Token may not exist on testnet, skip
    }
  }

  // Deduplicate by hash and sort by block
  const seen = new Set<string>();
  const unique = txRecords.filter(tx => {
    const key = `${tx.hash}-${tx.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.sort((a, b) => Number(b.blockNumber - a.blockNumber));
}

/**
 * Build ERC20 approve transaction data
 */
export function buildApproveData(spender: Address, amount: bigint) {
  return encodeFunctionData({
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [spender, amount],
  });
}

/**
 * Build a simple native token transfer (OKB send)
 * Used for agent-to-agent x402 payments
 */
export function buildNativeTransfer(to: Address, value: bigint) {
  return { to, value };
}

/**
 * Check ERC20 allowance
 */
export async function checkAllowance(
  token: Address,
  owner: Address,
  spender: Address,
): Promise<bigint> {
  const client = getPublicClient();
  try {
    return (await client.readContract({
      address: token,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [owner, spender],
    })) as bigint;
  } catch {
    return 0n;
  }
}

/**
 * Wait for a transaction receipt
 */
export async function waitForTx(hash: Hash): Promise<TxResult> {
  const client = getPublicClient();
  try {
    const receipt = await client.waitForTransactionReceipt({ hash, timeout: 60_000 });
    return {
      hash,
      success: receipt.status === 'success',
      blockNumber: receipt.blockNumber,
    };
  } catch {
    return { hash, success: false };
  }
}

/**
 * Verify if a contract exists at the given address
 */
export async function isContractDeployed(address: Address): Promise<boolean> {
  const client = getPublicClient();
  try {
    const code = await client.getCode({ address });
    return !!code && code !== '0x';
  } catch {
    return false;
  }
}

/**
 * Security check - verify token contract is valid
 */
export async function checkTokenSecurity(tokenAddress: Address): Promise<{
  isValid: boolean;
  hasCode: boolean;
  riskScore: number;
  details: string;
}> {
  const client = getPublicClient();

  try {
    const code = await client.getCode({ address: tokenAddress });
    const hasCode = !!code && code !== '0x';

    if (!hasCode) {
      return { isValid: false, hasCode: false, riskScore: 100, details: 'No contract code found at address' };
    }

    // Try to call standard ERC20 functions
    let symbolOk = false;
    let decimalsOk = false;
    try {
      await client.readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: 'symbol' });
      symbolOk = true;
    } catch { /* not a standard ERC20 */ }

    try {
      await client.readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: 'decimals' });
      decimalsOk = true;
    } catch { /* not a standard ERC20 */ }

    const isStandardERC20 = symbolOk && decimalsOk;
    const riskScore = isStandardERC20 ? 5 : 50;

    return {
      isValid: isStandardERC20,
      hasCode: true,
      riskScore,
      details: isStandardERC20
        ? 'Standard ERC20 token with verified interface'
        : 'Contract exists but does not implement standard ERC20 interface',
    };
  } catch {
    return { isValid: false, hasCode: false, riskScore: 100, details: 'Failed to verify contract' };
  }
}

/**
 * Get current block number
 */
export async function getCurrentBlock(): Promise<bigint> {
  const client = getPublicClient();
  return client.getBlockNumber();
}

// ── Agent Command Parser ──────────────────────────────────────
export interface ParsedCommand {
  intent: 'start_cycle' | 'show_positions' | 'pause' | 'withdraw' | 'show_stats' | 'collect_fees' | 'send_okb' | 'check_balance' | 'unknown';
  amount?: string;
  risk?: 'low' | 'medium' | 'high';
  to?: string;
  raw: string;
}

export function parseAgentCommand(input: string): ParsedCommand {
  const lower = input.toLowerCase();

  if (lower.includes('start') || lower.includes('begin') || lower.includes('launch') || lower.includes('deploy')) {
    const amountMatch = input.match(/(\d[\d,]*(?:\.\d+)?)\s*(?:usdc|usd)?/i);
    const amount = amountMatch ? amountMatch[1].replace(',', '') : '1000';
    const risk = lower.includes('low') ? 'low' : lower.includes('high') ? 'high' : 'medium';
    return { intent: 'start_cycle', amount, risk, raw: input };
  }

  if (lower.includes('balance') || lower.includes('wallet')) {
    return { intent: 'check_balance', raw: input };
  }

  if (lower.includes('position') || lower.includes('show') || lower.includes('status')) {
    return { intent: 'show_positions', raw: input };
  }

  if (lower.includes('collect') || lower.includes('claim') || lower.includes('harvest')) {
    return { intent: 'collect_fees', raw: input };
  }

  if (lower.includes('send') || lower.includes('transfer')) {
    const amountMatch = input.match(/(\d+\.?\d*)\s*(?:okb)?/i);
    const addressMatch = input.match(/(0x[a-fA-F0-9]{40})/);
    return {
      intent: 'send_okb',
      amount: amountMatch?.[1],
      to: addressMatch?.[1],
      raw: input,
    };
  }

  if (lower.includes('pause') || lower.includes('stop')) {
    return { intent: 'pause', raw: input };
  }

  if (lower.includes('withdraw') || lower.includes('exit') || lower.includes('remove')) {
    return { intent: 'withdraw', raw: input };
  }

  if (lower.includes('stat') || lower.includes('earn') || lower.includes('cycle') || lower.includes('history')) {
    return { intent: 'show_stats', raw: input };
  }

  return { intent: 'unknown', raw: input };
}

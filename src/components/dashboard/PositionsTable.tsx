'use client';

import { motion, AnimatePresence } from 'framer-motion';
import React, { useEffect, useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { fetchLPPositions, getTokenName, type OnChainPosition } from '@/lib/onchain';
import { getExplorerAddressUrl } from '@/lib/wagmi';
import { CONTRACTS } from '@/lib/contracts';
import { ExternalLink, ChevronDown, ChevronUp, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatUnits } from 'viem';
import type { Address } from 'viem';

function RangePill({ hasLiquidity }: { hasLiquidity: boolean }) {
  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold',
      hasLiquidity
        ? 'bg-[rgba(34,211,160,0.1)] text-[#22d3a0] border border-[rgba(34,211,160,0.2)]'
        : 'bg-[rgba(248,113,113,0.1)] text-[#f87171] border border-[rgba(248,113,113,0.2)]'
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', hasLiquidity ? 'bg-[#22d3a0] animate-pulse' : 'bg-[#f87171]')} />
      {hasLiquidity ? 'Active' : 'Closed'}
    </div>
  );
}

function FeeBadge({ tier }: { tier: number }) {
  const label = tier === 100 ? '0.01%' : tier === 500 ? '0.05%' : tier === 3000 ? '0.3%' : '1%';
  return (
    <span className="px-1.5 py-0.5 rounded-md bg-[rgba(139,92,246,0.12)] text-[#8b5cf6] text-[10px] font-bold border border-[rgba(139,92,246,0.2)]">
      {label}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-[rgba(255,255,255,0.04)]">
      {[1,2,3,4,5,6].map(i => (
        <td key={i} className="px-4 py-4">
          <div className={`skeleton h-4 ${i === 1 ? 'w-24' : i === 2 ? 'w-16' : 'w-20'} rounded`} />
        </td>
      ))}
    </tr>
  );
}

export function PositionsTable() {
  const { address, isConnected } = useAccount();
  const [positions, setPositions] = useState<OnChainPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isConnected || !address) {
      setPositions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLPPositions(address as Address);
      setPositions(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load positions';
      setError(msg);
      setPositions([]);
    }
    setLoading(false);
  }, [address, isConnected]);

  useEffect(() => { load(); }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45, duration: 0.5 }}
      className="glass-card rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.05)]">
        <div className="flex items-center gap-3">
          <h3 className="text-[15px] font-semibold text-white">Active Liquidity Positions</h3>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(0,178,255,0.08)] border border-[rgba(0,178,255,0.15)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00b2ff] animate-pulse" />
            <span className="text-[10px] font-semibold text-[#00b2ff]">
              {isConnected ? 'On-Chain' : 'Offline'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-[#4b5563]">
            {positions.length} position{positions.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={refresh}
            disabled={refreshing}
            className="w-7 h-7 rounded-lg flex items-center justify-center bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] text-[#6b7280] hover:text-white transition-all"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin text-[#00b2ff]')} />
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-5 py-3 bg-[rgba(248,113,113,0.06)] border-b border-[rgba(248,113,113,0.1)] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#f87171]" />
          <p className="text-[12px] text-[#f87171]">{error}</p>
        </div>
      )}

      {/* Not Connected State */}
      {!isConnected ? (
        <div className="px-5 py-12 text-center">
          <p className="text-[#4b5563] text-sm mb-2">Connect your wallet to view on-chain positions</p>
          <p className="text-[10px] text-[#374151]">Your Uniswap V3 LP positions on X Layer Testnet will be displayed here</p>
        </div>
      ) : (
        /* Table */
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.04)]">
                {['Token ID', 'Pool', 'Fee Tier', 'Liquidity', 'Fees Owed', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-[#4b5563] uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <>{[1,2].map(i => <SkeletonRow key={i} />)}</>
              ) : positions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[#4b5563] text-sm">
                    No active LP positions found on-chain.<br />
                    <span className="text-[11px] text-[#374151]">
                      Use Agent Chat to create your first position, or add liquidity on Uniswap V3.
                    </span>
                  </td>
                </tr>
              ) : (
                positions.map((pos, i) => {
                  const posKey = pos.tokenId.toString();
                  const token0Name = getTokenName(pos.token0);
                  const token1Name = getTokenName(pos.token1);
                  const hasLiquidity = pos.liquidity > 0n;

                  return (
                    <React.Fragment key={posKey}>
                      <motion.tr
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.55 + i * 0.08 }}
                        className="border-b border-[rgba(255,255,255,0.04)] table-row-hover cursor-pointer"
                        onClick={() => setExpanded(expanded === posKey ? null : posKey)}
                      >
                        <td className="px-4 py-3.5">
                          <span className="text-[13px] font-mono font-semibold text-[#00b2ff]">#{posKey}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex -space-x-1.5">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0066cc] to-[#00b2ff] flex items-center justify-center text-[9px] font-bold text-white ring-2 ring-[#0a0a0a]">
                                {token0Name[0]}
                              </div>
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#4b5563] to-[#9ca3af] flex items-center justify-center text-[9px] font-bold text-white ring-2 ring-[#0a0a0a]">
                                {token1Name[0]}
                              </div>
                            </div>
                            <div>
                              <p className="text-[13px] font-semibold text-white">{token0Name}/{token1Name}</p>
                              <p className="text-[10px] text-[#4b5563] font-mono">
                                Ticks: {pos.tickLower} → {pos.tickUpper}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5"><FeeBadge tier={pos.fee} /></td>
                        <td className="px-4 py-3.5">
                          <p className="text-[13px] font-semibold text-white">
                            {pos.liquidity > 0n ? pos.liquidity.toString().slice(0, 10) + (pos.liquidity.toString().length > 10 ? '...' : '') : '0'}
                          </p>
                          <p className="text-[10px] text-[#4b5563]">raw liquidity units</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-[13px] font-semibold text-[#22d3a0]">
                            {pos.tokensOwed0 > 0n || pos.tokensOwed1 > 0n ? 'Fees Available' : 'None'}
                          </p>
                          <p className="text-[10px] text-[#4b5563]">
                            T0: {pos.tokensOwed0.toString()} · T1: {pos.tokensOwed1.toString()}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-between">
                            <RangePill hasLiquidity={hasLiquidity} />
                            {expanded === posKey
                              ? <ChevronUp className="w-3.5 h-3.5 text-[#4b5563]" />
                              : <ChevronDown className="w-3.5 h-3.5 text-[#4b5563]" />
                            }
                          </div>
                        </td>
                      </motion.tr>

                      {/* Expanded detail row */}
                      <AnimatePresence>
                        {expanded === posKey && (
                          <motion.tr
                            key={`${posKey}-expand`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <td colSpan={6} className="px-4 py-3 bg-[rgba(0,178,255,0.03)]">
                              <div className="grid grid-cols-4 gap-4">
                                <div>
                                  <p className="text-[10px] text-[#4b5563] mb-0.5">Token 0</p>
                                  <a
                                    href={getExplorerAddressUrl(pos.token0)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1 text-[12px] font-semibold text-[#00b2ff] hover:underline"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    {token0Name} ({pos.token0.slice(0, 8)}...) <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                                <div>
                                  <p className="text-[10px] text-[#4b5563] mb-0.5">Token 1</p>
                                  <a
                                    href={getExplorerAddressUrl(pos.token1)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1 text-[12px] font-semibold text-[#00b2ff] hover:underline"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    {token1Name} ({pos.token1.slice(0, 8)}...) <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                                <div>
                                  <p className="text-[10px] text-[#4b5563] mb-0.5">Tick Range</p>
                                  <p className="text-[12px] font-semibold text-white">{pos.tickLower} ↔ {pos.tickUpper}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-[#4b5563] mb-0.5">Position Manager</p>
                                  <a
                                    href={getExplorerAddressUrl(CONTRACTS.UNISWAP_V3_POSITION_MANAGER)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1 text-[12px] font-semibold text-[#00b2ff] hover:underline"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    {CONTRACTS.UNISWAP_V3_POSITION_MANAGER.slice(0, 10)}... <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}

'use client';

import { motion } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { fetchRecentTransactions } from '@/lib/onchain';
import { getExplorerTxUrl } from '@/lib/wagmi';
import { ExternalLink, ArrowDownLeft, ArrowUpRight, Zap, RefreshCw, PlusCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Address, Hash } from 'viem';

type TxType = 'Transfer In' | 'Transfer Out' | 'Swap' | 'LP Action';

const TX_ICONS: Record<TxType, React.ElementType> = {
  'Transfer In':  ArrowDownLeft,
  'Transfer Out': ArrowUpRight,
  'Swap':         Zap,
  'LP Action':    PlusCircle,
};

const TX_COLORS: Record<TxType, string> = {
  'Transfer In':  '#22d3a0',
  'Transfer Out': '#f87171',
  'Swap':         '#f59e0b',
  'LP Action':    '#8b5cf6',
};

function timeAgo(ts: number) {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60)    return `${seconds}s ago`;
  if (seconds < 3600)  return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[rgba(255,255,255,0.04)]">
      <div className="skeleton w-7 h-7 rounded-lg" />
      <div className="flex-1 space-y-1.5">
        <div className="skeleton h-3.5 w-24" />
        <div className="skeleton h-3 w-32" />
      </div>
      <div className="skeleton h-3.5 w-20" />
    </div>
  );
}

interface TxRecord {
  hash: Hash;
  type: TxType;
  status: 'confirmed';
  amount: string;
  timestamp: number;
  blockNumber: bigint;
}

export function CycleHistory() {
  const { address, isConnected } = useAccount();
  const [txs, setTxs] = useState<TxRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isConnected || !address) {
      setTxs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRecentTransactions(address as Address);
      setTxs(data as TxRecord[]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load tx history';
      setError(msg);
      setTxs([]);
    }
    setLoading(false);
  }, [address, isConnected]);

  useEffect(() => { load(); }, [load]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.45 }}
      className="glass-card rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.05)]">
        <div className="flex items-center gap-2">
          <h3 className="text-[15px] font-semibold text-white">Transaction History</h3>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[rgba(34,211,160,0.08)] border border-[rgba(34,211,160,0.12)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22d3a0] animate-pulse" />
            <span className="text-[9px] font-semibold text-[#22d3a0]">Live</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="w-6 h-6 rounded-lg flex items-center justify-center bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] text-[#6b7280] hover:text-white transition-all"
          >
            <RefreshCw className={cn('w-3 h-3', loading && 'animate-spin text-[#00b2ff]')} />
          </button>
          <a
            href="https://www.okx.com/web3/explorer/xlayer-test"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-[11px] text-[#4b5563] hover:text-[#00b2ff] transition-colors"
          >
            Explorer <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-5 py-2 bg-[rgba(248,113,113,0.06)] flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-[#f87171]" />
          <p className="text-[11px] text-[#f87171]">{error}</p>
        </div>
      )}

      {/* Transaction list */}
      <div className="px-5 divide-y divide-[rgba(255,255,255,0.04)]">
        {!isConnected ? (
          <div className="py-8 text-center">
            <p className="text-[13px] text-[#4b5563]">Connect wallet to view on-chain transaction history</p>
          </div>
        ) : loading ? (
          [1,2,3,4,5].map(i => <SkeletonRow key={i} />)
        ) : txs.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-[13px] text-[#4b5563]">No recent token transfers found</p>
            <p className="text-[10px] text-[#374151] mt-1">
              Transaction history shows ERC-20 Transfer events for USDC, WOKB, and USDT
            </p>
          </div>
        ) : (
          txs.map((tx, i) => {
            const Icon = TX_ICONS[tx.type] || Zap;
            const color = TX_COLORS[tx.type] || '#00b2ff';
            return (
              <motion.div
                key={`${tx.hash}-${tx.type}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.65 + i * 0.06 }}
                className="flex items-center gap-3 py-3 group"
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}12`, border: `1px solid ${color}22` }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-semibold text-white">{tx.type}</p>
                  <a
                    href={getExplorerTxUrl(tx.hash)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10.5px] text-[#4b5563] hover:text-[#00b2ff] font-mono flex items-center gap-1 transition-colors"
                  >
                    {tx.hash.slice(0, 10)}...{tx.hash.slice(-6)}
                    <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className={cn('text-[12.5px] font-semibold',
                    tx.amount.startsWith('+') ? 'text-[#22d3a0]'
                    : tx.amount.startsWith('-') ? 'text-[#f87171]'
                    : 'text-white'
                  )}>
                    {tx.amount}
                  </p>
                  <p className="text-[10px] text-[#4b5563]">
                    Block {tx.blockNumber.toString()}
                  </p>
                </div>

                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-[#22d3a0]" />
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}

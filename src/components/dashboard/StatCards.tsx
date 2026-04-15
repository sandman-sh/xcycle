'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { fetchWalletBalances, type WalletBalances } from '@/lib/onchain';
import { TrendingUp, Flame, RefreshCw, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatEther, type Address } from 'viem';

interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  change: string;
  positive: boolean;
  icon: React.ElementType;
  color: string;
  glowClass: string;
  delay: number;
  loading: boolean;
}

function StatCard({ label, value, sub, change, positive, icon: Icon, color, glowClass, delay, loading }: StatCardProps) {
  const [displayed, setDisplayed] = useState('...');

  useEffect(() => {
    if (!loading && value !== '...') {
      setDisplayed(value);
    }
  }, [loading, value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ scale: 1.015, y: -2 }}
      className={`glass-card ${glowClass} rounded-2xl p-5 relative overflow-hidden group cursor-default`}
    >
      {/* Background gradient orb */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 blur-2xl transition-opacity duration-500 group-hover:opacity-20"
        style={{ background: color }}
      />

      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${color}15`, border: `1px solid ${color}25` }}
        >
          <Icon className="w-4.5 h-4.5" style={{ color }} />
        </div>
        <div className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${positive ? 'text-[#22d3a0] bg-[rgba(34,211,160,0.1)]' : 'text-[#f87171] bg-[rgba(248,113,113,0.1)]'}`}>
          {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {change}
        </div>
      </div>

      {loading ? (
        <>
          <div className="skeleton h-7 w-28 mb-1.5" />
          <div className="skeleton h-3.5 w-20" />
        </>
      ) : (
        <>
          <motion.p
            key={displayed}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[22px] font-bold text-white tracking-tight mb-1"
          >
            {displayed}
          </motion.p>
          <p className="text-[12px] text-[#6b7280] font-medium">{sub}</p>
        </>
      )}

      <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.05)]">
        <p className="text-[11px] text-[#4b5563] font-medium">{label}</p>
      </div>
    </motion.div>
  );
}

export function StatCards() {
  const { address, isConnected } = useAccount();
  const [balances, setBalances] = useState<WalletBalances | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch native balance via wagmi hook for reactivity
  const { data: nativeBalanceData } = useBalance({
    address: address as Address | undefined,
  });

  useEffect(() => {
    if (isConnected && address) {
      setLoading(true);
      fetchWalletBalances(address as Address)
        .then(b => {
          setBalances(b);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setBalances(null);
      setLoading(false);
    }
  }, [address, isConnected]);

  const nativeFormatted = nativeBalanceData
    ? parseFloat(formatEther(nativeBalanceData.value)).toFixed(4)
    : balances?.nativeBalance
      ? parseFloat(balances.nativeBalance).toFixed(4)
      : '0.0000';

  const usdcFormatted = balances
    ? parseFloat(balances.usdcBalance).toFixed(2)
    : '0.00';

  const wokbFormatted = balances
    ? parseFloat(balances.wokbBalance).toFixed(4)
    : '0.0000';

  const usdtFormatted = balances
    ? parseFloat(balances.usdtBalance).toFixed(2)
    : '0.00';

  const cards: Omit<StatCardProps, 'delay' | 'loading'>[] = [
    {
      label: 'Native Balance (OKB)',
      value: isConnected ? `${nativeFormatted} OKB` : 'Not Connected',
      sub: isConnected ? `Chain ID: ${balances?.chainId ?? 195}` : 'Connect wallet to view',
      change: isConnected ? 'Live' : '—',
      positive: true,
      icon: TrendingUp,
      color: '#00b2ff',
      glowClass: 'stat-glow-blue',
    },
    {
      label: 'USDC Balance',
      value: isConnected ? `${usdcFormatted} USDC` : 'Not Connected',
      sub: isConnected ? 'ERC-20 on X Layer Testnet' : 'Connect wallet to view',
      change: isConnected ? 'Live' : '—',
      positive: true,
      icon: Flame,
      color: '#f59e0b',
      glowClass: 'stat-glow-gold',
    },
    {
      label: 'WOKB Balance',
      value: isConnected ? `${wokbFormatted} WOKB` : 'Not Connected',
      sub: isConnected ? 'Wrapped OKB on X Layer' : 'Connect wallet to view',
      change: isConnected ? 'Live' : '—',
      positive: true,
      icon: RefreshCw,
      color: '#22d3a0',
      glowClass: 'stat-glow-green',
    },
    {
      label: 'USDT Balance',
      value: isConnected ? `${usdtFormatted} USDT` : 'Not Connected',
      sub: isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Connect wallet to view',
      change: isConnected ? 'Live' : '—',
      positive: true,
      icon: Wallet,
      color: '#8b5cf6',
      glowClass: 'stat-glow-purple',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <StatCard key={card.label} {...card} delay={i * 0.1} loading={isConnected && loading} />
      ))}
    </div>
  );
}

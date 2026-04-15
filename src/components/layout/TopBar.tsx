'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Copy, CheckCheck, ExternalLink, Wifi, AlertTriangle, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { getExplorerAddressUrl, xLayerTestnet } from '@/lib/wagmi';

import { useAccount, useConnect, useDisconnect, useSwitchChain, useBalance } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { formatEther } from 'viem';

function XCycleLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative w-8 h-8 flex items-center justify-center">
        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-[#00b2ff] to-[#7c3aed] opacity-20 blur-sm" />
        <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-[#0090cc] to-[#6d28d9] flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 2L15 6V12L9 16L3 12V6L9 2Z" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="9" cy="9" r="2.5" fill="#00b2ff"/>
            <path d="M9 4V7M9 11V14M4 7L7 8.5M11 9.5L14 11" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
      <div className="flex flex-col leading-none">
        <span className="font-bold text-[15px] tracking-tight text-white">xCycle</span>
        <span className="text-[10px] text-[#6b7280] font-medium tracking-wider">TESTNET · LIVE</span>
      </div>
    </div>
  );
}

function NetworkBadge() {
  const { chain, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();
  const isWrongNetwork = isConnected && chain?.id !== xLayerTestnet.id;

  if (isWrongNetwork) {
    return (
      <button
        onClick={() => switchChain({ chainId: xLayerTestnet.id })}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.2)] hover:bg-[rgba(248,113,113,0.15)] transition-colors"
      >
        <AlertTriangle className="w-3 h-3 text-[#f87171]" />
        <span className="text-[11px] font-semibold text-[#f87171]">
          Switch to X Layer
        </span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(0,178,255,0.08)] border border-[rgba(0,178,255,0.15)]">
      <div className="relative w-2 h-2">
        {isConnected && (
          <div className="absolute inset-0 rounded-full bg-[#00b2ff] opacity-60 animate-ping" />
        )}
        <div className={cn(
          "relative w-2 h-2 rounded-full",
          isConnected ? "bg-[#00b2ff]" : "bg-[#4b5563]"
        )} />
      </div>
      <Wifi className={cn("w-3 h-3", isConnected ? "text-[#00b2ff]" : "text-[#4b5563]")} />
      <span className={cn(
        "text-[11px] font-semibold tracking-wide",
        isConnected ? "text-[#00b2ff]" : "text-[#4b5563]"
      )}>
        {isConnected ? (chain?.name ?? 'X Layer Testnet') : 'Not Connected'}
      </span>
    </div>
  );
}

function WalletChip() {
  const { address, isConnected, chain } = useAccount();
  const { connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const [copied, setCopied] = useState(false);

  // Fetch real balance with wagmi
  const { data: balanceData } = useBalance({ address });

  const copy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isConnected) {
    return (
      <button
        onClick={() => connect({ connector: injected() })}
        disabled={isConnecting}
        className="px-4 py-1.5 rounded-xl bg-[#00b2ff] text-black font-semibold text-[13px] transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    );
  }

  const displayBalance = balanceData
    ? `${parseFloat(balanceData.formatted).toFixed(4)} ${balanceData.symbol}`
    : '...';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-card cursor-pointer hover:border-[rgba(0,178,255,0.2)] transition-all group"
    >
      <div className="w-2 h-2 rounded-full bg-[#22d3a0] shadow-[0_0_8px_rgba(34,211,160,0.8)]" />
      <div className="flex flex-col leading-none">
        <span className="text-[10px] text-[#6b7280] font-medium">{displayBalance}</span>
        <span className="text-[13px] font-semibold text-white font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); copy(); }}
        className={cn(
          "ml-1 p-1 rounded-md transition-all",
          copied ? "text-[#22d3a0]" : "text-[#6b7280] hover:text-white"
        )}
        title="Copy address"
      >
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              <CheckCheck className="w-3.5 h-3.5" />
            </motion.div>
          ) : (
            <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              <Copy className="w-3.5 h-3.5" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
      <a
        href={address ? getExplorerAddressUrl(address) : '#'}
        target="_blank"
        rel="noreferrer"
        className="p-1 rounded-md text-[#6b7280] hover:text-[#00b2ff] transition-colors"
        title="View on Explorer"
      >
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
      <button
        onClick={() => disconnect()}
        className="p-1 rounded-md text-[#6b7280] hover:text-[#f87171] transition-colors text-[10px]"
        title="Disconnect"
      >
        ✕
      </button>
    </motion.div>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-8 h-8" />;

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6b7280] hover:text-[#00b2ff] hover:bg-[rgba(255,255,255,0.04)] transition-colors"
      title="Toggle Theme"
    >
      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}

export function TopBar() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-5 
        border-b border-[rgba(255,255,255,0.06)] bg-[rgba(10,10,12,0.85)] backdrop-blur-xl"
    >
      {/* Left: Logo */}
      <XCycleLogo />

      {/* Center: Live indicator */}
      <div className="hidden md:flex items-center gap-2 text-[12px]">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[rgba(34,211,160,0.06)] border border-[rgba(34,211,160,0.1)]">
          <div className="w-1.5 h-1.5 rounded-full bg-[#22d3a0] animate-pulse" />
          <span className="text-[#22d3a0] font-medium">Real Transactions</span>
        </div>
        <span className="text-[#4b5563]">·</span>
        <span className="text-[#4b5563] font-medium">OnchainOS Skills</span>
      </div>

      {/* Right: Network + Wallet */}
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <NetworkBadge />
        <WalletChip />
      </div>
    </motion.header>
  );
}

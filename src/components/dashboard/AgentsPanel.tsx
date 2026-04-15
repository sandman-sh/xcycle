'use client';

import { motion } from 'framer-motion';
import { Shield, Eye, Cpu, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccount } from 'wagmi';
import { xLayerTestnet } from '@/lib/wagmi';

const AGENTS = [
  {
    id: 'scout',
    name: 'Scout Agent',
    role: 'Discovers pools & fetches quotes via OKX DEX API',
    icon: Eye,
    color: '#00b2ff',
    skill: 'okx-dex-market · okx-dex-token',
  },
  {
    id: 'guardian',
    name: 'Guardian Agent',
    role: 'Token risk scan via OKX Security + viem getCode',
    icon: Shield,
    color: '#22d3a0',
    skill: 'okx-security · viem',
  },
  {
    id: 'executor',
    name: 'Executor Agent',
    role: 'Sends real on-chain transactions via wagmi',
    icon: Cpu,
    color: '#8b5cf6',
    skill: 'okx-onchain-gateway · wagmi',
  },
  {
    id: 'paymaster',
    name: 'Paymaster Agent',
    role: 'Agent-to-agent OKB transfers for x402 loop',
    icon: DollarSign,
    color: '#f59e0b',
    skill: 'okx-x402-payment',
  },
];

export function AgentsPanel() {
  const { isConnected, chain } = useAccount();
  const isCorrectChain = chain?.id === xLayerTestnet.id;
  const allActive = isConnected && isCorrectChain;
  const activeCount = allActive ? 4 : isConnected ? 2 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55, duration: 0.45 }}
      className="glass-card rounded-2xl overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.05)]">
        <h3 className="text-[15px] font-semibold text-white">Agent System</h3>
        <span className={cn(
          "text-[11px] font-semibold px-2.5 py-1 rounded-full border",
          allActive
            ? "text-[#22d3a0] bg-[rgba(34,211,160,0.08)] border-[rgba(34,211,160,0.15)]"
            : isConnected
              ? "text-[#f59e0b] bg-[rgba(245,158,11,0.08)] border-[rgba(245,158,11,0.15)]"
              : "text-[#f87171] bg-[rgba(248,113,113,0.08)] border-[rgba(248,113,113,0.15)]"
        )}>
          {activeCount}/4 {allActive ? 'Active' : isConnected ? 'Partial' : 'Offline'}
        </span>
      </div>

      {!isConnected && (
        <div className="px-5 py-2 bg-[rgba(248,113,113,0.04)] border-b border-[rgba(248,113,113,0.08)]">
          <p className="text-[10px] text-[#f87171]">
            Connect wallet to activate agents (MetaMask → X Layer Testnet)
          </p>
        </div>
      )}

      {isConnected && !isCorrectChain && (
        <div className="px-5 py-2 bg-[rgba(245,158,11,0.04)] border-b border-[rgba(245,158,11,0.08)]">
          <p className="text-[10px] text-[#f59e0b]">
            Switch to X Layer Testnet (Chain ID {xLayerTestnet.id}) for full agent access
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-0 divide-x divide-y divide-[rgba(255,255,255,0.04)]">
        {AGENTS.map((agent, i) => {
          const isActive = i < activeCount;
          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + i * 0.07 }}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
              className="p-4 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: isActive ? `${agent.color}15` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isActive ? `${agent.color}25` : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  <agent.icon
                    className="w-4 h-4"
                    style={{ color: isActive ? agent.color : '#4b5563' }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className={cn(
                      "text-[12px] font-semibold truncate",
                      isActive ? 'text-white' : 'text-[#6b7280]'
                    )}>{agent.name}</p>
                    <div className="relative flex-shrink-0">
                      {isActive && (
                        <div
                          className="absolute inset-0 rounded-full opacity-60 animate-ping"
                          style={{ background: agent.color }}
                        />
                      )}
                      <div
                        className="w-1.5 h-1.5 rounded-full relative"
                        style={{ background: isActive ? agent.color : '#4b5563' }}
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-[#4b5563] leading-[1.4] mb-1.5">{agent.role}</p>
                  <span
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded-md"
                    style={{
                      color: isActive ? agent.color : '#4b5563',
                      background: isActive ? `${agent.color}10` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isActive ? `${agent.color}20` : 'rgba(255,255,255,0.06)'}`,
                    }}
                  >
                    {agent.skill}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

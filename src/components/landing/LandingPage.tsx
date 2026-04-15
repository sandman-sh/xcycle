'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Shield, Eye, Cpu, DollarSign, Zap, BarChart3, Lock, RefreshCw, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

const SKILLS = [
  { icon: Eye,        name: 'okx-agentic-wallet',   desc: 'Real on-chain balance reads' },
  { icon: BarChart3,  name: 'okx-dex-market',        desc: 'DEX quotes & pool discovery' },
  { icon: Shield,     name: 'okx-security',           desc: 'Token risk scanning' },
  { icon: Zap,        name: 'okx-dex-swap',            desc: 'Swap transaction calldata' },
  { icon: Lock,       name: 'okx-onchain-gateway',    desc: 'Gas estimation & broadcast' },
  { icon: DollarSign, name: 'okx-x402-payment',       desc: 'Agent-to-agent transfers' },
];

const AGENTS = [
  { icon: Eye,        name: 'Scout',      color: '#00b2ff', desc: 'Discovers optimal pools' },
  { icon: Shield,     name: 'Guardian',    color: '#22d3a0', desc: 'Verifies token safety' },
  { icon: Cpu,        name: 'Executor',    color: '#8b5cf6', desc: 'Sends real transactions' },
  { icon: DollarSign, name: 'Paymaster',   color: '#f59e0b', desc: 'Routes x402 payments' },
];

export function LandingPage({ onEnter }: { onEnter: () => void }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-background overflow-hidden relative selection:bg-[#00b2ff]/30">
      {/* Immersive Floating Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [-20, 20, -20], y: [-20, 30, -20] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#00b2ff] opacity-[0.03] blur-[120px]"
        />
        <motion.div
          animate={{ x: [20, -30, 20], y: [20, -20, 20] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#7c3aed] opacity-[0.04] blur-[100px]"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.02, 0.04, 0.02] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[#22d3a0] blur-[100px]"
        />
      </div>

      {/* Top bar */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex items-center justify-between px-8 py-5"
      >
        <div className="flex items-center gap-2.5">
          <div className="relative w-9 h-9 flex items-center justify-center">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-[#00b2ff] to-[#7c3aed] opacity-20 blur-sm" />
            <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-[#0090cc] to-[#6d28d9] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
                <path d="M9 2L15 6V12L9 16L3 12V6L9 2Z" stroke="white" strokeWidth="1.5" fill="none"/>
                <circle cx="9" cy="9" r="2.5" fill="#00b2ff"/>
                <path d="M9 4V7M9 11V14M4 7L7 8.5M11 9.5L14 11" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          <span className="font-bold text-[17px] tracking-tight text-white">xCycle</span>
        </div>
        <div className="flex items-center gap-4 hidden sm:flex">
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6b7280] hover:text-[#00b2ff] hover:bg-[rgba(255,255,255,0.04)] transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}
          <span className="text-[12px] text-[#4b5563]">X Layer Testnet · Chain ID 1952</span>
          <a
            href="https://github.com/sandman-sh/xcycle"
            target="_blank"
            rel="noreferrer"
            className="text-[12px] text-[#6b7280] hover:text-white transition-colors"
          >
            GitHub
          </a>
        </div>
      </motion.nav>

      {/* Hero */}
      <div className="relative z-10 max-w-5xl mx-auto px-8 pt-12 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[rgba(0,178,255,0.08)] border border-[rgba(0,178,255,0.15)] mb-8"
          >
            <div className="w-2 h-2 rounded-full bg-[#22d3a0] animate-pulse" />
            <span className="text-[12px] font-semibold text-[#00b2ff]">Built on X Layer · OKX OnchainOS</span>
          </motion.div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
            Autonomous DeFi Agent
            <br />
            <span className="bg-gradient-to-r from-[#00b2ff] via-[#7c3aed] to-[#22d3a0] bg-clip-text text-transparent">
              Earn → Pay → Earn
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-[16px] sm:text-[18px] text-[#6b7280] max-w-2xl mx-auto mb-10 leading-relaxed">
            xCycle uses <strong className="text-white">4 AI agents</strong> and{' '}
            <strong className="text-white">6 OKX OnchainOS skills</strong> to autonomously manage 
            Uniswap V3 liquidity on X Layer — discovering pools, verifying safety, 
            executing trades, and reinvesting fees in a self-sustaining loop.
          </p>

          {/* CTA */}
          <motion.button
            onClick={onEnter}
            whileHover={{ scale: 1.04, boxShadow: '0 0 40px rgba(0,178,255,0.3)' }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#00b2ff] to-[#0090cc] text-black font-bold text-[15px] shadow-lg shadow-[rgba(0,178,255,0.2)] transition-all"
          >
            Launch Dashboard
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>

        {/* Flow diagram */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-16 flex items-center justify-center gap-3 flex-wrap"
        >
          {['Scout Pools', 'Verify Safety', 'Execute Trade', 'Earn Fees', 'Pay Agent', 'Reinvest'].map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)]">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#00b2ff] to-[#7c3aed] flex items-center justify-center text-[9px] font-bold text-white">
                  {i + 1}
                </div>
                <span className="text-[12px] font-medium text-[#9ca3af]">{step}</span>
              </div>
              {i < 5 && <span className="text-[#4b5563] text-sm">→</span>}
            </div>
          ))}
          <span className="text-[#22d3a0] text-sm font-semibold ml-1">↻ Loop</span>
        </motion.div>
      </div>

      {/* Agents Section */}
      <div className="relative z-10 max-w-5xl mx-auto px-8 pb-12 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-center text-[13px] font-semibold text-[#4b5563] uppercase tracking-widest mb-6">
            Multi-Agent System
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {AGENTS.map((agent, i) => (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.08 }}
                className="glass-card rounded-2xl p-5 text-center group hover:border-[rgba(255,255,255,0.12)] transition-all"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-transform group-hover:scale-110"
                  style={{ background: `${agent.color}12`, border: `1px solid ${agent.color}25` }}
                >
                  <agent.icon className="w-5 h-5" style={{ color: agent.color }} />
                </div>
                <p className="text-[14px] font-bold text-white mb-1">{agent.name}</p>
                <p className="text-[11px] text-[#4b5563]">{agent.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Skills Section */}
      <div className="relative z-10 max-w-5xl mx-auto px-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-center text-[13px] font-semibold text-[#4b5563] uppercase tracking-widest mb-6">
            6 OnchainOS Skills · Zero Mocks
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {SKILLS.map((skill, i) => (
              <motion.div
                key={skill.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.05 }}
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(0,178,255,0.3)] hover:shadow-[0_0_15px_rgba(0,178,255,0.1)] transition-all cursor-default"
              >
                <skill.icon className="w-4 h-4 text-[#00b2ff] flex-shrink-0" />
                <div>
                  <p className="text-[12px] font-mono font-semibold text-white">{skill.name}</p>
                  <p className="text-[10px] text-[#4b5563]">{skill.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom bar */}
      <div className="relative z-10 border-t border-[rgba(255,255,255,0.05)] py-6 px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <p className="text-[11px] text-[#374151]">
            X Layer Hackathon · Built with Next.js, Wagmi, Viem, OKX OnchainOS
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22d3a0] animate-pulse" />
              <span className="text-[11px] text-[#22d3a0] font-medium">Testnet Live</span>
            </div>
            <div className="flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3 text-[#4b5563]" />
              <span className="text-[11px] text-[#4b5563]">Real Transactions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

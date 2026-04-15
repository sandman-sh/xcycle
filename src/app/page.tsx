'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LandingPage } from '@/components/landing/LandingPage';
import { TopBar }        from '@/components/layout/TopBar';
import { Sidebar }       from '@/components/layout/Sidebar';
import { StatCards }     from '@/components/dashboard/StatCards';
import { PositionsTable} from '@/components/dashboard/PositionsTable';
import { AgentChat }     from '@/components/dashboard/AgentChat';
import { AgentsPanel }   from '@/components/dashboard/AgentsPanel';
import { CycleHistory }  from '@/components/dashboard/CycleHistory';
import { APYChart }      from '@/components/dashboard/APYChart';
import { useAgentConfig } from '@/lib/agent-config';
import { useAccount } from 'wagmi';
import { CONTRACTS, CHAIN_CONFIG } from '@/lib/contracts';
import { getExplorerAddressUrl } from '@/lib/wagmi';
import { ExternalLink, Check, RotateCcw, Save } from 'lucide-react';

type NavId = 'dashboard' | 'positions' | 'cycle-history' | 'agent-chat' | 'analytics' | 'settings';

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      key="page"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {children}
    </motion.div>
  );
}

function DashboardPage() {
  return (
    <PageWrapper>
      <StatCards />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
        <div className="flex flex-col gap-5">
          <PositionsTable />
          <APYChart />
        </div>
        <AgentChat />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <AgentsPanel />
        <CycleHistory />
      </div>
    </PageWrapper>
  );
}

function PositionsPage() {
  return (
    <PageWrapper>
      <div className="flex flex-col gap-5">
        <PositionsTable />
        <APYChart />
      </div>
    </PageWrapper>
  );
}

function HistoryPage() {
  return (
    <PageWrapper>
      <CycleHistory />
    </PageWrapper>
  );
}

function ChatPage() {
  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto h-[calc(100vh-10rem)]">
        <AgentChat />
      </div>
    </PageWrapper>
  );
}

function AnalyticsPage() {
  return (
    <PageWrapper>
      <StatCards />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <APYChart />
        <AgentsPanel />
      </div>
      <CycleHistory />
    </PageWrapper>
  );
}

function SettingsPage() {
  const { config, updateConfig, resetConfig } = useAgentConfig();
  const { address, isConnected, chain } = useAccount();
  const [saved, setSaved] = useState(false);
  const [localSlippage, setLocalSlippage] = useState(config.maxSlippage.toString());
  const [localReinvest, setLocalReinvest] = useState(config.autoReinvestPct);
  const [localCycleInterval, setLocalCycleInterval] = useState(config.cycleIntervalMinutes.toString());

  const handleSave = () => {
    updateConfig({
      maxSlippage: parseFloat(localSlippage) || 0.5,
      autoReinvestPct: localReinvest,
      cycleIntervalMinutes: parseInt(localCycleInterval) || 60,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    resetConfig();
    setLocalSlippage('0.5');
    setLocalReinvest(98);
    setLocalCycleInterval('60');
  };

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Wallet Info Card */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Wallet & Network</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.05)]">
              <span className="text-[12px] text-[#6b7280]">Status</span>
              <span className={`text-[12px] font-semibold ${isConnected ? 'text-[#22d3a0]' : 'text-[#f87171]'}`}>
                {isConnected ? '● Connected' : '○ Disconnected'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.05)]">
              <span className="text-[12px] text-[#6b7280]">Address</span>
              <span className="text-[12px] font-mono text-white">
                {address ? `${address.slice(0, 10)}...${address.slice(-6)}` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.05)]">
              <span className="text-[12px] text-[#6b7280]">Network</span>
              <span className="text-[12px] font-semibold text-white">
                {chain?.name ?? 'Not Connected'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.05)]">
              <span className="text-[12px] text-[#6b7280]">Chain ID</span>
              <span className="text-[12px] font-mono text-[#00b2ff]">
                {chain?.id ?? '—'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-[12px] text-[#6b7280]">Faucet</span>
              <a
                href={CHAIN_CONFIG.faucetUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[12px] text-[#00b2ff] hover:underline"
              >
                Get testnet OKB <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Contract Addresses Card */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Contract Addresses</h2>
          <div className="space-y-2">
            {[
              { label: 'USDC', addr: CONTRACTS.USDC },
              { label: 'USDT', addr: CONTRACTS.USDT },
              { label: 'WOKB', addr: CONTRACTS.WOKB },
              { label: 'Uniswap V3 Router', addr: CONTRACTS.UNISWAP_V3_ROUTER },
              { label: 'Position Manager', addr: CONTRACTS.UNISWAP_V3_POSITION_MANAGER },
            ].map(({ label, addr }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.05)] last:border-0">
                <span className="text-[12px] text-[#6b7280]">{label}</span>
                <a
                  href={getExplorerAddressUrl(addr)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[11px] font-mono text-[#00b2ff] hover:underline"
                >
                  {addr.slice(0, 10)}...{addr.slice(-6)} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Agent Configuration Card */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-6">Agent Configuration</h2>
          <div className="space-y-6">

            {/* Risk Tolerance */}
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-white">Risk Tolerance</label>
              <p className="text-[11px] text-[#4b5563]">Controls pool selection and position parameters.</p>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {(['low', 'medium', 'high'] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => updateConfig({ riskLevel: r })}
                    className={`py-2 rounded-xl text-[12px] font-medium border transition-colors capitalize ${
                      config.riskLevel === r
                        ? 'bg-[rgba(0,178,255,0.1)] border-[rgba(0,178,255,0.3)] text-[#00b2ff]'
                        : 'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.08)] text-[#6b7280] hover:text-white'
                    }`}
                  >
                    {r} Risk
                  </button>
                ))}
              </div>
            </div>

            {/* Auto-Reinvest */}
            <div className="space-y-2 pt-4 border-t border-[rgba(255,255,255,0.05)]">
              <label className="text-[13px] font-semibold text-white">Auto-Reinvest Percentage</label>
              <p className="text-[11px] text-[#4b5563]">Portion of earned fees to compound back into positions.</p>
              <div className="flex items-center gap-4 mt-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={localReinvest}
                  onChange={e => setLocalReinvest(parseInt(e.target.value))}
                  className="w-full accent-[#00b2ff]"
                />
                <span className="text-[13px] font-mono text-[#00b2ff] min-w-[40px]">{localReinvest}%</span>
              </div>
            </div>

            {/* Max Slippage */}
            <div className="space-y-2 pt-4 border-t border-[rgba(255,255,255,0.05)]">
              <label className="text-[13px] font-semibold text-white">Max Slippage</label>
              <p className="text-[11px] text-[#4b5563]">Maximum price slippage tolerance for swaps.</p>
              <div className="flex bg-[rgba(255,255,255,0.05)] rounded-xl overflow-hidden border border-[rgba(255,255,255,0.08)]">
                <input
                  type="text"
                  value={localSlippage}
                  onChange={e => setLocalSlippage(e.target.value)}
                  className="w-full bg-transparent px-3 py-2 text-[13px] text-white outline-none"
                />
                <div className="px-3 py-2 text-[13px] text-[#6b7280] bg-[rgba(255,255,255,0.02)] border-l border-[rgba(255,255,255,0.08)]">%</div>
              </div>
            </div>

            {/* Cycle Interval */}
            <div className="space-y-2 pt-4 border-t border-[rgba(255,255,255,0.05)]">
              <label className="text-[13px] font-semibold text-white">Cycle Interval</label>
              <p className="text-[11px] text-[#4b5563]">How often the agent checks and rebalances (minutes).</p>
              <div className="flex bg-[rgba(255,255,255,0.05)] rounded-xl overflow-hidden border border-[rgba(255,255,255,0.08)]">
                <input
                  type="text"
                  value={localCycleInterval}
                  onChange={e => setLocalCycleInterval(e.target.value)}
                  className="w-full bg-transparent px-3 py-2 text-[13px] text-white outline-none"
                />
                <div className="px-3 py-2 text-[13px] text-[#6b7280] bg-[rgba(255,255,255,0.02)] border-l border-[rgba(255,255,255,0.08)]">min</div>
              </div>
            </div>

            {/* x402 Agent Fee */}
            <div className="space-y-2 pt-4 border-t border-[rgba(255,255,255,0.05)]">
              <label className="text-[13px] font-semibold text-white">x402 Agent Fee</label>
              <p className="text-[11px] text-[#4b5563]">Percentage of yield paid to the x402 protocol (read-only).</p>
              <div className="flex bg-[rgba(255,255,255,0.03)] rounded-xl overflow-hidden border border-[rgba(255,255,255,0.06)]">
                <input
                  type="text"
                  value={config.x402FeePercent}
                  disabled
                  className="w-full bg-transparent px-3 py-2 text-[13px] text-[#6b7280] outline-none cursor-not-allowed"
                />
                <div className="px-3 py-2 text-[13px] text-[#4b5563] bg-[rgba(255,255,255,0.02)] border-l border-[rgba(255,255,255,0.06)]">%</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6">
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 rounded-xl bg-[#00b2ff] text-black font-semibold text-[13px] hover:bg-[#009ce0] transition-colors flex items-center justify-center gap-2"
              >
                {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Configuration</>}
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[#6b7280] hover:text-white font-semibold text-[13px] transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

const PAGE_MAP: Record<NavId, React.ReactNode> = {
  'dashboard':     <DashboardPage />,
  'positions':     <PositionsPage />,
  'cycle-history': <HistoryPage />,
  'agent-chat':    <ChatPage />,
  'analytics':     <AnalyticsPage />,
  'settings':      <SettingsPage />,
};

const PAGE_TITLES: Record<NavId, { title: string, sub: string }> = {
  'dashboard':     { title: 'Dashboard',      sub: 'Live on-chain data · X Layer Testnet (Chain ID 1952)' },
  'positions':     { title: 'LP Positions',   sub: 'Uniswap V3 active pools and fee generation' },
  'cycle-history': { title: 'Transaction History', sub: 'Real ERC-20 Transfer events from X Layer Testnet' },
  'agent-chat':    { title: 'Agent Chat',      sub: 'Execute real on-chain transactions via natural language' },
  'analytics':     { title: 'Analytics',       sub: 'Live network data and agent performance' },
  'settings':      { title: 'Settings',        sub: 'Agent configuration, wallet info, and contract addresses' },
};

export default function Home() {
  const [active, setActive] = useState<NavId>('dashboard');
  const [showLanding, setShowLanding] = useState(true);

  if (showLanding) {
    return <LandingPage onEnter={() => setShowLanding(false)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Sidebar active={active} onNavigate={(id) => setActive(id as NavId)} />

      {/* Main scroll area — offset for fixed topbar + sidebar */}
      <main className="pl-[200px] pt-14 min-h-screen">
        <div className="px-6 py-6 max-w-[1400px]">

          {/* Page header */}
          <div className="mb-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {PAGE_TITLES[active].title}
                </h1>
                <p className="text-[13px] text-[#4b5563] mt-0.5">
                  {PAGE_TITLES[active].sub}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Page content */}
          <AnimatePresence mode="wait">
            <div key={active}>
              {PAGE_MAP[active]}
            </div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

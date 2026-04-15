// ============================================================
// Agent Configuration Store
// Persists settings in localStorage, consumed by all components
// ============================================================

'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export interface AgentConfig {
  riskLevel: 'low' | 'medium' | 'high';
  autoReinvestPct: number;        // 0-100
  maxSlippage: number;            // e.g. 0.5
  cycleIntervalMinutes: number;   // how often to auto-cycle
  paused: boolean;
  preferredPools: string[];       // pool addresses user prefers
  x402FeePercent: number;         // agent fee percentage
}

const DEFAULT_CONFIG: AgentConfig = {
  riskLevel: 'medium',
  autoReinvestPct: 98,
  maxSlippage: 0.5,
  cycleIntervalMinutes: 60,
  paused: false,
  preferredPools: [],
  x402FeePercent: 2,
};

const STORAGE_KEY = 'xcycle-agent-config';

interface AgentConfigContextValue {
  config: AgentConfig;
  updateConfig: (partial: Partial<AgentConfig>) => void;
  resetConfig: () => void;
}

const AgentConfigContext = createContext<AgentConfigContextValue>({
  config: DEFAULT_CONFIG,
  updateConfig: () => {},
  resetConfig: () => {},
});

export function AgentConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AgentConfig>(DEFAULT_CONFIG);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setConfig({ ...DEFAULT_CONFIG, ...parsed });
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (hydrated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      } catch {
        // ignore
      }
    }
  }, [config, hydrated]);

  const updateConfig = useCallback((partial: Partial<AgentConfig>) => {
    setConfig(prev => ({ ...prev, ...partial }));
  }, []);

  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, []);

  return (
    <AgentConfigContext.Provider value={{ config, updateConfig, resetConfig }}>
      {children}
    </AgentConfigContext.Provider>
  );
}

export function useAgentConfig() {
  return useContext(AgentConfigContext);
}

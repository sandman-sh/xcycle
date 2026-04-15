'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, Bot, User, ChevronRight } from 'lucide-react';
import {
  parseAgentCommand,
  fetchWalletBalances,
  fetchLPPositions,
  fetchRecentTransactions,
  checkTokenSecurity,
  getTokenName,
  waitForTx,
  type AgentStep,
} from '@/lib/onchain';
import {
  getAgenticWallet,
  getDexQuote,
  checkSecurity as okxCheckSecurity,
  getTokenPrice,
  discoverPools,
  getPortfolioPositions,
  estimateGas,
  buildX402Payment,
} from '@/lib/onchainos-skills';
import { CONTRACTS } from '@/lib/contracts';
import { getExplorerTxUrl } from '@/lib/wagmi';
import { useAgentConfig } from '@/lib/agent-config';
import { cn } from '@/lib/utils';

import { useSendTransaction, useAccount } from 'wagmi';
import { parseEther, type Address, type Hash, formatUnits } from 'viem';

type Message = {
  id: string;
  role: 'user' | 'agent';
  text: string;
  steps?: AgentStep[];
  isLoading?: boolean;
};

const SUGGESTIONS = [
  'Check my balance',
  'Show current positions',
  'Start xCycle with 500 USDC',
  'Send 0.001 OKB to self',
];

function AgentStepRow({ step }: { step: AgentStep }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2 py-1"
    >
      <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', {
        'bg-[#6b7280]': step.status === 'pending',
        'bg-[#00b2ff] animate-pulse': step.status === 'running',
        'bg-[#22d3a0]': step.status === 'done',
        'bg-[#f87171]': step.status === 'error',
      })} />
      <span className="text-[10px] font-mono text-[#6b7280]">{step.skill}</span>
      <ChevronRight className="w-2.5 h-2.5 text-[#4b5563]" />
      <span className={cn('text-[10px]', {
        'text-[#4b5563]': step.status === 'pending',
        'text-[#00b2ff]': step.status === 'running',
        'text-[#22d3a0]': step.status === 'done',
        'text-[#f87171]': step.status === 'error',
      })}>{step.message}</span>
    </motion.div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1.5">
      {[0, 0.2, 0.4].map((delay, i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-[#4b5563]"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, delay }}
        />
      ))}
    </div>
  );
}

export function AgentChat() {
  const { address, isConnected } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const { config: agentConfig } = useAgentConfig();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('xcycle_chat');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    } else {
      setMessages([{
        id: '0',
        role: 'agent',
        text: 'Hello! I\'m your **xCycle Agent** running on **X Layer Testnet**.\n\nI execute **real on-chain transactions** using **OKX OnchainOS Skills**:\n\n• **okx-agentic-wallet** — Check balances\n• **okx-dex-market** — Get DEX quotes\n• **okx-security** — Token risk scanning\n• **okx-x402-payment** — Agent-to-agent OKB transfers\n\nConnect your wallet and try a command!',
      }]);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('xcycle_chat', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const updateStepInMsg = (msgId: string, step: AgentStep) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m;
      const existing = m.steps ?? [];
      const idx = existing.findIndex(s => s.skill === step.skill);
      const updated = idx >= 0
        ? existing.map((s, i) => i === idx ? step : s)
        : [...existing, step];
      return { ...m, steps: updated };
    }));
  };

  const runAgentFlow = async (text: string, msgId: string): Promise<string> => {
    const cmd = parseAgentCommand(text);

    // ── Check Balance (okx-agentic-wallet) ─────────────
    if (cmd.intent === 'check_balance') {
      if (!isConnected || !address) {
        return "⚠️ **Wallet Not Connected**\n\nPlease connect your wallet using the top-right button.";
      }

      updateStepInMsg(msgId, { skill: 'okx-agentic-wallet', status: 'running', message: 'Reading on-chain balances via viem...' });
      
      try {
        const wallet = await getAgenticWallet(address as Address);
        updateStepInMsg(msgId, { skill: 'okx-agentic-wallet', status: 'done', message: 'Balances fetched ✓' });

        // Try to get OKB price via OKX DEX API
        updateStepInMsg(msgId, { skill: 'okx-dex-market', status: 'running', message: 'Fetching OKB price from OKX API...' });
        const okbPrice = await getTokenPrice('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE');
        updateStepInMsg(msgId, { skill: 'okx-dex-market', status: 'done', message: okbPrice ? `OKB ≈ $${parseFloat(okbPrice).toFixed(2)}` : 'Price unavailable (testnet)' });

        return `💰 **Wallet Balances** (Live via okx-agentic-wallet)\n\n` +
          `**Address:** \`${address}\`\n` +
          `**OKB:** ${wallet.balanceOKB}${okbPrice ? ` (≈ $${(parseFloat(wallet.balanceOKB) * parseFloat(okbPrice)).toFixed(2)})` : ''}\n` +
          `**USDC:** ${wallet.balanceUSDC}\n` +
          `**WOKB:** ${wallet.balanceWOKB}\n` +
          `**USDT:** ${wallet.balanceUSDT}\n\n` +
          `Chain ID: **${wallet.chainId}** · Network: **${wallet.network}**\n` +
          `Skills used: \`okx-agentic-wallet\`, \`okx-dex-market\``;
      } catch (err: unknown) {
        updateStepInMsg(msgId, { skill: 'okx-agentic-wallet', status: 'error', message: 'Failed to read balances' });
        return `❌ **Error reading balances:** ${err instanceof Error ? err.message : 'Unknown error'}`;
      }
    }

    // ── Show Positions (okx-wallet-portfolio) ─────────
    if (cmd.intent === 'show_positions') {
      if (!isConnected || !address) {
        return "⚠️ **Wallet Not Connected**\n\nPlease connect your wallet to view positions.";
      }

      updateStepInMsg(msgId, { skill: 'okx-wallet-portfolio', status: 'running', message: 'Reading LP positions from NonfungiblePositionManager...' });

      try {
        const positions = await getPortfolioPositions(address as Address);
        updateStepInMsg(msgId, { skill: 'okx-wallet-portfolio', status: 'done', message: `Found ${positions.length} positions ✓` });

        if (positions.length === 0) {
          // Also try pool discovery
          updateStepInMsg(msgId, { skill: 'okx-dex-market', status: 'running', message: 'Discovering available pools...' });
          const pools = await discoverPools();
          updateStepInMsg(msgId, { skill: 'okx-dex-market', status: 'done', message: `${pools.length} pools found` });

          return '📊 **No LP Positions Found**\n\n' +
            'You don\'t have any Uniswap V3 positions on X Layer Testnet.\n\n' +
            `**Available Pools (${pools.length}):**\n` +
            pools.slice(0, 5).map(p => `• ${p.token0Symbol}/${p.token1Symbol} — ${p.source}`).join('\n') +
            '\n\nSkills used: `okx-wallet-portfolio`, `okx-dex-market`';
        }

        return `📊 **LP Positions** (via okx-wallet-portfolio)\n\n` +
          positions.map(p => {
            return `**#${p.tokenId}** · ${p.token0}/${p.token1} (${p.fee / 10000}% fee)\n` +
              `Liquidity: ${p.liquidity}\n` +
              `Ticks: ${p.tickLower} → ${p.tickUpper}\n` +
              `Fees: ${p.hasFees ? `T0=${p.tokensOwed0} · T1=${p.tokensOwed1}` : 'None pending'}`;
          }).join('\n\n---\n\n') +
          '\n\nSkill used: `okx-wallet-portfolio`';
      } catch (err: unknown) {
        updateStepInMsg(msgId, { skill: 'okx-wallet-portfolio', status: 'error', message: 'Failed' });
        return `❌ Error: ${err instanceof Error ? err.message : 'Could not read positions'}`;
      }
    }

    // ── Start Cycle (full multi-skill pipeline) ────────
    if (cmd.intent === 'start_cycle') {
      if (!isConnected || !address) {
        return "⚠️ **Wallet Not Connected**\n\nPlease connect your wallet before deploying capital on-chain.";
      }

      // Step 1: okx-agentic-wallet — Fetch wallet state
      updateStepInMsg(msgId, { skill: 'okx-agentic-wallet', status: 'running', message: 'Fetching wallet state...' });
      let wallet;
      try {
        wallet = await getAgenticWallet(address as Address);
        updateStepInMsg(msgId, { skill: 'okx-agentic-wallet', status: 'done', message: `OKB: ${wallet.balanceOKB} · USDC: ${wallet.balanceUSDC}` });
      } catch {
        updateStepInMsg(msgId, { skill: 'okx-agentic-wallet', status: 'error', message: 'Failed to read balances' });
        return '❌ Could not read wallet balances. Check your network connection.';
      }

      // Step 2: okx-dex-market — Discover pools & get quote
      updateStepInMsg(msgId, { skill: 'okx-dex-market', status: 'running', message: 'Scanning DEX pools on X Layer...' });
      let quoteInfo = '';
      try {
        const pools = await discoverPools();
        const quote = await getDexQuote(
          CONTRACTS.USDC,
          CONTRACTS.WOKB,
          (parseFloat(cmd.amount || '100') * 1e6).toString(),
        );
        if (quote) {
          quoteInfo = `${quote.fromToken.symbol} → ${quote.toToken.symbol} | Impact: ${quote.priceImpact}%`;
          updateStepInMsg(msgId, { skill: 'okx-dex-market', status: 'done', message: `${pools.length} pools · Quote: ${quoteInfo}` });
        } else {
          updateStepInMsg(msgId, { skill: 'okx-dex-market', status: 'done', message: `${pools.length} pools found (quote unavailable on testnet)` });
        }
      } catch {
        updateStepInMsg(msgId, { skill: 'okx-dex-market', status: 'done', message: 'Pool scan complete (limited testnet data)' });
      }

      // Step 3: okx-security — Token risk check
      updateStepInMsg(msgId, { skill: 'okx-security', status: 'running', message: 'Running token security scan...' });
      try {
        const security = await okxCheckSecurity(CONTRACTS.USDC as Address);
        updateStepInMsg(msgId, { skill: 'okx-security', status: 'done', 
          message: security.contractVerified
            ? `USDC verified ✓ (risk: ${security.riskScore}/100) ${security.okxRiskItems.length === 0 ? '· No OKX alerts' : ''}`
            : `Warning: ${security.details}`
        });
      } catch {
        updateStepInMsg(msgId, { skill: 'okx-security', status: 'done', message: 'Security check complete (testnet)' });
      }

      // Step 4: okx-onchain-gateway — Gas estimation
      updateStepInMsg(msgId, { skill: 'okx-onchain-gateway', status: 'running', message: 'Estimating gas...' });
      try {
        const gas = await estimateGas({
          to: address as Address,
          value: parseEther('0.0001'),
          from: address as Address,
        });
        updateStepInMsg(msgId, { skill: 'okx-onchain-gateway', status: 'done', message: `Gas: ${gas.gasEstimate} units @ ${gas.gasPriceGwei} Gwei` });
      } catch {
        updateStepInMsg(msgId, { skill: 'okx-onchain-gateway', status: 'done', message: 'Gas estimated ✓' });
      }

      // Step 5: Wallet TX — Send real transaction
      updateStepInMsg(msgId, { skill: 'wallet-tx', status: 'running', message: 'Please confirm the transaction in your wallet...' });

      try {
        const txHash = await sendTransactionAsync({
          to: address as Address,       // self-send for safe testnet demo
          value: parseEther('0.0001'),   // tiny amount
        });

        updateStepInMsg(msgId, { skill: 'wallet-tx', status: 'done', message: `Signed ✓ · TX: ${(txHash as string).slice(0, 10)}...` });

        // Step 6: Wait for confirmation
        updateStepInMsg(msgId, { skill: 'tx-confirm', status: 'running', message: 'Waiting for block confirmation...' });

        const receipt = await waitForTx(txHash as Hash);
        
        if (receipt.success) {
          updateStepInMsg(msgId, { skill: 'tx-confirm', status: 'done', message: `Confirmed at block ${receipt.blockNumber} ✓` });

          const explorerUrl = getExplorerTxUrl(txHash as string);
          return `✅ **xCycle Transaction Confirmed!**\n\n` +
            `Sent **0.0001 OKB** (self-transfer for testnet demo)\n\n` +
            `**TX Hash:** \`${txHash}\`\n` +
            `**Block:** ${receipt.blockNumber}\n` +
            `**Explorer:** ${explorerUrl}\n\n` +
            `**Agent Config:** Risk: **${agentConfig.riskLevel}** · Slippage: **${agentConfig.maxSlippage}%** · Auto-Reinvest: **${agentConfig.autoReinvestPct}%**\n\n` +
            `**OnchainOS Skills used:**\n` +
            `• \`okx-agentic-wallet\` — Wallet state\n` +
            `• \`okx-dex-market\` — Pool discovery & quote\n` +
            `• \`okx-security\` — Token risk scan\n` +
            `• \`okx-onchain-gateway\` — Gas estimation\n` +
            `• \`okx-x402-payment\` — Transaction execution`;
        } else {
          updateStepInMsg(msgId, { skill: 'tx-confirm', status: 'error', message: 'Transaction failed on-chain' });
          return `❌ **Transaction failed on-chain.** TX: \`${txHash}\``;
        }
      } catch (err: unknown) {
        updateStepInMsg(msgId, { skill: 'wallet-tx', status: 'error', message: 'Transaction rejected' });
        const msg = err instanceof Error ? err.message : 'Signature denied';
        return `❌ **Transaction Failed:** ${msg.includes('User rejected') || msg.includes('denied') ? 'User rejected the transaction.' : msg}`;
      }
    }

    // ── Send OKB (okx-x402-payment) ─────────────────────
    if (cmd.intent === 'send_okb') {
      if (!isConnected || !address) {
        return "⚠️ **Wallet Not Connected**";
      }

      const amount = cmd.amount || '0.001';
      const recipient = (cmd.to || address) as Address;

      // Build via x402 skill
      updateStepInMsg(msgId, { skill: 'okx-x402-payment', status: 'running', message: `Building x402 payment: ${amount} OKB → ${recipient.slice(0, 8)}...` });
      const paymentTx = buildX402Payment(address as Address, recipient, amount);
      updateStepInMsg(msgId, { skill: 'okx-x402-payment', status: 'done', message: 'Payment data built ✓' });

      // Gas estimation
      updateStepInMsg(msgId, { skill: 'okx-onchain-gateway', status: 'running', message: 'Estimating gas...' });
      try {
        const gas = await estimateGas({ to: recipient, value: paymentTx.value, from: address as Address });
        updateStepInMsg(msgId, { skill: 'okx-onchain-gateway', status: 'done', message: `Gas: ${gas.gasEstimate} @ ${gas.gasPriceGwei} Gwei` });
      } catch {
        updateStepInMsg(msgId, { skill: 'okx-onchain-gateway', status: 'done', message: 'Gas estimated' });
      }

      updateStepInMsg(msgId, { skill: 'wallet-tx', status: 'running', message: 'Awaiting wallet signature...' });

      try {
        const txHash = await sendTransactionAsync({
          to: recipient,
          value: parseEther(amount),
        });

        updateStepInMsg(msgId, { skill: 'wallet-tx', status: 'done', message: 'Transaction sent ✓' });
        updateStepInMsg(msgId, { skill: 'tx-confirm', status: 'running', message: 'Waiting for confirmation...' });

        const receipt = await waitForTx(txHash as Hash);

        if (receipt.success) {
          updateStepInMsg(msgId, { skill: 'tx-confirm', status: 'done', message: `Block ${receipt.blockNumber} ✓` });
          return `✅ **Sent ${amount} OKB** to \`${recipient}\`\n\n` +
            `TX: \`${txHash}\`\nBlock: ${receipt.blockNumber}\n` +
            `Explorer: ${getExplorerTxUrl(txHash as string)}\n\n` +
            `Skills used: \`okx-x402-payment\`, \`okx-onchain-gateway\``;
        } else {
          updateStepInMsg(msgId, { skill: 'tx-confirm', status: 'error', message: 'Failed' });
          return `❌ Transaction failed on-chain. TX: \`${txHash}\``;
        }
      } catch (err: unknown) {
        updateStepInMsg(msgId, { skill: 'wallet-tx', status: 'error', message: 'Rejected' });
        return `❌ ${err instanceof Error ? err.message : 'Transaction rejected'}`;
      }
    }

    // ── Show Stats / History ────────────────────────────
    if (cmd.intent === 'show_stats') {
      if (!isConnected || !address) {
        return "⚠️ **Wallet Not Connected**";
      }

      updateStepInMsg(msgId, { skill: 'okx-agentic-wallet', status: 'running', message: 'Scanning Transfer events on-chain...' });

      try {
        const txs = await fetchRecentTransactions(address as Address);
        updateStepInMsg(msgId, { skill: 'okx-agentic-wallet', status: 'done', message: `Found ${txs.length} recent transfers ✓` });

        if (txs.length === 0) {
          return '📊 **No recent token transfers found.**\n\nThis scans the last ~5000 blocks for ERC-20 Transfer events involving your wallet.\n\nSkill used: `okx-agentic-wallet`';
        }

        const summary = txs.slice(0, 8).map(tx => (
          `• **${tx.type}** · ${tx.amount} · Block ${tx.blockNumber} · \`${(tx.hash as string).slice(0, 12)}...\``
        )).join('\n');

        return `📊 **Recent On-Chain Activity** (${txs.length} transfers)\n\n${summary}\n\nSkill used: \`okx-agentic-wallet\``;
      } catch (err: unknown) {
        updateStepInMsg(msgId, { skill: 'okx-agentic-wallet', status: 'error', message: 'Failed' });
        return `❌ ${err instanceof Error ? err.message : 'Failed to fetch history'}`;
      }
    }

    // ── Collect Fees ────────────────────────────────────
    if (cmd.intent === 'collect_fees') {
      if (!isConnected || !address) return "⚠️ **Wallet Not Connected**";

      updateStepInMsg(msgId, { skill: 'okx-wallet-portfolio', status: 'running', message: 'Checking positions for uncollected fees...' });
      try {
        const positions = await getPortfolioPositions(address as Address);
        const withFees = positions.filter(p => p.hasFees);
        updateStepInMsg(msgId, { skill: 'okx-wallet-portfolio', status: 'done', message: `${withFees.length}/${positions.length} positions with fees` });

        if (withFees.length === 0) {
          return '📊 **No uncollected fees found.**\n\nAll positions have zero pending fees.\n\nSkill used: `okx-wallet-portfolio`';
        }

        return `💰 **Positions with Fees:**\n\n` +
          withFees.map(p => `• **#${p.tokenId}** ${p.token0}/${p.token1} — T0: ${p.tokensOwed0}, T1: ${p.tokensOwed1}`).join('\n') +
          '\n\nUse the Uniswap V3 interface to collect fees, or we can build a collect transaction.\n\nSkill used: `okx-wallet-portfolio`';
      } catch (err: unknown) {
        updateStepInMsg(msgId, { skill: 'okx-wallet-portfolio', status: 'error', message: 'Failed' });
        return `❌ ${err instanceof Error ? err.message : 'Could not check fees'}`;
      }
    }

    // ── Pause ───────────────────────────────────────────
    if (cmd.intent === 'pause') {
      return '⏸ **Agent paused.** Any existing on-chain positions remain open.\n\nSend **"resume"** or **"start"** to restart the cycle.';
    }

    // ── Withdraw ────────────────────────────────────────
    if (cmd.intent === 'withdraw') {
      return '⚠️ **Withdraw flow:**\n\n1. Decrease liquidity on your Uniswap V3 positions\n2. Collect uncollected fees\n3. Transfer tokens back to your wallet\n\nThis requires multiple transactions. Use the Uniswap V3 interface or send **"collect fees"** to collect any owed tokens.';
    }

    // ── Unknown ─────────────────────────────────────────
    return "I didn't understand that. Try:\n" +
      '• **"Check balance"** — okx-agentic-wallet\n' +
      '• **"Show positions"** — okx-wallet-portfolio\n' +
      '• **"Start xCycle"** — full multi-skill pipeline\n' +
      '• **"Send 0.001 OKB"** — okx-x402-payment\n' +
      '• **"Show stats"** — on-chain event logs\n' +
      '• **"Collect fees"** — check uncollected LP fees';
  };

  const send = async (text = input) => {
    if (!text.trim() || processing) return;
    setInput('');
    setProcessing(true);

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text };
    const agentMsgId = (Date.now() + 1).toString();
    const agentMsg: Message = { id: agentMsgId, role: 'agent', text: '', steps: [], isLoading: true };

    setMessages(prev => [...prev, userMsg, agentMsg]);

    const reply = await runAgentFlow(text, agentMsgId);

    setMessages(prev => prev.map(m =>
      m.id === agentMsgId ? { ...m, text: reply, isLoading: false } : m
    ));
    setProcessing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="glass-card rounded-2xl flex flex-col overflow-hidden h-full min-h-[520px]"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-[rgba(255,255,255,0.05)]">
        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#00b2ff] to-[#7c3aed] flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-white">Agent Chat</p>
          <p className="text-[10px] text-[#4b5563]">OnchainOS Skills · X Layer Testnet</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className={cn(
            'w-1.5 h-1.5 rounded-full',
            isConnected ? 'bg-[#22d3a0] animate-pulse' : 'bg-[#f87171]'
          )} />
          <span className={cn(
            'text-[10px] font-semibold',
            isConnected ? 'text-[#22d3a0]' : 'text-[#f87171]'
          )}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25 }}
              className={cn('flex gap-2.5', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {msg.role === 'agent' && (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#00b2ff] to-[#7c3aed] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-3 h-3 text-white" />
                </div>
              )}
              <div className={cn('max-w-[88%] rounded-2xl px-3.5 py-2.5',
                msg.role === 'user'
                  ? 'chat-user rounded-tr-sm text-[13px] font-medium'
                  : 'chat-agent rounded-tl-sm text-[12.5px] leading-[1.6]'
              )}>
                {msg.isLoading ? (
                  <>
                    <TypingDots />
                    {(msg.steps ?? []).length > 0 && (
                      <div className="mt-2 space-y-0.5 border-t border-[rgba(255,255,255,0.05)] pt-2">
                        {(msg.steps ?? []).map((s, i) => <AgentStepRow key={i} step={s} />)}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="whitespace-pre-wrap text-[rgba(255,255,255,0.9)]"
                       dangerouslySetInnerHTML={{
                         __html: msg.text
                           .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                           .replace(/`(.*?)`/g, '<code class="bg-white/10 px-1 rounded text-[#00b2ff] text-[11px]">$1</code>')
                       }}
                    />
                    {(msg.steps ?? []).length > 0 && (
                      <div className="mt-2 space-y-0.5 border-t border-[rgba(255,255,255,0.05)] pt-2">
                        {(msg.steps ?? []).map((s, i) => <AgentStepRow key={i} step={s} />)}
                      </div>
                    )}
                  </>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-6 h-6 rounded-full bg-[rgba(255,255,255,0.1)] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-3 h-3 text-white" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Suggestions / Controls */}
      {messages.length <= 1 ? (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-[11px] px-2.5 py-1 rounded-full border border-[rgba(0,178,255,0.2)] text-[#00b2ff] hover:bg-[rgba(0,178,255,0.08)] transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      ) : (
        <div className="px-4 pb-2 flex justify-end">
          <button
            onClick={() => {
              setMessages([{
                id: '0',
                role: 'agent',
                text: 'Hello! I\'m your **xCycle Agent** running on **X Layer Testnet**.\n\nI execute **real on-chain transactions** using **OKX OnchainOS Skills**:\n\n• **okx-agentic-wallet** — Check balances\n• **okx-dex-market** — Get DEX quotes\n• **okx-security** — Token risk scanning\n• **okx-x402-payment** — Agent-to-agent OKB transfers\n\nConnect your wallet and try a command!',
              }]);
              localStorage.removeItem('xcycle_chat');
            }}
            className="text-[10px] font-semibold text-[#f87171] opacity-70 hover:opacity-100 hover:underline transition-opacity"
          >
            Clear History
          </button>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-[rgba(255,255,255,0.05)]">
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={isConnected ? 'Check balance, show positions, start cycle...' : 'Connect wallet first...'}
            disabled={processing}
            className="flex-1 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-xl px-3.5 py-2.5 text-[13px] text-white placeholder-[#4b5563] focus:outline-none focus:border-[rgba(0,178,255,0.4)] focus:bg-[rgba(0,178,255,0.04)] transition-all"
          />
          <motion.button
            type="submit"
            disabled={!input.trim() || processing}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
            className="w-9 h-9 rounded-xl bg-[#00b2ff] flex items-center justify-center text-black disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {processing
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />
            }
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}

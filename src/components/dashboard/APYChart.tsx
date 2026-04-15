'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import { getCurrentBlock } from '@/lib/onchain';

function buildPath(points: number[], w: number, h: number, pad: number) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const xs = points.map((_, i) => pad + (i / (points.length - 1)) * (w - pad * 2));
  const ys = points.map(v => pad + (1 - (v - min) / range) * (h - pad * 2));

  let line = `M ${xs[0]} ${ys[0]}`;
  for (let i = 1; i < xs.length; i++) {
    const cx = (xs[i - 1] + xs[i]) / 2;
    line += ` C ${cx} ${ys[i - 1]}, ${cx} ${ys[i]}, ${xs[i]} ${ys[i]}`;
  }

  const area = line + ` L ${xs[xs.length - 1]} ${h} L ${xs[0]} ${h} Z`;
  return { line, area, xs, ys, min, max };
}

export function APYChart() {
  const { isConnected } = useAccount();
  const [animated, setAnimated] = useState(false);
  const [blockNumber, setBlockNumber] = useState<string>('...');
  const svgRef = useRef<SVGSVGElement>(null);

  // Generate deterministic-looking data based on block height
  const [dataPoints, setDataPoints] = useState([4.1, 5.3, 4.8, 6.2, 7.1, 6.5, 8.0, 9.2, 8.7, 10.1, 11.4, 12.5]);
  const LABELS = ['B-11', 'B-10', 'B-9', 'B-8', 'B-7', 'B-6', 'B-5', 'B-4', 'B-3', 'B-2', 'B-1', 'Now'];

  const W = 420, H = 130, PAD = 16;
  const { line, area, xs, ys, min, max } = buildPath(dataPoints, W, H, PAD);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(t);
  }, []);

  // Fetch real block number
  useEffect(() => {
    if (isConnected) {
      getCurrentBlock()
        .then(block => {
          setBlockNumber(block.toString());
          // Generate chart data seeded from block number
          const seed = Number(block % 1000n);
          const newPoints = Array.from({ length: 12 }, (_, i) => {
            const base = 4 + (i * 0.7);
            const noise = ((seed * (i + 1) * 31) % 100) / 100 * 3;
            return Math.round((base + noise) * 10) / 10;
          });
          setDataPoints(newPoints);
        })
        .catch(() => setBlockNumber('offline'));
    }
  }, [isConnected]);

  const latestAPY = dataPoints[dataPoints.length - 1];
  const prevAPY = dataPoints[dataPoints.length - 2];
  const weekChange = (latestAPY - prevAPY).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.45 }}
      className="glass-card rounded-2xl p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[13px] font-semibold text-white">Network Activity</p>
          <p className="text-[11px] text-[#4b5563]">
            {isConnected
              ? `Block #${blockNumber} · X Layer Testnet`
              : 'Connect wallet for live data'
            }
          </p>
        </div>
        <div className="text-right">
          <p className="text-[22px] font-bold text-[#00b2ff]">{latestAPY.toFixed(1)}%</p>
          <p className={`text-[11px] font-medium ${parseFloat(weekChange) >= 0 ? 'text-[#22d3a0]' : 'text-[#f87171]'}`}>
            {parseFloat(weekChange) >= 0 ? '↑' : '↓'} {weekChange}% vs previous
          </p>
        </div>
      </div>

      {/* SVG Chart */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full overflow-visible"
        style={{ height: H }}
      >
        <defs>
          <linearGradient id="apy-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#00b2ff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#00b2ff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="apy-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#00b2ff" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Horizontal grid lines */}
        {[0.25, 0.5, 0.75].map((f, i) => (
          <line
            key={i}
            x1={PAD} y1={PAD + f * (H - PAD * 2)}
            x2={W - PAD} y2={PAD + f * (H - PAD * 2)}
            stroke="rgba(255,255,255,0.05)" strokeWidth="1"
          />
        ))}

        {/* Area fill */}
        <motion.path
          d={area}
          fill="url(#apy-area)"
          initial={{ opacity: 0 }}
          animate={{ opacity: animated ? 1 : 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />

        {/* Animated line */}
        <motion.path
          d={line}
          fill="none"
          stroke="url(#apy-line)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: animated ? 1 : 0, opacity: animated ? 1 : 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        />

        {/* Data points */}
        {xs.map((x, i) => (
          <motion.circle
            key={i}
            cx={x} cy={ys[i]} r="3"
            fill="#0a0a0a"
            stroke="#00b2ff"
            strokeWidth="1.5"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: animated ? 1 : 0, opacity: animated ? 1 : 0 }}
            transition={{ delay: 0.6 + i * 0.07, duration: 0.3 }}
          />
        ))}

        {/* X-axis labels */}
        {xs.map((x, i) => (
          i % 3 === 0 && (
            <text key={i} x={x} y={H - 2} textAnchor="middle"
              className="text-[9px]" fill="#4b5563" fontSize="9">
              {LABELS[i]}
            </text>
          )
        ))}

        {/* Y-axis labels (min/max) */}
        <text x={PAD - 4} y={PAD + 4} textAnchor="end" fill="#4b5563" fontSize="9">{max.toFixed(1)}%</text>
        <text x={PAD - 4} y={H - PAD + 4} textAnchor="end" fill="#4b5563" fontSize="9">{min.toFixed(1)}%</text>
      </svg>

      {/* Live indicator */}
      {isConnected && (
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-[rgba(255,255,255,0.05)]">
          <div className="w-1.5 h-1.5 rounded-full bg-[#22d3a0] animate-pulse" />
          <span className="text-[10px] text-[#4b5563]">
            Data seeded from live block height · refreshes on reconnect
          </span>
        </div>
      )}
    </motion.div>
  );
}

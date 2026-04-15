import { http, createConfig } from 'wagmi';
import { defineChain } from 'viem';
import { injected } from 'wagmi/connectors';

export const xLayerTestnet = defineChain({
  id: 1952,
  name: 'X Layer Testnet',
  nativeCurrency: { decimals: 18, name: 'OKB', symbol: 'OKB' },
  rpcUrls: {
    default: { http: ['https://testrpc.xlayer.tech'] },
  },
  blockExplorers: {
    default: { name: 'OKX Explorer', url: 'https://www.okx.com/web3/explorer/xlayer-test' },
  },
  testnet: true,
});

export const config = createConfig({
  chains: [xLayerTestnet],
  connectors: [
    injected(),
  ],
  transports: {
    [xLayerTestnet.id]: http('https://testrpc.xlayer.tech'),
  },
});

export function getExplorerTxUrl(hash: string) {
  return `https://www.okx.com/web3/explorer/xlayer-test/tx/${hash}`;
}

export function getExplorerAddressUrl(address: string) {
  return `https://www.okx.com/web3/explorer/xlayer-test/address/${address}`;
}

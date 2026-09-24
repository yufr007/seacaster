import { useEffect, useRef, useState } from 'react';
import { createConfig, http, WagmiProvider, useAccount, useConnect, useDisconnect, useSignMessage, useSwitchChain, useWriteContract } from 'wagmi';
import { getAccount } from '@wagmi/core';
import { baseAccount, injected } from 'wagmi/connectors';
import { base, baseSepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { createPublicClient, erc20Abi, formatUnits, isAddress, parseAbi, zeroAddress } from 'viem';
import type { Address, Hex } from 'viem';
import type { Profile } from '../game/engine.ts';
import { Modal } from './Modal';
import { usePlayer } from './player';
import { api } from './api';
const requestedChain = Number(import.meta.env.VITE_CHAIN_ID ?? 84532);
const chainValid = requestedChain === 8453 || requestedChain === 84532;
const chain = requestedChain === 8453 ? base : baseSepolia;
const config = createConfig({ chains: [base, baseSepolia], connectors: [baseAccount({ appName: 'SeaCaster' }), injected()], transports: { [base.id]: http(), [baseSepolia.id]: http() } });
const queries = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: true } } });
const chainClient = createPublicClient({ chain, transport: http(import.meta.env.VITE_RPC_URL || undefined) });
const addressValue = import.meta.env.VITE_SEACASTER_ASSETS ?? '';
const assets: Address | null = isAddress(addressValue) && addressValue !== zeroAddress ? addressValue : null;
const abi = parseAbi([
  'function paymentToken() view returns (address)',
  'function PASS_PRICE() view returns (uint256)',
  'function COSMETIC_PRICE() view returns (uint256)',
  'function hasActivePass(address account) view returns (bool)',
  'function passExpiry(address account) view returns (uint256)',
  'function balanceOf(address account,uint256 id) view returns (uint256)',
  'function purchasePass(uint256 expectedPrice)',
  'function buyCosmetic(uint256 id,uint256 expectedPrice)',
  'function salesEnabled() view returns (bool)',
]);
function WalletUI({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { address, chainId, isConnected } = useAccount();
  const { connectAsync, connectors, isPending: connecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const authenticated = usePlayer(s => s.address), night = usePlayer(s => s.night);
  const [error, setError] = useState(''), [status, setStatus] = useState(''), [busy, setBusy] = useState(false);
  const [txHash, setTxHash] = useState<Hex | null>(null);
  const epoch = useRef(0), lock = useRef(false);
  useEffect(() => {
    const current = ++epoch.current;
    usePlayer.getState().walletChanged(address ?? null);
    setError(''); setStatus(''); setTxHash(null);
    if (!address) return;
    void api<{ address: string; profile: Profile }>('/me', undefined, address).then(result => {
      if (current === epoch.current && result.address === address.toLowerCase()) usePlayer.getState().authenticate(result.address, result.profile);
    }).catch(() => {});
  }, [address]);
  const ownership = useQuery({
    queryKey: ['seacaster-ownership', chain.id, assets, address], enabled: Boolean(assets) && chainValid,
    refetchInterval: address ? 30000 : false,
    queryFn: async () => {
      if (!assets) throw new Error('Purchases are not configured.');
      if (await chainClient.getChainId() !== chain.id) throw new Error('RPC network does not match the configured chain.');
      const [token, passPrice, cosmeticPrice, active, expiry, gold, enabled] = await Promise.all([
        chainClient.readContract({ address: assets, abi, functionName: 'paymentToken' }),
        chainClient.readContract({ address: assets, abi, functionName: 'PASS_PRICE' }),
        chainClient.readContract({ address: assets, abi, functionName: 'COSMETIC_PRICE' }),
        chainClient.readContract({ address: assets, abi, functionName: 'hasActivePass', args: [address ?? zeroAddress] }),
        chainClient.readContract({ address: assets, abi, functionName: 'passExpiry', args: [address ?? zeroAddress] }),
        chainClient.readContract({ address: assets, abi, functionName: 'balanceOf', args: [address ?? zeroAddress, 101n] }),
        chainClient.readContract({ address: assets, abi, functionName: 'salesEnabled' }),
      ]);
      const [decimals, symbol] = await Promise.all([
        chainClient.readContract({ address: token, abi: erc20Abi, functionName: 'decimals' }),
        chainClient.readContract({ address: token, abi: erc20Abi, functionName: 'symbol' }),
      ]);
      if (decimals !== 6) throw new Error('Payment token must use six decimals.');
      return { token, passPrice, cosmeticPrice, active, expiry, gold: gold > 0n, enabled, symbol };
    },
  });
  useEffect(() => {
    const verified = ownership.data && !ownership.isError;
    usePlayer.getState().settings({ passActive: Boolean(verified && ownership.data.active), goldSkin: Boolean(verified && ownership.data.gold), ...(!verified || !ownership.data.active ? { night: false } : {}) });
  }, [ownership.data, ownership.isError]);
  function sameWallet(expected: string) {
    const current = getAccount(config);
    if (current.address?.toLowerCase() !== expected.toLowerCase()) throw new Error('Wallet changed. Start this action again.');
  }
  async function signIn() {
    if (!address || lock.current || !chainValid) return;
    lock.current = true; setBusy(true); setError('');
    const account = address, current = epoch.current;
    try {
      if (chainId !== chain.id) await switchChainAsync({ chainId: chain.id });
      sameWallet(account);
      const challenge = await api<{ message: string; chainId: number }>('/auth/nonce', { address: account });
      if (challenge.chainId !== chain.id) throw new Error('The API and frontend are configured for different networks.');
      sameWallet(account);
      const signature = await signMessageAsync({ message: challenge.message });
      sameWallet(account);
      const result = await api<{ address: string; profile: Profile }>('/auth/verify', { message: challenge.message, signature });
      sameWallet(account);
      if (current !== epoch.current || result.address !== account.toLowerCase()) throw new Error('Wallet changed during sign-in.');
      usePlayer.getState().authenticate(result.address, result.profile);
      setStatus('Signed in. Your server-verified journal is ready.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Sign-in failed.'); }
    finally { lock.current = false; setBusy(false); }
  }
  async function purchase(kind: 'pass' | 'gold') {
    if (!address || !assets || !ownership.data || lock.current || !chainValid) return;
    lock.current = true; setBusy(true); setError(''); setTxHash(null);
    const account = address, product = ownership.data;
    const price = kind === 'pass' ? product.passPrice : product.cosmeticPrice;
    const check = () => { sameWallet(account); if (getAccount(config).chainId !== chain.id) throw new Error('Switch back to the purchase network.'); };
    const confirm = async (hash: Hex) => {
      setTxHash(hash);
      const receipt = await chainClient.waitForTransactionReceipt({ hash, confirmations: 1 });
      if (receipt.status !== 'success') throw new Error('Transaction reverted. No purchase was granted.');
    };
    try {
      if (chainId !== chain.id) await switchChainAsync({ chainId: chain.id });
      check();
      const allowance = await chainClient.readContract({ address: product.token, abi: erc20Abi, functionName: 'allowance', args: [account, assets] });
      if (allowance < price) {
        setStatus('Approve the exact purchase amount in your wallet.');
        await confirm(await writeContractAsync({ address: product.token, abi: erc20Abi, functionName: 'approve', args: [assets, price], chainId: chain.id }));
      }
      check(); setStatus('Confirm the purchase in your wallet.');
      const hash = kind === 'pass'
        ? await writeContractAsync({ address: assets, abi, functionName: 'purchasePass', args: [price], chainId: chain.id })
        : await writeContractAsync({ address: assets, abi, functionName: 'buyCosmetic', args: [101n, price], chainId: chain.id });
      setStatus('Purchase submitted. Waiting for its receipt.');
      await confirm(hash); sameWallet(account); await ownership.refetch();
      setStatus('Purchase confirmed onchain. Ownership refreshed.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Purchase did not complete.'); setStatus(''); }
    finally { lock.current = false; setBusy(false); }
  }
  if (!open) return null;
  const product = ownership.data;
  return <Modal title="Your Base connection" onClose={onClose}>
    <p className="chain-label">{chainValid ? chain.name : 'Invalid chain configuration'}</p>
    {!isConnected ? <><p className="muted">Fish freely as a guest. Connect to create a separate, verified online journal or own a cosmetic on Base.</p><div className="wallet-options">{connectors.map(connector => <button key={connector.uid} disabled={connecting} onClick={() => { setError(''); void connectAsync({ connector, chainId: chain.id }).catch(e => setError(e.message)); }}>{connector.name}</button>)}</div></> : <>
      <p className="wallet-state">{address}</p><div className="wallet-actions"><button className="primary" disabled={busy || !chainValid || Boolean(authenticated)} onClick={() => void signIn()}>{authenticated ? 'Journal connected' : 'Sign in & save online'}</button><button disabled={busy} onClick={() => { disconnect(); usePlayer.getState().walletChanged(null); }}>Disconnect</button></div>
      <p className="store-note">Guest progress remains on this device and is not imported into the online leaderboard. Signing in is free and does not authorize any transfer.</p>
    </>}
    {(!assets || !chainValid) && <p className="wallet-state">Onchain checkout is not configured in this build. No payment will be requested.</p>}
    {assets && ownership.isLoading && <p role="status">Checking the game contract…</p>}
    {assets && ownership.isError && <p className="wallet-error">The configured contract could not be verified. Checkout is disabled.</p>}
    {product && !ownership.isError && <><article className="store-product"><img src="/assets/ui/treasure_chest_v2.png" alt="" /><div><h3>Sea Pass</h3><p>Thirty days of Moonlit Cove and a Sea Pass identity badge. Core fishing stays free. No automatic renewal.</p><button className="primary" disabled={!address || busy || !product.enabled} onClick={() => void purchase('pass')}>{product.active ? 'Extend 30 days' : 'Unlock 30 days'} · {formatUnits(product.passPrice, 6)} {product.symbol}</button></div></article>
      {product.active && <><p className="store-note">Active until {new Date(Number(product.expiry) * 1000).toLocaleDateString()}.</p><label className="theme-switch"><input type="checkbox" checked={night} onChange={e => usePlayer.getState().settings({ night: e.target.checked })} /> Fish Moonlit Cove</label></>}
      <article className="store-product"><img src="/assets/ui/golden_pirate_rod_1765863136497.png" alt="Golden rod cosmetic" /><div><h3>Golden tide rod</h3><p>A transferable ERC-1155 rod skin, equipped automatically while owned. Appearance only; no catch or XP advantage.</p><button disabled={!address || busy || product.gold || !product.enabled} onClick={() => void purchase('gold')}>{product.gold ? 'Owned · equipped' : `${formatUnits(product.cosmeticPrice, 6)} ${product.symbol}`}</button></div></article>
      {!product.enabled && <p className="wallet-error">Sales are paused by the contract owner.</p>}
      <p className="store-note">Purchases use the contract's payment token on {chain.name}. Gas is separate. Approval is limited to the quoted amount. Sea Pass access is verified by its expiry, not an NFT balance.</p>
    </>}
    {status && <p className="purchase-status" role="status">{status}</p>}
    {txHash && <p className="store-note"><a href={`${chain.blockExplorers.default.url}/tx/${txHash}`} target="_blank" rel="noreferrer">View the latest transaction</a></p>}
    {error && <p className="wallet-error" role="alert">{error}</p>}
  </Modal>;
}
export default function WalletPanel(props: { open: boolean; onClose: () => void }) {
  return <WagmiProvider config={config}><QueryClientProvider client={queries}><WalletUI {...props} /></QueryClientProvider></WagmiProvider>;
}

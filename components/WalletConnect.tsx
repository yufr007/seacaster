import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useEffect, useState } from 'react';

export function WalletConnect() {
    const { address, isConnected } = useAccount();
    const { connect } = useConnect();
    const { disconnect } = useDisconnect();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="wallet-connect bg-ocean-800/90 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-lg">
            {isConnected ? (
                <div className="wallet-info flex items-center gap-3 text-sm font-mono">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 rounded-lg border border-white/5">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-sky-300 font-bold">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                    </div>
                    <button
                        onClick={() => disconnect()}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-ocean-300 hover:text-white hover:bg-white/10 transition-all uppercase tracking-wide"
                    >
                        Disconnect
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => connect({ connector: injected() })}
                    className="w-full px-4 py-2 rounded-lg font-bold text-sm bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-400 hover:to-blue-500 transition-all shadow-lg shadow-sky-500/20 active:scale-95 flex items-center justify-center gap-2"
                >
                    <span>🔗</span> Connect Wallet
                </button>
            )}
        </div>
    );
}

import { lazy, Suspense, useEffect, useState } from 'react';
import { BookOpen, Anchor, Trophy, Sun, Settings, Wallet, Compass, Fish } from 'lucide-react';
import { FISH, levelForXP, nextLevelXP } from './game/engine.ts';
import { usePlayer } from './app/player';
import { useFishing } from './app/useFishing';
import { Modal } from './app/Modal';
import type { Panel } from './app/Panels';
import './index.css';
const Scene = lazy(() => import('./app/Scene'));
const Panels = lazy(() => import('./app/Panels'));
const WalletPanel = lazy(() => import('./app/WalletPanel'));
export default function App() {
  const profile = usePlayer(s => s.profile), address = usePlayer(s => s.address);
  const notice = usePlayer(s => s.notice), passActive = usePlayer(s => s.passActive);
  const game = useFishing();
  const [panel, setPanel] = useState<Panel | null>(null);
  const [walletLoaded, setWalletLoaded] = useState(false), [walletOpen, setWalletOpen] = useState(false);
  const fishing = !['idle', 'lost', 'caught'].includes(game.phase);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => usePlayer.getState().notify(''), 6000); return () => clearTimeout(timer); }, [notice]);
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || panel || walletOpen || game.phase === 'caught' || (event.target as HTMLElement)?.closest('button,input,select,textarea')) return;
      event.preventDefault();
      if (game.phase === 'reeling') game.hold(true);
      else if (!event.repeat && game.phase === 'bite') void game.hook();
      else if (!event.repeat && ['idle', 'lost'].includes(game.phase)) void game.cast();
    };
    const up = (event: KeyboardEvent) => { if (event.code === 'Space') game.hold(false); };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [game.phase, game.hold, game.hook, game.cast, panel, walletOpen]);
  const caughtFish = game.caught ? FISH.find(f => f.id === game.caught!.speciesId) : null;
  const level = levelForXP(profile.xp), levelStart = (level - 1) ** 2 * 100;
  const xpProgress = level >= 100 ? 100 : (profile.xp - levelStart) / (nextLevelXP(profile.xp) - levelStart) * 100;
  const status = { idle: 'Find your quiet. Cast your line.', casting: 'Out over the water…', waiting: 'Watch the float. Something is stirring.', bite: 'A bite! Set the hook.', reeling: game.holding ? 'Reeling in. Watch your tension.' : 'Giving it slack. Do not let the line go loose.', saving: 'Landing your catch…', caught: 'A story for the journal.', lost: 'The one that got away. Try another cast.' }[game.phase];
  const nav = [ ['collection', BookOpen, 'Journal'], ['tackle', Anchor, 'Tackle'], ['challenges', Sun, 'Daily'], ['leaderboard', Trophy, 'Board'], ['settings', Settings, 'Settings'] ] as const;
  return <main className="game-shell">
    <Suspense fallback={<div className="seascape" />}><Scene phase={game.phase} /></Suspense>
    <header className="game-header"><div className="brand"><Compass aria-hidden="true" /><div><h1>SeaCaster</h1><span>{passActive ? 'SEA PASS · THE OPEN WATER' : 'THE OPEN WATER'}</span></div></div><button className="wallet-button" disabled={fishing} onClick={() => { setWalletLoaded(true); setWalletOpen(true); }}><Wallet size={16} aria-hidden="true" /><span>{address ? `${address.slice(0, 6)}…${address.slice(-4)}` : 'Save with Base'}</span></button></header>
    <div className="player-strip"><div className="level-badge">{level}</div><div className="xp-detail"><span>Level {level}<small>{address ? 'Online angler' : 'Guest · saved on this device'}</small></span><div className="xp-track"><i style={{ width: `${xpProgress}%` }} /></div></div><div className="coins"><img src="/assets/ui/gold_coin_v2.png" alt="" /><strong>{profile.coins.toLocaleString()}</strong></div></div>
    <nav className="game-nav" aria-label="Game panels">{nav.map(([id, Icon, label]) => <button key={id} aria-label={`Open ${id}`} disabled={fishing} onClick={() => setPanel(id)}><Icon size={20} aria-hidden="true" /><span>{label}</span></button>)}</nav>
    <section className="fishing-controls" aria-label="Fishing controls"><p className="water-location">SALTWATER COVE <span>·</span> {profile.bait === 'worm' ? 'Basic worm' : profile.bait === 'shrimp' ? 'Premium shrimp' : 'Rare squid'}</p><p className="fishing-status" role="status">{status}</p>
      {game.phase === 'reeling' && <div className="reel-instruments"><div className="meter-label"><span>Line tension</span><strong>{Math.round(game.reel.tension * 100)}%</strong></div><div role="meter" aria-label="Line tension" aria-valuenow={Math.round(game.reel.tension * 100)} aria-valuemin={0} aria-valuemax={100} className={`tension-track ${game.reel.tension > .78 ? 'danger' : ''}`}><i style={{ width: `${game.reel.tension * 100}%` }} /></div><div className="meter-label"><span>Bringing it home</span><span>{Math.round(game.reel.progress * 100)}%</span></div><progress value={game.reel.progress} max={1} aria-label="Reel progress" /></div>}
      {['idle', 'lost'].includes(game.phase) && <button className="cast-button" aria-label="Cast line" onClick={() => void game.cast()}><Fish aria-hidden="true" /> Cast your line</button>}
      {game.phase === 'bite' && <button className="cast-button bite-button" aria-label="Hook fish" onClick={() => void game.hook()}>Set the hook</button>}
      {game.phase === 'reeling' && <button className={`cast-button reel-button ${game.holding ? 'holding' : ''}`} aria-label="Hold to reel" onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); game.hold(true); }} onPointerUp={() => game.hold(false)} onPointerCancel={() => game.hold(false)} onLostPointerCapture={() => game.hold(false)} onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); game.hold(true); } }} onKeyUp={() => game.hold(false)}>{game.holding ? 'Reeling…' : 'Hold to reel'}<small>Release to ease tension</small></button>}
      {['casting', 'waiting', 'saving'].includes(game.phase) && <div className="waiting-line"><span /><span /><span /></div>}
      {fishing && game.phase !== 'saving' && <button className="cancel-cast" onClick={game.reset}>Cancel cast</button>}
      {!fishing && <small className="play-hint">No wallet needed to fish. No transaction per cast.</small>}
    </section>
    {notice && <div className="toast" role="alert">{notice}<button aria-label="Dismiss notification" onClick={() => usePlayer.getState().notify('')}>×</button></div>}
    {panel && <Suspense fallback={<Modal title="Opening your kit…" onClose={() => setPanel(null)}><p>Loading…</p></Modal>}><Panels panel={panel} onClose={() => setPanel(null)} /></Suspense>}
    {walletLoaded && <Suspense fallback={walletOpen ? <Modal title="Connecting to Base" onClose={() => setWalletOpen(false)}><p>Loading wallet tools…</p></Modal> : null}><WalletPanel open={walletOpen} onClose={() => setWalletOpen(false)} /></Suspense>}
    {game.phase === 'caught' && caughtFish && game.caught && <Modal title="Catch landed" onClose={game.reset}><div className="catch-reveal"><small className={`rarity rarity-${caughtFish.rarity.toLowerCase()}`}>{caughtFish.rarity}{profile.catches[caughtFish.id]?.count === 1 ? ' · FIRST DISCOVERY' : ''}</small><div className="catch-art"><img src={caughtFish.image} alt={caughtFish.name} /></div><h2>{caughtFish.name}</h2><p className="catch-weight">{game.caught.weight.toLocaleString()} <small>kg</small></p><p>Added to your journal. {profile.catches[caughtFish.id]?.count} caught.</p><button className="primary" onClick={game.reset}>Keep fishing</button></div></Modal>}
  </main>;
}

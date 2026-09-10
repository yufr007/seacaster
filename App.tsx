import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { BookOpen, Anchor, Sun, Settings, Wallet, Fish, ArrowLeft, Volume2, VolumeX, Navigation2, Map, Sparkles, ChevronUp } from 'lucide-react';
import { FISH, levelForXP } from './game/engine';
import { PLATFORMS, platformFor } from './game/world';
import { usePlayer } from './app/player';
import { useFishing } from './app/useFishing';
import { Modal } from './app/Modal';
import { TitleScreen, Harbour, PlatformPicker } from './app/Harbour';
import { BaitBox } from './app/BaitBox';
import { useCastGesture } from './app/useCastGesture';
import { useWorldClock } from './app/useWorldClock';
import { useSoundscape, enableSound } from './app/useSoundscape';
import { oceanAudio } from './app/audio';
import { newMotion } from './app/world/types';
import type { Panel } from './app/Panels';
import './index.css';
const Scene = lazy(() => import('./app/Scene'));
const Panels = lazy(() => import('./app/Panels'));
const WalletPanel = lazy(() => import('./app/WalletPanel'));
type Screen = 'title' | 'harbour' | 'fishing';
export default function App() {
  const profile = usePlayer(s => s.profile), address = usePlayer(s => s.address);
  const notice = usePlayer(s => s.notice), passActive = usePlayer(s => s.passActive), moonlit = usePlayer(s => s.night), sound = usePlayer(s => s.sound);
  const game = useFishing(), motion = useRef(newMotion());
  const [screen, setScreen] = useState<Screen>(() => { try { return sessionStorage.getItem('seacaster:visited') ? 'harbour' : 'title'; } catch { return 'title'; } });
  const [panel, setPanel] = useState<Panel | null>(null), [platformsOpen, setPlatformsOpen] = useState(false), [baitOpen, setBaitOpen] = useState(false);
  const [walletLoaded, setWalletLoaded] = useState(false), [walletOpen, setWalletOpen] = useState(false);
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches), [reveal, setReveal] = useState(false);
  const castStart = useRef({ catches: profile.totalCatches, xp: profile.xp, coins: profile.coins });
  const clock = useWorldClock(moonlit && passActive), platform = platformFor(profile);
  const fishing = !['idle', 'lost', 'caught'].includes(game.phase), idle = ['idle', 'lost'].includes(game.phase);
  const modalOpen = Boolean(panel || platformsOpen || baitOpen || walletOpen || reveal);
  useSoundscape(game.phase, game.holding, clock.sky.daylight < .3, platform.id === 'river', motion.current.castAt);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)'), change = () => setReduced(media.matches);
    media.addEventListener('change', change); return () => media.removeEventListener('change', change);
  }, []);
  useEffect(() => { motion.current.tension = game.reel.tension; motion.current.progress = game.reel.progress; motion.current.holding = game.holding; }, [game.reel, game.holding]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => usePlayer.getState().notify(''), 6000); return () => clearTimeout(timer); }, [notice]);
  useEffect(() => {
    setReveal(false);
    if (game.phase !== 'caught') return;
    const timer = setTimeout(() => setReveal(true), reduced ? 50 : 1200); return () => clearTimeout(timer);
  }, [game.phase, reduced]);
  const beginCast = useCallback(() => {
    if (!['idle', 'lost'].includes(game.phase)) return;
    const p = usePlayer.getState().profile;
    castStart.current = { catches: p.totalCatches, xp: p.xp, coins: p.coins };
    motion.current.castAt = performance.now(); motion.current.bait = p.bait; motion.current.charge = 0; motion.current.progress = 0;
    oceanAudio.unlock(); oceanAudio.cue('cast'); void game.cast();
  }, [game.phase, game.cast]);
  const gesture = useCastGesture(screen === 'fishing' && idle && !modalOpen, motion, beginCast);
  const openBait = useCallback(() => { if (idle) { setBaitOpen(true); oceanAudio.cue('wood'); } }, [idle]);
  const reset = () => { game.reset(); setReveal(false); motion.current.charge = 0; };
  const go = (next: Screen) => { if (fishing || game.phase === 'caught') game.reset(); setScreen(next); oceanAudio.unlock(); oceanAudio.cue('wood'); };
  const openWallet = () => { setWalletLoaded(true); setWalletOpen(true); oceanAudio.cue('wood'); };
  const openPanel = (next: Panel) => { setPanel(next); oceanAudio.cue('wood'); };
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || screen !== 'fishing' || modalOpen || game.phase === 'caught' || (event.target as HTMLElement)?.closest('button,input,select,textarea')) return;
      event.preventDefault();
      if (game.phase === 'reeling') game.hold(true);
      else if (!event.repeat && game.phase === 'bite') void game.hook();
      else if (!event.repeat && idle) beginCast();
    };
    const up = (event: KeyboardEvent) => { if (event.code === 'Space') game.hold(false); };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [game.phase, game.hold, game.hook, screen, modalOpen, idle, beginCast]);
  const caughtFish = game.caught ? FISH.find(f => f.id === game.caught!.speciesId) : null;
  const unlocked = game.phase === 'caught' ? PLATFORMS.find(p => p.catches > castStart.current.catches && p.catches <= profile.totalCatches) : undefined;
  const status = { idle: 'The water is calling.', casting: 'Here we go…', waiting: 'Watch the float. Something is stirring.', bite: 'A bite! Set the hook.', reeling: game.holding ? 'Easy does it. Watch the tension.' : 'A little slack. Then reel again.', saving: 'Bringing your catch aboard…', caught: 'Now that is a keeper.', lost: 'The one that got away. Try another cast.' }[game.phase];
  return <main className={`sea-app screen-${screen} sky-${clock.sky.period}`} {...gesture}>
    <Suspense fallback={<div className="scene-layer illustrated-water" />}><Scene phase={game.phase} platform={platform.id} motion={motion} sky={clock.sky} home={screen !== 'fishing'} reduced={reduced} baitOpen={baitOpen} onBait={openBait} species={game.caught?.speciesId} /></Suspense>
    {screen === 'title' && <TitleScreen onEnter={() => { try { sessionStorage.setItem('seacaster:visited', '1'); } catch { /* optional */ } go('harbour'); }} onSound={() => enableSound(!sound)} />}
    {screen === 'harbour' && <Harbour onFish={() => go('fishing')} onPanel={openPanel} onPlatforms={() => setPlatformsOpen(true)} onWallet={openWallet} time={clock.time} period={clock.sky.period} />}
    {screen === 'fishing' && <section className="fishing-view" aria-label="Fishing scene">
      <header className="fishing-header"><button className="round-button" aria-label="Return to harbour" disabled={game.phase === 'saving'} onClick={() => go('harbour')}><ArrowLeft size={20} /></button><div className="location-tag"><strong>{platform.name}</strong><span>{clock.time} · {clock.sky.period === 'night' ? 'Moonlit water' : clock.sky.period === 'dusk' ? 'Golden hour' : 'The good life'}</span></div><button className="round-button" aria-label={sound ? 'Mute sound' : 'Enable sound'} onClick={() => enableSound(!sound)}>{sound ? <Volume2 size={18} /> : <VolumeX size={18} />}</button></header>
      <div className="fishing-stats"><span className="level-chip">LVL {levelForXP(profile.xp)}</span><span className="coin-pill" key={profile.coins}><span aria-hidden="true">●</span>{profile.coins.toLocaleString()}</span></div>
      {idle && !modalOpen && <div className="cast-gesture-zone" data-testid="cast-gesture" aria-label="Swipe upward across the water to cast"><div className="cast-trail"><ChevronUp /><ChevronUp /></div></div>}
      <section className="fishing-controls" aria-label="Fishing controls">
        <p className="fishing-status" role="status">{status}</p>
        {idle && <><div className="swipe-hint"><Navigation2 size={23} /><strong>Swipe up to cast</strong><small>Aim with your swipe</small></div><button className="tap-cast" aria-label="Cast line" onClick={() => { motion.current.power = .6; motion.current.aim = 0; beginCast(); }}>or tap to cast</button></>}
        {game.phase === 'bite' && <button className="hero-button bite-button" aria-label="Hook fish" onClick={() => void game.hook()}><Fish /> Set the hook!</button>}
        {game.phase === 'reeling' && <><div className="reel-instruments"><div className="meter-label"><span>Line tension</span><strong>{Math.round(game.reel.tension * 100)}%</strong></div><div role="meter" aria-label="Line tension" aria-valuenow={Math.round(game.reel.tension * 100)} aria-valuemin={0} aria-valuemax={100} className={`tension-track ${game.reel.tension > .78 ? 'danger' : ''}`}><i style={{ width: `${game.reel.tension * 100}%` }} /></div><div className="meter-label"><span>Bringing it home</span><span>{Math.round(game.reel.progress * 100)}%</span></div><progress value={game.reel.progress} max={1} aria-label="Reel progress" /></div><button className={`hero-button reel-button ${game.holding ? 'holding' : ''}`} aria-label="Hold to reel" onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); game.hold(true); }} onPointerUp={() => game.hold(false)} onPointerCancel={() => game.hold(false)} onLostPointerCapture={() => game.hold(false)} onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); game.hold(true); } }} onKeyUp={() => game.hold(false)}>{game.holding ? 'Reeling…' : 'Hold to reel'}<small>Release to ease tension</small></button></>}
        {['casting', 'waiting', 'saving'].includes(game.phase) && <div className="float-watch" aria-hidden="true"><i /><span>Let the world slow down.</span></div>}
        {fishing && game.phase !== 'saving' && <button className="cancel-cast" onClick={reset}>Cancel cast</button>}
        <nav className="dock-tools" aria-label="Game panels"><button aria-label="Open collection" disabled={!idle} onClick={() => openPanel('collection')}><BookOpen size={19} /><span>Journal</span></button><button aria-label="Open tackle" disabled={!idle} onClick={() => openPanel('tackle')}><Anchor size={19} /><span>Tackle</span></button><button aria-label="Open platforms" disabled={!idle} onClick={() => setPlatformsOpen(true)}><Map size={19} /><span>Places</span></button><button aria-label="Open settings" disabled={!idle} onClick={() => openPanel('settings')}><Settings size={19} /><span>Settings</span></button></nav>
      </section>
    </section>}
    {notice && <div className="toast" role="alert">{notice}<button aria-label="Dismiss notification" onClick={() => usePlayer.getState().notify('')}>×</button></div>}
    {panel && <Suspense fallback={<Modal title="Opening your kit…" onClose={() => setPanel(null)}><p>Loading…</p></Modal>}><Panels panel={panel} onClose={() => setPanel(null)} /></Suspense>}
    {platformsOpen && <PlatformPicker onClose={() => setPlatformsOpen(false)} />}
    {baitOpen && <BaitBox onClose={() => setBaitOpen(false)} onShop={() => { setBaitOpen(false); openPanel('tackle'); }} />}
    {walletLoaded && <Suspense fallback={walletOpen ? <Modal title="Connecting to Base" onClose={() => setWalletOpen(false)}><p>Loading wallet tools…</p></Modal> : null}><WalletPanel open={walletOpen} onClose={() => setWalletOpen(false)} /></Suspense>}
    {reveal && game.phase === 'caught' && caughtFish && game.caught && <Modal title="Catch landed" onClose={reset}><div className="catch-reveal"><small className={`rarity rarity-${caughtFish.rarity.toLowerCase()}`}>{caughtFish.rarity}{profile.catches[caughtFish.id]?.count === 1 ? ' · FIRST DISCOVERY' : ''}</small><div className="catch-art"><img src={caughtFish.image} alt={caughtFish.name} /></div><h2>{caughtFish.name}</h2><p className="catch-weight">{game.caught.weight.toLocaleString()} <small>kg</small></p><div className="catch-earnings"><span>+{profile.xp - castStart.current.xp} XP</span><span>+{profile.coins - castStart.current.coins} coins</span></div><p>{platform.name} · {clock.time}</p>{unlocked && <div className="unlock-reveal"><Sparkles size={20} /><span>New place unlocked!<strong>{unlocked.name}</strong></span></div>}<button className="primary" onClick={reset}>Keep fishing</button><button className="secondary wide-button" onClick={() => { reset(); go('harbour'); }}>Back to your harbour</button></div></Modal>}
  </main>;
}

import { Anchor, BookOpen, ChevronRight, Fish, Map, Sailboat, Ship, Sprout, Lock, Sun, Moon, Volume2, VolumeX, Trophy, Settings, Wallet } from 'lucide-react';
import { dayKey, FISH, levelForXP, nextLevelXP } from '../game/engine';
import { PLATFORMS, platformFor, equipPlatform } from '../game/world';
import type { PlatformId } from '../game/world';
import type { Profile } from '../game/engine';
import { usePlayer } from './player';
import { oceanAudio } from './audio';
import { api } from './api';
import { useState } from 'react';
import { Modal } from './Modal';
import type { Panel } from './Panels';
export const PlatformIcon = ({ id, size = 26 }: { id: PlatformId; size?: number }) => id === 'pier' ? <Anchor size={size} /> : id === 'river' ? <Sprout size={size} /> : id === 'boat' ? <Sailboat size={size} /> : <Ship size={size} />;

export function TitleScreen({ onEnter, onSound }: { onEnter: () => void; onSound: () => void }) {
  const sound = usePlayer(s => s.sound);
  return <section className="title-screen" aria-label="Welcome to SeaCaster">
    <button className="round-button title-sound" aria-label={sound ? 'Mute sound' : 'Enable sound'} onClick={onSound}>{sound ? <Volume2 /> : <VolumeX />}</button>
    <div className="title-brand"><span className="title-fish"><Fish size={46} /></span><h1><span>SEA</span>CASTER</h1><p>A little life on the water.</p></div>
    <div className="title-actions"><button className="hero-button" onClick={onEnter}>Enter the harbour <ChevronRight size={23} /></button><p>Cast a line. Find your place.</p><small>Play free. Your wallet can wait.</small></div>
  </section>;
}
export function Harbour({ onFish, onPanel, onPlatforms, onWallet, time, period }: { onFish: () => void; onPanel: (panel: Panel) => void; onPlatforms: () => void; onWallet: () => void; time: string; period: string }) {
  const p = usePlayer(s => s.profile), address = usePlayer(s => s.address);
  const platform = platformFor(p), next = PLATFORMS.find(v => p.totalCatches < v.catches);
  const level = levelForXP(p.xp), xpStart = (level - 1) ** 2 * 100;
  const dailyCount = p.daily.day === dayKey(Date.now()) ? p.daily.catches : 0;
  return <section className="harbour-home" aria-label="Harbour dashboard">
    <header className="harbour-header"><div className="small-logo"><Fish size={25} /><strong>SeaCaster</strong></div><div className="header-tools"><button className="round-button" aria-label="Open settings" onClick={() => onPanel('settings')}><Settings size={19} /></button><button className="round-button" aria-label="Save with Base" onClick={onWallet}><Wallet size={19} /></button></div></header>
    <div className="harbour-greeting"><p>{period === 'night' ? <Moon size={15} /> : <Sun size={15} />}{time} · Your local water</p><h2>Your little life<br />on the water.</h2><span>{p.totalCatches === 0 ? 'Every great angler starts with a little pier.' : `${p.totalCatches} catches. Plenty more stories to find.`}</span></div>
    <div className="harbour-bottom">
      <div className="captain-strip"><div className="captain-level">{level}<small>LVL</small></div><div className="captain-progress"><strong>{address ? 'Your online logbook' : 'Your captain’s log'}</strong><div className="xp-track"><i style={{ width: `${Math.min(100, (p.xp - xpStart) / Math.max(1, nextLevelXP(p.xp) - xpStart) * 100)}%` }} /></div><small>{p.xp.toLocaleString()} XP · {Object.keys(p.catches).length}/{FISH.length} species</small></div><div className="coin-pill"><span aria-hidden="true">●</span>{p.coins.toLocaleString()}</div></div>
      <button className="berth-strip" onClick={onPlatforms}><span className={`berth-icon icon-${platform.id}`}><PlatformIcon id={platform.id} /></span><span><small>YOUR CURRENT BERTH</small><strong>{platform.name}</strong></span><ChevronRight size={20} /></button>
      <button className="hero-button" aria-label="Go fishing" onClick={onFish}><Fish size={22} /> Go fishing <ChevronRight size={21} /></button>
      <div className="harbour-shortcuts"><button aria-label="Open collection" onClick={() => onPanel('collection')}><BookOpen /><span>Journal</span></button><button aria-label="Open challenges" onClick={() => onPanel('challenges')}><Sun /><span>Daily {Math.min(5, dailyCount)}/5</span></button><button aria-label="Open platforms" onClick={onPlatforms}><Map /><span>Explore</span></button><button aria-label="Open leaderboard" onClick={() => onPanel('leaderboard')}><Trophy /><span>Harbour board</span></button></div>
      {next && <p className="next-berth"><Sailboat size={14} /><span><strong>{next.catches - p.totalCatches} more catches</strong> to {next.name}</span></p>}
    </div>
  </section>;
}
export function PlatformPicker({ onClose }: { onClose: () => void }) {
  const profile = usePlayer(s => s.profile), address = usePlayer(s => s.address);
  const [busy, setBusy] = useState(false);
  async function choose(id: PlatformId) {
    if (busy) return; setBusy(true);
    const revision = usePlayer.getState().revision;
    try {
      const next = address ? (await api<{ profile: Profile }>('/platform', { id }, address)).profile : equipPlatform(usePlayer.getState().profile, id);
      if (revision !== usePlayer.getState().revision) return;
      usePlayer.getState().setProfile(next); oceanAudio.cue('wood'); onClose();
    } catch (e) { usePlayer.getState().notify(e instanceof Error ? e.message : 'Could not change your berth.'); }
    finally { setBusy(false); }
  }
  return <Modal title="Find your next favourite place" onClose={onClose} wide>
    <p className="muted">New views are earned, not rented. Every catch brings your next berth closer.</p>
    <div className="platform-list">{PLATFORMS.map((p, i) => {
      const locked = profile.totalCatches < p.catches, selected = platformFor(profile).id === p.id;
      return <article className={`platform-card platform-card-${p.id} ${selected ? 'selected' : ''}`} key={p.id}><div className="platform-illustration"><PlatformIcon id={p.id} size={64} /><span className="berth-number">0{i + 1}</span></div><div className="platform-copy"><small>{p.location}</small><h3>{p.name}</h3><p>{p.description}</p>{locked && <div className="platform-unlock"><progress value={profile.totalCatches} max={p.catches} aria-label={`${p.name} unlock progress`} /><span>{profile.totalCatches}/{p.catches} catches</span></div>}<button disabled={busy || locked || selected} onClick={() => void choose(p.id)}>{locked ? <><Lock size={14} /> {p.catches - profile.totalCatches} catches to go</> : selected ? 'Your current berth' : `Fish from ${p.name}`}</button></div></article>;
    })}</div><p className="store-note">These are progress-unlocked environments. Catch odds and rewards do not change with your platform.</p>
  </Modal>;
}

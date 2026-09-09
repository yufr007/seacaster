import { useEffect, useState } from 'react';
import { FISH, TACKLE, buyTackle, equipTackle, claimDaily, dayKey, levelForXP } from '../game/engine.ts';
import type { Profile } from '../game/engine.ts';
import { usePlayer } from './player';
import { api } from './api';
import { Modal } from './Modal';
export type Panel = 'collection' | 'tackle' | 'challenges' | 'leaderboard' | 'settings';
const titles: Record<Panel, string> = { collection: 'The field journal', tackle: 'The tackle shop', challenges: 'Today on the water', leaderboard: 'The harbour board', settings: 'Make yourself at home' };
function Leaderboard() {
  const [rows, setRows] = useState<{ address: string; xp: number; catches: number }[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { let active = true; api<{ players: NonNullable<typeof rows> }>('/leaderboard').then(v => { if (active) setRows(v.players); }).catch(e => { if (active) setError(e.message); }); return () => { active = false; }; }, []);
  if (error) return <p className="muted">{error}</p>;
  if (!rows) return <p role="status">Loading the harbour board…</p>;
  if (!rows.length) return <p className="empty-state">The water is yours. No authenticated catches have been recorded yet.</p>;
  return <ol className="leaderboard">{rows.map(p => <li key={p.address}><span>{p.address.slice(0, 6)}…{p.address.slice(-4)}</span><strong>{p.xp.toLocaleString()} XP</strong><small>{p.catches} catches</small></li>)}</ol>;
}
export default function Panels({ panel, onClose }: { panel: Panel; onClose: () => void }) {
  const profile = usePlayer(s => s.profile), address = usePlayer(s => s.address);
  const sound = usePlayer(s => s.sound), lowPower = usePlayer(s => s.lowPower);
  const [busy, setBusy] = useState(false), [filter, setFilter] = useState('All');
  async function act(action: 'buy' | 'equip' | 'daily', id?: string) {
    if (busy) return;
    setBusy(true); const revision = usePlayer.getState().revision;
    try {
      const p = usePlayer.getState().profile;
      const next = address ? (await api<{ profile: Profile }>(action === 'daily' ? '/daily' : '/tackle', { action, id }, address)).profile : action === 'buy' ? buyTackle(p, id!) : action === 'equip' ? equipTackle(p, id!) : claimDaily(p);
      if (revision !== usePlayer.getState().revision) return;
      usePlayer.getState().setProfile(next);
      usePlayer.getState().notify(action === 'buy' ? 'Added to your tackle box.' : action === 'daily' ? 'Daily challenge claimed. +100 coins.' : 'Tackle equipped.');
    } catch (e) { usePlayer.getState().notify(e instanceof Error ? e.message : 'Could not update tackle.'); }
    finally { setBusy(false); }
  }
  const today = dayKey(Date.now()), dailyCount = profile.daily.day === today ? profile.daily.catches : 0;
  const claimedToday = profile.daily.day === today && profile.daily.claimed;
  return <Modal title={titles[panel]} onClose={onClose} wide={panel === 'collection'}>
    {panel === 'collection' && <>
      <div className="section-line"><p>{Object.keys(profile.catches).length} / {FISH.length} discovered</p><label>Show <select value={filter} onChange={e => setFilter(e.target.value)}><option>All</option><option>Discovered</option><option>Undiscovered</option></select></label></div>
      <div className="fish-grid">{FISH.filter(f => filter === 'All' || (filter === 'Discovered' ? !!profile.catches[f.id] : !profile.catches[f.id])).map(f => {
        const entry = profile.catches[f.id];
        return <article key={f.id} className={`fish-entry ${entry ? '' : 'undiscovered'}`}><div className="fish-art"><img src={f.image} alt={entry ? f.name : 'Undiscovered species silhouette'} loading="lazy" /></div><small className={`rarity rarity-${f.rarity.toLowerCase()}`}>{f.rarity}</small><h3>{entry ? f.name : 'Uncharted waters'}</h3><p>{entry ? `${entry.count} caught · best ${entry.best.toLocaleString()} kg` : 'A story still waiting to be told.'}</p></article>;
      })}</div>
    </>}
    {panel === 'tackle' && <>
      <div className="section-line"><p>Earned in-game currency</p><strong>{profile.coins.toLocaleString()} coins</strong></div>
      <p className="muted">Basic worms are always free. Rods are permanent. Bait is consumed when you cast.</p>
      <div className="tackle-list"><article><div><h3>Bamboo pole & basic worm</h3><p>Your original kit. No cost, no limits.</p></div><button disabled={busy} onClick={() => void act('equip', 'worm')}>{profile.bait === 'worm' ? 'Worm equipped' : 'Equip worm'}</button></article>
      {TACKLE.map(item => {
        const bait = item.id === 'shrimp' || item.id === 'squid';
        const owned = bait ? profile.baits[item.id as 'shrimp' | 'squid'] : profile.rods.includes(item.id as 'carbon' | 'gold') ? 1 : 0;
        const equipped = profile.bait === item.id || profile.rod === item.id;
        const locked = levelForXP(profile.xp) < item.level;
        return <article key={item.id}><img src={item.image} alt="" loading="lazy" /><div><h3>{item.name}</h3><p>{item.description}</p><small>{bait ? `${owned} remaining` : owned ? 'Owned permanently' : `Level ${item.level}`}</small></div><div className="tackle-actions">{(bait || !owned) && <button aria-label={`Buy ${item.name}`} disabled={busy || locked || profile.coins < item.price} onClick={() => void act('buy', item.id)}>{locked ? `Level ${item.level}` : `${item.price} coins`}</button>}{owned > 0 && <button className="secondary" disabled={busy || equipped} onClick={() => void act('equip', item.id)}>{equipped ? 'Equipped' : 'Equip'}</button>}</div></article>;
      })}</div>
    </>}
    {panel === 'challenges' && <section className="challenge"><img src="/assets/ui/daily_gift_v3.png" alt="" /><h3>Five before sundown</h3><p>Land five fish today. Any species. Any size.</p><progress max={5} value={Math.min(5, dailyCount)} aria-label="Daily catches" /><p>{Math.min(5, dailyCount)} / 5 fish · 100 earned coins</p><button className="primary" disabled={busy || dailyCount < 5 || claimedToday} onClick={() => void act('daily')}>{claimedToday ? 'Reward collected' : 'Claim daily reward'}</button><small>Resets at 00:00 UTC. No entry fee or cash prize.</small></section>}
    {panel === 'leaderboard' && <><p className="muted">Server-recorded progress only. Guest practice does not enter this board.</p><Leaderboard /></>}
    {panel === 'settings' && <div className="settings-list"><label><span><strong>Sound effects</strong><small>Gentle cues for casting, bites and catches.</small></span><input type="checkbox" checked={sound} onChange={e => usePlayer.getState().settings({ sound: e.target.checked })} /></label><label><span><strong>Low-power mode</strong><small>Use SeaCaster's illustrated scene instead of 3D.</small></span><input type="checkbox" checked={lowPower} onChange={e => usePlayer.getState().settings({ lowPower: e.target.checked })} /></label><p className="muted">Hold to reel. Release to ease the tension. On a keyboard, use Space. Leaving the game cancels the current attempt without removing earlier catches.</p><p className="muted">{address ? 'Your current progress is stored against your signed-in wallet.' : 'Guest progress stays in this browser. Online accounts start a separate, server-verified collection.'}</p></div>}
  </Modal>;
}

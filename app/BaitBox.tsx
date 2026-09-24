import { useState } from 'react';
import { Check, ShoppingBag } from 'lucide-react';
import { Modal } from './Modal';
import { usePlayer } from './player';
import { equipTackle } from '../game/engine';
import type { Bait, Profile } from '../game/engine';
import { api } from './api';
import { oceanAudio } from './audio';
const BAITS: { id: Bait; name: string; copy: string; image: string }[] = [
  { id: 'worm', name: 'Worm', copy: 'Always ready. Always free.', image: '/assets/bait/bait_worm_v2.png' },
  { id: 'shrimp', name: 'Shrimp', copy: 'A little less waiting.', image: '/assets/bait/bait_shrimp_1765863173083.png' },
  { id: 'squid', name: 'Squid', copy: 'A nudge toward rarer fish.', image: '/assets/bait/bait_squid_1765863189969.png' },
];
export function BaitBox({ onClose, onShop }: { onClose: () => void; onShop: () => void }) {
  const p = usePlayer(s => s.profile), address = usePlayer(s => s.address);
  const [busy, setBusy] = useState(false);
  async function choose(id: Bait) {
    if (busy) return; setBusy(true); const revision = usePlayer.getState().revision;
    try {
      const next = address ? (await api<{ profile: Profile }>('/tackle', { action: 'equip', id }, address)).profile : equipTackle(usePlayer.getState().profile, id);
      if (revision !== usePlayer.getState().revision) return;
      usePlayer.getState().setProfile(next); oceanAudio.cue('wood'); onClose();
    } catch (e) { usePlayer.getState().notify(e instanceof Error ? e.message : 'Could not select bait.'); }
    finally { setBusy(false); }
  }
  return <Modal title="A little something for the fish" onClose={onClose}>
    <p className="muted">Pick your bait. It travels from your rod to the water on the next cast.</p>
    <div className="bait-slots">{BAITS.map(b => <button key={b.id} aria-label={`Use ${b.name.toLowerCase()} bait`} className={p.bait === b.id ? 'selected' : ''} disabled={busy || (b.id !== 'worm' && p.baits[b.id] === 0)} onClick={() => void choose(b.id)}><div className="bait-art"><img src={b.image} alt="" /></div><strong>{b.name}</strong><small>{b.id === 'worm' ? 'Unlimited' : `${p.baits[b.id]} left`}</small>{p.bait === b.id && <Check size={16} />}</button>)}</div>
    <p className="bait-description">{BAITS.find(b => b.id === p.bait)!.copy}</p>
    <button className="secondary wide-button" onClick={onShop}><ShoppingBag size={17} /> Restock at the tackle shop</button>
  </Modal>;
}

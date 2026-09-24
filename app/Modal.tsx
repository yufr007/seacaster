import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import './ArtLayout.css';
export function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null), id = useId();
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} className={`panel ${wide ? 'panel-wide' : ''}`} aria-labelledby={id} onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="panel-heading"><h2 id={id}>{title}</h2><button className="icon-button" aria-label="Close panel" onClick={onClose}>×</button></div>
    <div className="panel-body">{children}</div>
  </dialog>;
}

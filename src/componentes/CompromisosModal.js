import '../hojas-estilo/Modal.css';
import { useState, useEffect } from 'react';

// default types moved to module scope to keep a stable reference for hooks
const DEFAULT_TYPES = [
  { tipo: 'DEPORTE', descripcion: 'Yoga 30 min', target: 3 },
  { tipo: 'SUEÑO', descripcion: '8 horas', target: 7 },
  { tipo: 'NUTRICIÓN', descripcion: 'Comida equilibrada', target: 5 },
  { tipo: 'SALUD MENTAL', descripcion: 'Terapia breve', target: 1 },
  { tipo: 'MINDFULNESS', descripcion: 'Meditación 10 min', target: 3 },
  { tipo: 'RELACIONES', descripcion: 'Contactar a un amigo', target: 1 }
];

export default function CompromisosModal({ visible, onClose, onSubmit, defaultConfig }){
  const [items, setItems] = useState(defaultConfig || DEFAULT_TYPES);

  useEffect(()=>{
    if(defaultConfig){
      setItems(defaultConfig);
    }
  },[defaultConfig]);

  useEffect(()=>{
    if(!visible){
      setItems(defaultConfig || DEFAULT_TYPES);
    }
  },[visible, defaultConfig]);

  if(!visible) return null;

  const updateTarget = (index, value) => {
    const copy = items.map((it, i)=> i===index ? { ...it, target: value } : it);
    setItems(copy);
  };

  const updateDescription = (index, value) => {
    const copy = items.map((it, i)=> i===index ? { ...it, descripcion: value } : it);
    setItems(copy);
  };

  const submit = (e)=>{
    e.preventDefault();
    onSubmit(items);
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-box">
        <div className="modal-header">
          <h2>Definir compromisos semanales</h2>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <form className="modal-body" onSubmit={submit}>
          <div className='modal-items'>
            {items.map((it, idx) => (
              <div key={it.tipo} className='modal-item'>
                <div>{it.tipo}</div>
                <div className='modal-inputs'>
                    <input className="modal-input" type="text" value={it.descripcion || ''} onChange={e=>updateDescription(idx, e.target.value)} style={{width:250}} placeholder="Descripción del compromiso" />
                    <input className="modal-input" type="number" min="0" max="7" value={it.target} onChange={e=>updateTarget(idx, Math.max(0, Math.min(7, Number(e.target.value || 0))))} style={{width:80}} />
                </div>
              </div>
            ))}
          </div>

          <div className="modal-actions">
            <button type="button" className="modal-btn modal-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="modal-btn modal-submit">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

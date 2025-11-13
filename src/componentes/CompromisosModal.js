import '../hojas-estilo/Modal.css';
import { useState, useEffect } from 'react';

// default types moved to module scope to keep a stable reference for hooks
const DEFAULT_TYPES = [
  { tipo: 'DEPORTE', descripcion: '', target: 3 },
  { tipo: 'SUEÑO', descripcion: '', target: 7 },
  { tipo: 'NUTRICIÓN', descripcion: '', target: 5 },
  { tipo: 'SALUD MENTAL', descripcion: '', target: 1 },
  { tipo: 'MINDFULNESS', descripcion: '', target: 3 },
  { tipo: 'RELACIONES', descripcion: '', target: 1 }
];

export default function CompromisosModal({ visible, onClose, onSubmit, defaultConfig }){
  // normalize incoming config: ensure descripcion string and target at least 1
  // always keep descripcion empty so the modal shows only the placeholder
  const normalize = (arr) => (arr || DEFAULT_TYPES).map(it => ({
    tipo: it.tipo,
    descripcion: '',
    target: Math.max(1, Number(it.target || 1))
  }));

  const [items, setItems] = useState(() => normalize(defaultConfig));
  const [errors, setErrors] = useState({});

  useEffect(()=>{
    if(defaultConfig){
      setItems(normalize(defaultConfig));
    }
  },[defaultConfig]);

  useEffect(()=>{
    if(!visible){
      setItems(normalize(defaultConfig));
      setErrors({});
    }
  },[visible, defaultConfig]);

  if(!visible) return null;

  const updateTarget = (index, value) => {
    const v = Math.max(1, Math.min(7, Number(value || 1)));
    const copy = items.map((it, i)=> i===index ? { ...it, target: v } : it);
    setItems(copy);
    setErrors(prev => ({ ...prev, [index]: undefined }));
  };

  const updateDescription = (index, value) => {
    const copy = items.map((it, i)=> i===index ? { ...it, descripcion: value } : it);
    setItems(copy);
    setErrors(prev => ({ ...prev, [index]: undefined }));
  };

  const submit = (e)=>{
    e.preventDefault();
    // validate: each item must have a non-empty descripcion and target between 1 and 7
    const newErrors = {};
    items.forEach((it, idx) => {
      if(!it.descripcion || String(it.descripcion).trim() === ''){
        newErrors[idx] = 'La descripción no puede quedar vacía.';
      } else if(!Number.isFinite(Number(it.target)) || Number(it.target) < 1 || Number(it.target) > 7){
        newErrors[idx] = 'Días debe ser un número entre 1 y 7.';
      }
    });

    if(Object.keys(newErrors).length > 0){
      setErrors(newErrors);
      // focus not implemented; just keep modal open
      return;
    }

    // all good
    setErrors({});
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
                <div className='modal-compromisos-item'>
                  <div>{it.tipo}</div>
                  <div>Días a la semana</div>
                </div>
                <div className='modal-inputs'>
                    <input className="modal-input" type="text" value={it.descripcion || ''} onChange={e=>updateDescription(idx, e.target.value)} style={{width:250}} placeholder="Descripción del compromiso" />
                    <input className="modal-input" type="number" min="1" max="7" value={it.target} onChange={e=>updateTarget(idx, e.target.value)} style={{width:80}} />
                </div>
                {errors[idx] && <div className='modal-error' role='alert' style={{color:'#b00020', marginTop:6}}>{errors[idx]}</div>}
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

import '../hojas-estilo/Modal.css';
import { useState, useEffect } from 'react';

export default function AddTaskModal({ visible, onClose, onSubmit, defaultDate, initialTask }){
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  // initialize fields from initialTask (edit) or defaultDate (new)
  useEffect(() => {
    if (initialTask) {
      setName(initialTask.name || '');
      setTime(initialTask.time || '');
      if (initialTask.date) setDate(initialTask.date);
    } else if(defaultDate){
      const y = defaultDate.y;
      const m = (defaultDate.m+1).toString().padStart(2,'0');
      const d = defaultDate.d.toString().padStart(2,'0');
      setDate(`${y}-${m}-${d}`);
    }
  }, [initialTask, defaultDate]);

  useEffect(() => {
    if(!visible){
      setName(''); setTime(''); setDate('');
    }
  }, [visible]);

  if(!visible) return null;

  const submit = (e)=>{
    e.preventDefault();
    if(!name.trim() || !date) return;
    onSubmit({ name: name.trim(), date, time: time || '' });
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-box">
        <div className="modal-header">
          <h2>{initialTask ? 'Editar tarea' : 'Nueva tarea'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <form className="modal-body" onSubmit={submit}>
          <label className="modal-label">Nombre de la tarea
            <input className="modal-input" value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre" required />
          </label>

          <label className="modal-label">Fecha
            <input className="modal-input" type="date" value={date} onChange={e=>setDate(e.target.value)} required />
          </label>

          <label className="modal-label">Horario
            <input className="modal-input" type="time" value={time} onChange={e=>setTime(e.target.value)} />
          </label>

          <div className="modal-actions">
            <button type="button" className="modal-btn modal-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="modal-btn modal-submit">{initialTask ? 'Guardar' : 'Agregar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

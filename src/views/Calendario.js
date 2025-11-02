import Tarea from "../componentes/Tarea";
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import CalendarioMes from '../componentes/CalendarioMes';

export default function Calendario() {
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState('');
  const [tasks, setTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null); // {y,m,d}

  const keyForDate = (date) => {
    if(!date) return null;
    const pad = n => n<10? '0'+n: ''+n;
    return `tasks-${date.y}-${pad(date.m+1)}-${pad(date.d)}`;
  };

  const addTask = () => {
    if (!selectedDate) return;
    if (newText.trim()) {
      const k = keyForDate(selectedDate);
      const existing = JSON.parse(localStorage.getItem(k) || '[]');
      const updated = [newText.trim(), ...existing];
      localStorage.setItem(k, JSON.stringify(updated));
      setTasks(updated);
      setNewText('');
      setAdding(false);
    }
  };

  const removeTask = (index) => {
    if (!selectedDate) return;
    const k = keyForDate(selectedDate);
    const existing = JSON.parse(localStorage.getItem(k) || '[]');
    const updated = existing.filter((_,i)=>i!==index);
    localStorage.setItem(k, JSON.stringify(updated));
    setTasks(updated);
  };

  const onDateSelect = (date) => {
    setSelectedDate(date);
    const k = keyForDate(date);
    const existing = JSON.parse(localStorage.getItem(k) || '[]');
    setTasks(existing);
    setAdding(false);
  };

  return (
    <div className="calendario-contenedor">
      <div className="calendario">
          <CalendarioMes onDateSelect={onDateSelect} />
      </div>
      
        <div className="titulo-tareas">TAREAS</div>
      <div className="tareas-contenedor">
        {selectedDate ? (
          tasks.map((t, i) => (
            <Tarea key={i} Descripción={t} onDelete={() => removeTask(i)} />
          ))
        ) : (
          <div className="no-selected">Selecciona un día para ver tus tareas</div>
        )}
      </div>
      <div className="tareas-agrega">
        {!adding ? (
          <button className="agrega-button" onClick={() => setAdding(true)}>
            <FontAwesomeIcon icon={faPlus} />
          </button>
        ) : (
          <div className="agrega-input">
            <input value={newText} onChange={e => setNewText(e.target.value)} placeholder={selectedDate ? "Nueva tarea" : "Selecciona un día primero"} />
            <button onClick={addTask} disabled={!selectedDate}>Agregar</button>
            <button onClick={() => setAdding(false)}>Cancelar</button>
          </div>
        )}
      </div>
    </div>
  );
}

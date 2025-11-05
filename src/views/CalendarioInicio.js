import Tarea from "../componentes/Tarea";
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faRightFromBracket, faHandFist, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { faCircleCheck } from '@fortawesome/free-regular-svg-icons';
import CalendarioMes from '../componentes/CalendarioMes';
import AddTaskModal from '../componentes/AddTaskModal';
import { useNavigate } from 'react-router-dom';
import '../hojas-estilo/CalendarioInicio.css';
import { useAuth } from '../context/AuthContext';

export default function Calendario() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  // load user display values from auth (fallbacks kept for guests)
  const userName = currentUser && currentUser.name ? currentUser.name : 'Invitada';
  const userEmail = currentUser && currentUser.email ? currentUser.email : '';

  const [adding, setAdding] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null); // {y,m,d}
  const [editingTask, setEditingTask] = useState(null);

  const keyForDate = (date) => {
    if(!date) return null;
    const pad = n => n<10? '0'+n: ''+n;
    return `tasks-${date.y}-${pad(date.m+1)}-${pad(date.d)}`;
  };

  // sort tasks by time (earliest -> latest). Tasks without time go last.
  const sortTasks = (list) => {
    if(!Array.isArray(list)) return [];
    const toMinutes = (t) => {
      if(!t) return 24*60; // no time -> put at end
      const parts = t.split(':');
      if(parts.length < 2) return 24*60;
      const hh = parseInt(parts[0],10);
      const mm = parseInt(parts[1],10);
      if(Number.isNaN(hh) || Number.isNaN(mm)) return 24*60;
      return hh*60 + mm;
    };

    // copy to avoid mutating original
    return [...list].sort((a,b)=>{
      // handle legacy string items: treat as no-time
      const ta = (typeof a === 'string') ? '' : (a.time || '');
      const tb = (typeof b === 'string') ? '' : (b.time || '');
      const ma = toMinutes(ta);
      const mb = toMinutes(tb);
      if(ma === mb) return 0;
      return ma - mb;
    });
  };

  // addTask via modal submit — store object {name,date,time}
  const handleModalSubmit = ({ name, date, time }) => {
    // date is YYYY-MM-DD
    const [yStr, mStr, dStr] = date.split('-');
    const dateKey = { y: parseInt(yStr, 10), m: parseInt(mStr, 10) - 1, d: parseInt(dStr, 10) };
    // If editingTask is set, update existing task (may move between dates). Otherwise create new.
    if (editingTask) {
      // remove from old date key
      const oldDateParts = (editingTask.date || '').split('-');
      if (oldDateParts.length === 3) {
        const oldKeyObj = { y: parseInt(oldDateParts[0],10), m: parseInt(oldDateParts[1],10)-1, d: parseInt(oldDateParts[2],10) };
        const oldK = keyForDate(oldKeyObj);
        const oldList = JSON.parse(localStorage.getItem(oldK) || '[]');
        const filteredOld = oldList.filter(it => !(it && it.id && editingTask.id && it.id === editingTask.id));
        localStorage.setItem(oldK, JSON.stringify(filteredOld));
      }

      // add to new date key
      const newK = keyForDate(dateKey);
      const existingNew = JSON.parse(localStorage.getItem(newK) || '[]');
      const updatedTask = { ...editingTask, name, date, time };
      const updatedNew = [updatedTask, ...existingNew];
        const sortedUpdated = sortTasks(updatedNew);
        localStorage.setItem(newK, JSON.stringify(sortedUpdated));

      // if new date equals selectedDate, refresh visible list
      if (selectedDate && selectedDate.y === dateKey.y && selectedDate.m === dateKey.m && selectedDate.d === dateKey.d) {
          setTasks(sortedUpdated);
      } else if (selectedDate) {
        // if we removed from the currently selected date, refresh that list too
        const selK = keyForDate(selectedDate);
        const selList = JSON.parse(localStorage.getItem(selK) || '[]');
        setTasks(selList);
      }

      setEditingTask(null);
      setAdding(false);
      return;
    }

    // create new task
    const k = keyForDate(dateKey);
    const existing = JSON.parse(localStorage.getItem(k) || '[]');
    const newTask = { id: Date.now(), name, date, time };
    const updated = [newTask, ...existing];
      const sorted = sortTasks(updated);
      localStorage.setItem(k, JSON.stringify(sorted));

    // If the modal date matches currently selectedDate, refresh the tasks list shown
    if (selectedDate && selectedDate.y === dateKey.y && selectedDate.m === dateKey.m && selectedDate.d === dateKey.d) {
        setTasks(sorted);
    }

    setAdding(false);
  };

  // remove by item (object or string) to avoid index-capture bugs with delayed deletes
  const removeTask = (item) => {
    if (!selectedDate) return;
    const k = keyForDate(selectedDate);
    const existing = JSON.parse(localStorage.getItem(k) || '[]');

    const matchIndex = existing.findIndex((it) => {
      // both legacy string tasks and new object tasks supported
      if (typeof item === 'string') return it === item;
      if (typeof it === 'string') return it === item.name; // best-effort
      // if objects, prefer id match
      if (it && it.id && item && item.id) return it.id === item.id;
      // fallback compare by name/date/time
      return it.name === item.name && it.date === item.date && it.time === item.time;
    });

    if (matchIndex === -1) return;

    const updated = existing.filter((_, i) => i !== matchIndex);
    const sorted = sortTasks(updated);
    localStorage.setItem(k, JSON.stringify(sorted));
    setTasks(sorted);
  };

  const onDateSelect = (date) => {
    setSelectedDate(date);
    const k = keyForDate(date);
    const existing = JSON.parse(localStorage.getItem(k) || '[]');
    setTasks(sortTasks(existing));
    setAdding(false);
  };

  return (
    <div className="calendario-contenedor">
      <div className='logo-inicio-contenedor'>
        <img className='logo' src={require('../imagenes/logoSoymas.png')} alt="Logo" />
      </div>
      <div className="datos-inicio-contenedor">
        <div className="foto-datos">
          <div className="foto-inicial">{userName && userName.charAt(0).toUpperCase()}</div>
        </div>
        <div className="texto-datos">
          <div className="saludo">¡Hola {userName}!</div>
          <div className="email">{userEmail}</div>
        </div>
        <div className="exit-datos">
          <button className="exit-button" onClick={() => { logout && logout(); navigate('/login'); }} aria-label="Cerrar sesión">
            <FontAwesomeIcon icon={faRightFromBracket} />
          </button>
        </div>
      </div>
      <div className="calendario calendario-inicio">
          <CalendarioMes onDateSelect={onDateSelect} selectedDate={selectedDate} />
      </div>
      
      <div className="tareas-contenedor-contenedor">
        <div className="titulo-tareas">TAREAS</div>
        <div className="tareas-contenedor">
          {selectedDate ? (
            tasks.map((t, i) => {
              const desc = typeof t === 'string' ? t : `${t.name}${t.time ? ' — ' + t.time : ''}`;
              return <Tarea key={t && t.id ? t.id : i} Descripción={desc} onDelete={() => removeTask(t)} onEdit={() => { setEditingTask(t); setAdding(true); }} />
            })
          ) : (
            <div className="no-selected">Selecciona un día para ver tus tareas</div>
          )}
        </div>
        <div className="tareas-agrega">
          <button className="agrega-button" onClick={() => { setEditingTask(null); setAdding(true); }}>
            <FontAwesomeIcon icon={faPlus} />
          </button>
          <AddTaskModal visible={adding} onClose={() => { setAdding(false); setEditingTask(null); }} onSubmit={handleModalSubmit} defaultDate={selectedDate} initialTask={editingTask} />
        </div>
      </div>
      <div className="navegacion-contenedor">
        <button className="nav-card" onClick={() => navigate('/asistencia')} aria-label="Asistencia">
          <FontAwesomeIcon icon={faHandFist} />
          <span className="texto-nav-card">Asistencia</span>
        </button>
        <button className="nav-card" onClick={() => navigate('/compromisos')} aria-label="Compromisos">
          <FontAwesomeIcon icon={faCircleCheck} />
          <span className="texto-nav-card">Compromisos</span>
        </button>
        <button className="nav-card" onClick={() => navigate('/informacion')} aria-label="Información">
          <FontAwesomeIcon icon={faCircleInfo} />
          <span className="texto-nav-card">Informacion</span>
        </button>
      </div>
    </div>
  );
}

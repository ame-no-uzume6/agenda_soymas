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
  const [tasksRefreshKey, setTasksRefreshKey] = useState(0); // trigger to refresh CalendarioMes

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
  const handleModalSubmit = async ({ name, date, time }) => {
    // date is YYYY-MM-DD
    const [yStr, mStr, dStr] = date.split('-');
    const dateKey = { y: parseInt(yStr, 10), m: parseInt(mStr, 10) - 1, d: parseInt(dStr, 10) };
    // If editingTask is set, update existing task (may move between dates). Otherwise create new.
    if (editingTask) {
      // update existing task via API or, if date changed, recreate on new date
      const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
      const userEmail = currentUser && currentUser.email ? currentUser.email : '';
      // build FechaHora string (use space separator to avoid timezone auto-conversion)
      const fechaHora = time ? `${date} ${time}:00` : null;

      // If date changed (editingTask.date exists and differs), delete old and create new
      if (editingTask.date && editingTask.date !== date) {
        try {
          if (editingTask.id && userEmail) {
            await fetch(`${serverUrl}/api/tasks/${editingTask.id}`, { method: 'DELETE' });
          }
          // create new
          if (userEmail) {
            const res = await fetch(`${serverUrl}/api/tasks`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: userEmail, FechaHora: fechaHora, Descripcion: name })
            });
            const data = await res.json();
            // refresh list for selectedDate if it matches new date
            if (selectedDate && selectedDate.y === dateKey.y && selectedDate.m === dateKey.m && selectedDate.d === dateKey.d) {
              const listRes = await fetch(`${serverUrl}/api/tasks?email=${encodeURIComponent(userEmail)}&date=${date}`);
              const json = await listRes.json();
              if (json.ok) setTasks(sortTasks(json.rows.map(r => ({ id: r.IdTarea, name: r.Descripcion, date: r.FechaRegistro || (r.FechaHora? String(r.FechaHora).split(/T| /)[0] : date), time: r.FechaHora ? (String(r.FechaHora).split(/T| /)[1] || '').slice(0,5) : '' }))));
            }
          }
        } catch (e) {
          console.error('update task (move) failed', e);
        }
      } else {
        // same date — update in place
        try {
          if (editingTask.id && userEmail) {
            await fetch(`${serverUrl}/api/tasks/${editingTask.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ FechaHora: time ? `${date} ${time}:00` : null, Descripcion: name })
            });
            // refresh list
            if (selectedDate) {
              const d = `${selectedDate.y}-${String(selectedDate.m+1).padStart(2,'0')}-${String(selectedDate.d).padStart(2,'0')}`;
              const listRes = await fetch(`${serverUrl}/api/tasks?email=${encodeURIComponent(userEmail)}&date=${d}`);
              const json = await listRes.json();
              if (json.ok) setTasks(sortTasks(json.rows.map(r => ({ id: r.IdTarea, name: r.Descripcion, date: r.FechaRegistro || (r.FechaHora? String(r.FechaHora).split(/T| /)[0] : d), time: r.FechaHora ? (String(r.FechaHora).split(/T| /)[1] || '').slice(0,5) : '' }))));
            }
          }
        } catch (e) {
          console.error('update task failed', e);
        }
      }

      setEditingTask(null);
      setAdding(false);
      // Trigger CalendarioMes to refresh task indicators
      setTasksRefreshKey(prev => prev + 1);
      return;
    }

    // create new task
    // create new task via API
    const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
    const userEmail = currentUser && currentUser.email ? currentUser.email : '';
    const fechaHora = time ? `${date}T${time}:00` : null;
    try {
      if (userEmail) {
        const res = await fetch(`${serverUrl}/api/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail, FechaHora: fechaHora, Descripcion: name })
        });
        const data = await res.json();
      }
      // refresh visible list if needed
      if (selectedDate && selectedDate.y === dateKey.y && selectedDate.m === dateKey.m && selectedDate.d === dateKey.d) {
        const d = `${dateKey.y}-${String(dateKey.m+1).padStart(2,'0')}-${String(dateKey.d).padStart(2,'0')}`;
        if (userEmail) {
          const listRes = await fetch(`${serverUrl}/api/tasks?email=${encodeURIComponent(userEmail)}&date=${d}`);
          const json = await listRes.json();
          if (json.ok) setTasks(sortTasks(json.rows.map(r => ({ id: r.IdTarea, name: r.Descripcion, date: r.FechaRegistro || (r.FechaHora? String(r.FechaHora).split(/T| /)[0] : d), time: r.FechaHora ? (String(r.FechaHora).split(/T| /)[1] || '').slice(0,5) : '' }))));
        }
      }
      // Trigger CalendarioMes to refresh task indicators
      setTasksRefreshKey(prev => prev + 1);
    } catch (e) {
      console.error('create task failed', e);
    }

    setAdding(false);
  };

  // remove by item (object or string) to avoid index-capture bugs with delayed deletes
  const removeTask = (item) => {
    if (!selectedDate) return;
    const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
    const userEmail = currentUser && currentUser.email ? currentUser.email : '';
    // if item has id and we have user on server, delete remotely
    (async () => {
      try {
        if (item && item.id && userEmail) {
          await fetch(`${serverUrl}/api/tasks/${item.id}`, { method: 'DELETE' });
        }
        // refresh list for selectedDate
        const d = `${selectedDate.y}-${String(selectedDate.m+1).padStart(2,'0')}-${String(selectedDate.d).padStart(2,'0')}`;
        if (userEmail) {
          const listRes = await fetch(`${serverUrl}/api/tasks?email=${encodeURIComponent(userEmail)}&date=${d}`);
          const json = await listRes.json();
          if (json.ok) setTasks(sortTasks(json.rows.map(r => ({ id: r.IdTarea, name: r.Descripcion, date: r.FechaRegistro || (r.FechaHora? String(r.FechaHora).split(/T| /)[0] : d), time: r.FechaHora ? (String(r.FechaHora).split(/T| /)[1] || '').slice(0,5) : '' }))));
        }
        // Trigger CalendarioMes to refresh task indicators
        setTasksRefreshKey(prev => prev + 1);
      } catch (e) {
        console.error('delete task failed', e);
      }
    })();
  };

  const onDateSelect = (date) => {
    setSelectedDate(date);
    // fetch tasks for this date from server
    const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
    const userEmail = currentUser && currentUser.email ? currentUser.email : '';
    const d = `${date.y}-${String(date.m+1).padStart(2,'0')}-${String(date.d).padStart(2,'0')}`;
    (async () => {
      try {
        if (userEmail) {
          const res = await fetch(`${serverUrl}/api/tasks?email=${encodeURIComponent(userEmail)}&date=${d}`);
          const json = await res.json();
          if (json.ok) {
            const mapped = json.rows.map(r => ({ id: r.IdTarea, name: r.Descripcion, date: r.FechaRegistro || (r.FechaHora? String(r.FechaHora).split(/T| /)[0] : d), time: r.FechaHora ? (String(r.FechaHora).split(/T| /)[1] || '').slice(0,5) : '' }));
            setTasks(sortTasks(mapped));
            return;
          }
        }
        // fallback: no user or server failed -> empty
        setTasks([]);
      } catch (e) {
        console.error('fetch tasks failed', e);
        setTasks([]);
      }
    })();
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
          <CalendarioMes key={tasksRefreshKey} onDateSelect={onDateSelect} selectedDate={selectedDate} />
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

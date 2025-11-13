import '../hojas-estilo/Compromisos.css';
import BackCircle from '../componentes/BackCircle';
import Compromiso from '../componentes/Compromiso';
import CompromisosModal from '../componentes/CompromisosModal';
import { faDumbbell, faBed, faAppleAlt, faBrain, faSpa, faUsers } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Chart as ChartJS, ArcElement } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement);

export default function Compromisos() {
  // default definitions
  const defaultItems = [
    { tipo: 'DEPORTE', descripcion: 'Yoga 30 min', icon: faDumbbell },
    { tipo: 'SUEÑO', descripcion: '8 horas', icon: faBed },
    { tipo: 'NUTRICIÓN', descripcion: 'Comida equilibrada', icon: faAppleAlt },
    { tipo: 'SALUD MENTAL', descripcion: 'Terapia breve', icon: faBrain },
    { tipo: 'MINDFULNESS', descripcion: 'Meditación 10 min', icon: faSpa },
    { tipo: 'RELACIONES', descripcion: 'Contactar a un amigo', icon: faUsers }
  ];

  const [showModal, setShowModal] = useState(false);
  const [items, setItems] = useState([]); // will contain {tipo, descripcion, icon, target}
  const [achieved, setAchieved] = useState([]); // array of achieved counts per item
  const { updateCurrentUserData, currentUser } = useAuth();
  const [checksByTipo, setChecksByTipo] = useState({});

  // compute monday key
  const getMondayKey = (d = new Date()) => {
    const date = new Date(d);
    const day = date.getDay();
    // get difference to Monday (Monday=1). If Sunday (0), go back 6 days
    const diff = (day === 0) ? -6 : (1 - day);
    const monday = new Date(date.setDate(date.getDate() + diff));
    const y = monday.getFullYear();
    const m = String(monday.getMonth() + 1).padStart(2, '0');
    const dayd = String(monday.getDate()).padStart(2, '0');
    return `compromisos-week-${y}-${m}-${dayd}`;
  };

  useEffect(()=>{
    const key = getMondayKey();
    const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
    const weekStart = key.split('-').slice(-3).join('-'); // last 3 parts are y,m,d
    const email = (typeof updateCurrentUserData === 'function' && currentUser && currentUser.email) ? currentUser.email : (currentUser && currentUser.email ? currentUser.email : null);
    // try to load weekly config from server first, fallback to localStorage
    (async ()=>{
      try{
        if (email) {
          const res = await fetch(`${serverUrl}/api/compromisos?email=${encodeURIComponent(email)}&weekStart=${weekStart}`);
          const json = await res.json();
          if (json.ok && Array.isArray(json.rows) && json.rows.length > 0) {
            // map rows to config items: Factor=tipo, Descripcion=descripcion, DiasCantidad=target
            const cfg = json.rows.map(r => ({ tipo: r.Factor, descripcion: r.Descripcion, target: r.DiasCantidad }));
            const merged = defaultItems.map(di => {
              const found = cfg.find(c=>c.tipo===di.tipo);
              return { ...di, descripcion: found ? found.descripcion : di.descripcion, target: found ? found.target : 0 };
            });
            setItems(merged);
            setAchieved(new Array(merged.length).fill(0));
            setShowModal(false);
            // load checks from localStorage as fallback (server doesn't store per-type checks yet)
            const keyChecks = key + '-checks';
            const storedChecks = JSON.parse(localStorage.getItem(keyChecks) || '{}');
            setChecksByTipo(storedChecks || {});
            return;
          }
        }
      }catch(e){
        console.warn('failed to load compsemanal from server', e);
      }

      // fallback to localStorage
      const stored = localStorage.getItem(key);
      if(stored){
        try{
          const cfg = JSON.parse(stored);
          // merge with default items
          const merged = defaultItems.map(di => {
            const found = cfg.find(c=>c.tipo===di.tipo);
            return { ...di, target: found ? found.target : 0 };
          });
          setItems(merged);
          setAchieved(new Array(merged.length).fill(0));
          setShowModal(false);
          // load saved checks for this week if any
          const keyChecks = key + '-checks';
          const storedChecks = JSON.parse(localStorage.getItem(keyChecks) || '{}');
          setChecksByTipo(storedChecks || {});
        }catch(e){
          console.error('failed parse compromisos config', e);
          setShowModal(true);
          // set defaults with zero targets
          const merged = defaultItems.map(di => ({ ...di, target: 0 }));
          setItems(merged);
          setAchieved(new Array(merged.length).fill(0));
        }
      }else{
        // open modal to define weekly targets
        setShowModal(true);
        const merged = defaultItems.map(di => ({ ...di, target: 0 }));
        setItems(merged);
        setAchieved(new Array(merged.length).fill(0));
        setChecksByTipo({});
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveWeeklyConfig = (cfgItems) => {
    // cfgItems is array {tipo, descripcion, target}
    // validate before saving: descripcion not empty and target between 1 and 7
    const invalid = cfgItems.some(it => !it.descripcion || String(it.descripcion).trim() === '' || !Number.isFinite(Number(it.target)) || Number(it.target) < 1 || Number(it.target) > 7);
    if (invalid) {
      // keep modal open and notify user
      window.alert('Por favor completa la descripción y establece entre 1 y 7 días para cada compromiso.');
      setShowModal(true);
      return;
    }

    const key = getMondayKey();
    // normalize targets to numbers >=1
    const normalized = cfgItems.map(it => ({ ...it, target: Math.max(1, Number(it.target || 1)), descripcion: String(it.descripcion || '').trim() }));
    localStorage.setItem(key, JSON.stringify(normalized));
    // also persist to server compsemanal table if user available
    const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
    const email = (typeof updateCurrentUserData === 'function' && currentUser && currentUser.email) ? currentUser.email : (currentUser && currentUser.email ? currentUser.email : null);
    if (email) {
      (async ()=>{
        try{
          const weekStart = key.split('-').slice(-3).join('-');
          // post each item as a row: tipo→Factor, descripcion→Descripcion, target→DiasCantidad
          for (const it of normalized) {
            await fetch(`${serverUrl}/api/compromisos`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, Factor: it.tipo, Descripcion: it.descripcion, DiasCantidad: it.target, Regis_Fecha: weekStart })
            });
          }
        }catch(e){
          console.warn('failed to save weekly config to server', e);
        }
      })();
    }
    // persist to current user's profile (in-memory)
    if (typeof updateCurrentUserData === 'function') {
      updateCurrentUserData(prev => ({
        ...prev,
        compromisos: {
          ...(prev && prev.compromisos ? prev.compromisos : {}),
          [key]: cfgItems
        }
      }));
    }
    // update items state merging with descriptors
    const merged = defaultItems.map(di => {
      const found = normalized.find(c=>c.tipo===di.tipo);
      return { ...di, descripcion: found ? found.descripcion : di.descripcion, target: found ? found.target : 1 };
    });
    setItems(merged);
    setAchieved(new Array(merged.length).fill(0));
    setShowModal(false);
  };

  const handleAchievedChange = (index, value) => {
    setAchieved(prev => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const handleChecksChange = (tipo, checkedArray) => {
    const keyChecks = getMondayKey() + '-checks';
    try{
      const existing = JSON.parse(localStorage.getItem(keyChecks) || '{}');
      const next = { ...(existing || {}), [tipo]: checkedArray };
      localStorage.setItem(keyChecks, JSON.stringify(next));
      setChecksByTipo(next);
      // also persist into user's profile (in-memory)
      if (typeof updateCurrentUserData === 'function') {
        updateCurrentUserData(prev => ({
          ...prev,
          compromisosChecks: {
            ...(prev && prev.compromisosChecks ? prev.compromisosChecks : {}),
            [keyChecks]: {
              ...(prev && prev.compromisosChecks && prev.compromisosChecks[keyChecks] ? prev.compromisosChecks[keyChecks] : {}),
              [tipo]: checkedArray
            }
          }
        }));
      }
    }catch(e){
      console.error('save compromisos checks failed', e);
    }
  };

  // compute totals with per-commitment capping: each commitment cannot contribute
  // more than its weekly target when calculating progress
  const totalTarget = items.reduce((s, it) => s + (it.target || 0), 0);
  const cappedAchieved = achieved.map((v, i) => {
    const val = v || 0;
    const target = (items[i] && items[i].target) ? items[i].target : 0;
    return Math.min(val, target);
  });
  const totalAchieved = cappedAchieved.reduce((s, v) => s + v, 0);

  // percent guard (clamp to 100)
  const percent = totalTarget > 0 ? Math.min(100, Math.round((totalAchieved / totalTarget) * 100)) : 0;

  return (
    <div className="compromisos-contenedor">
  <CompromisosModal visible={showModal} onClose={() => setShowModal(false)} onSubmit={saveWeeklyConfig} defaultConfig={items.map(i=>({ tipo:i.tipo, descripcion:i.descripcion, target:i.target }))} />
      <div className="nav-contenedor">
        <BackCircle bcolor = '#fff' color='#a52488'/>
        <h1 className="titulo-compromisos">MI COMPROMISO SEMANAL</h1>
      </div>

      <div className="registro-compromisos-contenedor">
        {items.map((it, idx) => (
          <Compromiso key={it.tipo} tipo={it.tipo} descripcion={it.descripcion} icon={it.icon} initialChecks={checksByTipo[it.tipo] || null} target={it.target} onAchievedChange={(count) => handleAchievedChange(idx, count)} onChecksChange={(arr) => handleChecksChange(it.tipo, arr)} />
        ))}
      </div>

      <div className='resumen-compromisos-contenedor'>
        <div className='resumen-compromisos'>
          <div className='resumen-compromisos-texto'>
            PROGRESO SEMANAL
          </div>
          <div className='resumen-compromisos-grafico'>
            <Doughnut 
              data={{
                datasets: [{
                  data: [totalAchieved, Math.max(0, totalTarget - totalAchieved)],
                  backgroundColor: ['#d581a1', '#EAD5EA'],
                  borderWidth: 0,
                  cutout: '60%'
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  tooltip: { enabled: false }
                }
              }}
            />
            <div className="porcentaje-texto">
              {percent}%
            </div>
          </div>
        </div>
        <div className="resumen-compromisos-frase">¡Vas genial, sigue así!</div>
      </div>
    </div>
  );
}

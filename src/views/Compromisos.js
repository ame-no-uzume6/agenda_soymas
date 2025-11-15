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
    { tipo: 'DEPORTE', descripcion: '', icon: faDumbbell },
    { tipo: 'SUEÑO', descripcion: '', icon: faBed },
    { tipo: 'NUTRICIÓN', descripcion: '', icon: faAppleAlt },
    { tipo: 'SALUD MENTAL', descripcion: '', icon: faBrain },
    { tipo: 'MINDFULNESS', descripcion: '', icon: faSpa },
    { tipo: 'RELACIONES', descripcion: '', icon: faUsers }
  ];

  const [showModal, setShowModal] = useState(false);
  const [items, setItems] = useState([]); // will contain {tipo, descripcion, icon, target}
  const [achieved, setAchieved] = useState([]); // array of achieved counts per item
  const { updateCurrentUserData, currentUser } = useAuth();
  const [checksByTipo, setChecksByTipo] = useState({});

  // compute monday date string (YYYY-MM-DD)
  const getMondayKey = (d = new Date()) => {
    const date = new Date(d);
    const day = date.getDay();
    // get difference to Monday (Monday=1). If Sunday (0), go back 6 days
    const diff = (day === 0) ? -6 : (1 - day);
    const monday = new Date(date.setDate(date.getDate() + diff));
    const y = monday.getFullYear();
    const m = String(monday.getMonth() + 1).padStart(2, '0');
    const dayd = String(monday.getDate()).padStart(2, '0');
    return `${y}-${m}-${dayd}`;
  };

  // Función para cargar datos desde el servidor
  const loadDataFromServer = async () => {
    const weekStart = getMondayKey();
    const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
    const email = (typeof updateCurrentUserData === 'function' && currentUser && currentUser.email) ? currentUser.email : (currentUser && currentUser.email ? currentUser.email : null);

    if (!email) {
      // Sin usuario, mostrar modal para definir compromisos
      setShowModal(true);
      const merged = defaultItems.map(di => ({ ...di, target: 0 }));
      setItems(merged);
      setAchieved(new Array(merged.length).fill(0));
      setChecksByTipo({});
      return;
    }

    try{
      const res = await fetch(`${serverUrl}/api/compromisos?email=${encodeURIComponent(email)}&weekStart=${weekStart}`);
      const json = await res.json();

      if (json.ok && Array.isArray(json.rows) && json.rows.length > 0) {
        // map rows to config items: Factor=tipo, Descripcion=descripcion, DiasCantidad=target, IdCompromiso
        const cfg = json.rows.map(r => ({ tipo: r.Factor, descripcion: r.Descripcion, target: r.DiasCantidad, idCompromiso: r.IdCompromiso }));
        const merged = defaultItems.map(di => {
          const found = cfg.find(c=>c.tipo===di.tipo);
          return { ...di, descripcion: found ? found.descripcion : di.descripcion, target: found ? found.target : 0, idCompromiso: found ? found.idCompromiso : null };
        });
        setItems(merged);
        setAchieved(new Array(merged.length).fill(0));
        setShowModal(false);

        // Cargar checks desde la BBDD
        try {
          const checksRes = await fetch(`${serverUrl}/api/registroCompromiso?email=${encodeURIComponent(email)}&weekStart=${weekStart}`);
          const checksJson = await checksRes.json();
          console.log('Checks cargados desde BBDD:', checksJson.checks);
          if (checksJson.ok && checksJson.checks) {
            setChecksByTipo(checksJson.checks);
          } else {
            setChecksByTipo({});
          }
        } catch(e) {
          console.warn('failed to load checks from server', e);
          setChecksByTipo({});
        }
      } else {
        // No hay compromisos para esta semana, mostrar modal
        setShowModal(true);
        const merged = defaultItems.map(di => ({ ...di, target: 0 }));
        setItems(merged);
        setAchieved(new Array(merged.length).fill(0));
        setChecksByTipo({});
      }
    }catch(e){
      console.warn('failed to load compsemanal from server', e);
      // En caso de error, mostrar modal
      setShowModal(true);
      const merged = defaultItems.map(di => ({ ...di, target: 0 }));
      setItems(merged);
      setAchieved(new Array(merged.length).fill(0));
      setChecksByTipo({});
    }
  };

  useEffect(()=>{
    loadDataFromServer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const saveWeeklyConfig = async (cfgItems) => {
    // cfgItems is array {tipo, descripcion, target}
    // validate before saving: descripcion not empty and target between 1 and 7
    const invalid = cfgItems.some(it => !it.descripcion || String(it.descripcion).trim() === '' || !Number.isFinite(Number(it.target)) || Number(it.target) < 1 || Number(it.target) > 7);
    if (invalid) {
      // keep modal open and notify user
      window.alert('Por favor completa la descripción y establece entre 1 y 7 días para cada compromiso.');
      setShowModal(true);
      return;
    }

    const weekStart = getMondayKey();
    const normalized = cfgItems.map(it => ({ ...it, target: Math.max(1, Number(it.target || 1)), descripcion: String(it.descripcion || '').trim() }));
    const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
    const email = (typeof updateCurrentUserData === 'function' && currentUser && currentUser.email) ? currentUser.email : (currentUser && currentUser.email ? currentUser.email : null);

    if (!email) {
      window.alert('Error: Usuario no autenticado');
      return;
    }

    try{
      // Guardar cada compromiso en el servidor
      for (const it of normalized) {
        await fetch(`${serverUrl}/api/compromisos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, Factor: it.tipo, Descripcion: it.descripcion, DiasCantidad: it.target, Regis_Fecha: weekStart })
        });
      }

      // Recargar datos desde el servidor para obtener los IdCompromiso
      await loadDataFromServer();
    }catch(e){
      console.error('failed to save weekly config to server', e);
      window.alert('Error al guardar compromisos. Por favor intenta de nuevo.');
    }
  };

  const handleAchievedChange = (index, value) => {
    setAchieved(prev => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const handleChecksChange = async (tipo, checkedArray, idCompromiso) => {
    try{
      // Actualizar estado local inmediatamente para UI responsiva
      const next = { ...(checksByTipo || {}), [tipo]: checkedArray };
      setChecksByTipo(next);

      // Guardar en la BBDD
      const email = (typeof updateCurrentUserData === 'function' && currentUser && currentUser.email) ? currentUser.email : (currentUser && currentUser.email ? currentUser.email : null);
      const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';

      if (email && idCompromiso) {
        try {
          await fetch(`${serverUrl}/api/registroCompromiso`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              idCompromiso,
              checks: checkedArray
            })
          });
          console.log(`Checks guardados en BBDD para compromiso ${idCompromiso}`);
        } catch(e) {
          console.warn('Failed to save checks to server:', e);
          // Revertir cambio local en caso de error
          setChecksByTipo(checksByTipo);
        }
      }
    }catch(e){
      console.error('save compromisos checks failed', e);
    }
  };

  // compute totals with per-commitment capping: each commitment cannot contribute
  // more than its weekly target when calculating progress
  const totalTarget = items.reduce((s, it) => s + (Number(it.target) || 0), 0);
  const cappedAchieved = achieved.map((v, i) => {
    const val = v || 0;
    const target = (items[i] && items[i].target) ? Number(items[i].target) : 0;
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
          <Compromiso key={it.tipo} tipo={it.tipo} descripcion={it.descripcion} icon={it.icon} initialChecks={checksByTipo[it.tipo] || null} target={it.target} onAchievedChange={(count) => handleAchievedChange(idx, count)} onChecksChange={(arr) => handleChecksChange(it.tipo, arr, it.idCompromiso)} />
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

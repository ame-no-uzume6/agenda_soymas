import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../hojas-estilo/Calendario.css';

function pad(n){return n<10? '0'+n: ''+n}

function keyForDate(y,m,d){
  return `tasks-${y}-${pad(m+1)}-${pad(d)}`;
}

export default function CalendarioMes({ onDateSelect, selectedDate }){
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const { currentUser } = useAuth();
  const [datesWithTasks, setDatesWithTasks] = useState(new Set());

  useEffect(()=>{
    // fetch all tasks for user and mark dates that have tasks
    const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
    const email = currentUser && currentUser.email ? currentUser.email : '';
    console.log('[CalendarioMes] Loading tasks for email:', email, 'month:', year, '-', month);
    if (!email) {
      setDatesWithTasks(new Set());
      return;
    }
    (async ()=>{
      try {
        const res = await fetch(`${serverUrl}/api/tasks?email=${encodeURIComponent(email)}`);
        const json = await res.json();
        console.log('[CalendarioMes] API response:', json);
        if (!json.ok) { 
          console.warn('[CalendarioMes] API error:', json.message);
          setDatesWithTasks(new Set()); 
          return; 
        }
        const setDates = new Set();
        for (const r of json.rows) {
          let date = r.FechaRegistro || (r.FechaHora ? r.FechaHora.split('T')[0] : null);
          // Ensure we only have YYYY-MM-DD format (remove timestamp if present)
          if (date && date.includes('T')) {
            date = date.split('T')[0];
          }
          console.log('[CalendarioMes] Task found:', date);
          if (!date) continue;
          // only keep those in current month/year
          const [y,m,d] = date.split('-').map(s => parseInt(s,10));
          console.log('[CalendarioMes] Parsed date:', {y, m, d}, 'current:', {year, month: month+1});
          if (y === year && (m-1) === month) {
            setDates.add(date);
            console.log('[CalendarioMes] Added to set:', date);
          }
        }
        console.log('[CalendarioMes] Final dates set:', Array.from(setDates));
        setDatesWithTasks(setDates);
      } catch (e) {
        console.error('fetch tasks for calendar failed', e);
        setDatesWithTasks(new Set());
      }
    })();
  }, [currentUser, year, month]);

  const goToPreviousMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const monthName = new Intl.DateTimeFormat('es-ES',{ month: 'long', year: 'numeric' }).format(new Date(year, month));

  const first = new Date(year, month, 1);
  const lastDay = new Date(year, month+1, 0).getDate();
  const firstIndex = (first.getDay() + 6) % 7; // Monday=0

  const cells = [];
  for(let i=0;i<firstIndex;i++) cells.push(null);
  for(let d=1; d<= lastDay; d++) cells.push(d);

  const openDay = (d)=>{
    onDateSelect && onDateSelect({ y: year, m: month, d });
  };

  return (
    <div className="calendario-mes">
      <div className="calendario-header">
        <button className="mes-nav-btn" onClick={goToPreviousMonth}>&#8249;</button>
        <span className="mes-titulo">{monthName.toUpperCase()}</span>
        <button className="mes-nav-btn" onClick={goToNextMonth}>&#8250;</button>
      </div>
      <div className="calendario-weekdays">
        {['L','M','M','J','V','S','D'].map((w, idx)=> <div key={`weekday-${idx}`} className="weekday">{w}</div>)}
      </div>
      <div className="calendario-grid">
        {cells.map((d, idx)=>{
          const isToday = d && year===today.getFullYear() && month===today.getMonth() && d===today.getDate();
          const dateKey = d ? `${year}-${pad(month+1)}-${pad(d)}` : null;
          const hasTasks = dateKey && datesWithTasks && datesWithTasks.has(dateKey);
          if (d && hasTasks) console.log('[CalendarioMes] Day', d, 'has tasks, dateKey:', dateKey, 'set:', Array.from(datesWithTasks));
          const isSelected = selectedDate && d === selectedDate.d && month === selectedDate.m && year === selectedDate.y;
          return (
            <div key={idx} className={`cal-cell ${d? '' : 'empty'}`} onClick={() => d && openDay(d)}>
              {d && (
                <div className={`day-circle ${isToday? 'today':''} ${isSelected ? 'selected' : ''}`}>
                  <span className="day-number">{d}</span>
                  {hasTasks && <div className="tasks-indicator" />}
                </div>
              )}
            </div>
          )
        })}
      </div>

    </div>
  )
}

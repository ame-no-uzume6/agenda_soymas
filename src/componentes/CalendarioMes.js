import { useState } from 'react';
import '../hojas-estilo/Calendario.css';

function pad(n){return n<10? '0'+n: ''+n}

function keyForDate(y,m,d){
  return `tasks-${y}-${pad(m+1)}-${pad(d)}`;
}

export default function CalendarioMes({ onDateSelect, selectedDate }){
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

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
        {['L','M','M','J','V','S','D'].map(w=> <div key={w} className="weekday">{w}</div>)}
      </div>
      <div className="calendario-grid">
        {cells.map((d, idx)=>{
          const isToday = d && year===today.getFullYear() && month===today.getMonth() && d===today.getDate();
          const dateKey = d ? keyForDate(year, month, d) : null;
          const hasTasks = dateKey && localStorage.getItem(dateKey) && JSON.parse(localStorage.getItem(dateKey)).length>0;
          const isSelected = selectedDate && d === selectedDate.d && month === selectedDate.m && year === selectedDate.y;
          return (
            <div key={idx} className={`cal-cell ${d? '' : 'empty'}`} onClick={() => d && openDay(d)}>
              {d && (
                <div className={`day-circle ${isToday? 'today':''} ${isSelected ? 'selected' : ''}`}>
                  <span className="day-number">{d}</span>
                </div>
              )}
              {hasTasks && <div className="tasks-indicator" />}
            </div>
          )
        })}
      </div>

    </div>
  )
}

import '../hojas-estilo/Asistencia.css';
import BackCircle from '../componentes/BackCircle';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip);


const IconCheck = <FontAwesomeIcon icon={faCheck} style={{ color: '#ffffff' }} />;

export default function Asistencia() {
  const [checkedDays, setCheckedDays] = useState([false, false, false, false, false]);
  const [daysAttended, setDaysAttended] = useState(0);
  const [daysAbsent, setDaysAbsent] = useState(0);
  const [walletAmount, setWalletAmount] = useState(0);
  const [monthlyStats, setMonthlyStats] = useState({ attended: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  const prevCheckedRef = useRef(checkedDays);

  const arraysEqual = (a, b) => {
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  };

  // Get semester week number (counting from July 7th)
  const getWeekNumber = (d = new Date()) => {
    // semester started July 7th 2025
    const semesterStart = new Date(2025, 6, 7); // months are 0-based
    const current = new Date(d);
    // get days since semester start (86400000 ms per day)
    const daysSinceSemesterStart = Math.floor((current - semesterStart) / 86400000);
    // add 1 because we want weeks to start at 1, not 0
    return Math.max(1, Math.ceil(daysSinceSemesterStart / 7));
  };

  // Get week's date range string
  const getWeekRange = (d = new Date()) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = (day === 0) ? -6 : (1 - day); // Adjust to get to Monday
    const monday = new Date(date);
    monday.setDate(date.getDate() + diff);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    // If Monday and Friday are in the same month
    if (monday.getMonth() === friday.getMonth()) {
      return `${monday.getDate()}-${friday.getDate()} ${months[monday.getMonth()]} ${monday.getFullYear()}`;
    }
    // If they span different months
    return `${monday.getDate()} ${months[monday.getMonth()]}-${friday.getDate()} ${months[friday.getMonth()]} ${monday.getFullYear()}`;
  };

  const getMondayKey = (d = new Date()) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = (day === 0) ? -6 : (1 - day);
    const monday = new Date(date.setDate(date.getDate() + diff));
    const y = monday.getFullYear();
    const m = String(monday.getMonth() + 1).padStart(2, '0');
    const dayd = String(monday.getDate()).padStart(2, '0');
    return {
      weekKey: `asistencia-week-${y}-${m}-${dayd}`,
      monthKey: `asistencia-month-${y}-${m}`
    };
  };

  const handleCheck = (index) => {
    const newCheckedDays = [...checkedDays];
    newCheckedDays[index] = !newCheckedDays[index];
    setCheckedDays(newCheckedDays);
  };

  const calculateWalletAmount = (percentage) => {
    // ranges: 60-69% → $10k, 70-79% → $15k, 80-89% → $20k, 90-100% → $25k
    if (percentage >= 90) return 25000;
    if (percentage >= 80) return 20000;
    if (percentage >= 70) return 15000;
    if (percentage >= 60) return 10000;
    return 0;
  };

  useEffect(() => {
    // On mount: load asistencia data for current week from /api/asistenciaRange
    if (!currentUser || !currentUser.email) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
    const email = currentUser.email;
    
    // Get current week's Monday and Friday dates
    const now = new Date();
    const day = now.getDay();
    const diff = (day === 0) ? -6 : (1 - day);
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    
    const startStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
    const endStr = `${friday.getFullYear()}-${String(friday.getMonth() + 1).padStart(2, '0')}-${String(friday.getDate()).padStart(2, '0')}`;
    
    (async () => {
      try {
        // Fetch week's asistencia records
        const res = await fetch(`${serverUrl}/api/asistenciaRange?email=${encodeURIComponent(email)}&start=${startStr}&end=${endStr}`);
        const json = await res.json();
        
        if (json.ok && Array.isArray(json.rows)) {
          // Build checked array from DB records (1 = checked, 0 = not checked)
          const weekChecks = [false, false, false, false, false];
          for (const row of json.rows) {
            const date = new Date(row.Fecha_Regis);
            const dayIndex = date.getDay() === 0 ? 4 : (date.getDay() - 1); // Mon=0..Fri=4
            if (dayIndex >= 0 && dayIndex < 5) {
              weekChecks[dayIndex] = row.Asistencia === 1;
            }
          }
          setCheckedDays(weekChecks);
          prevCheckedRef.current = weekChecks;
        }
        
        // Fetch month summary to compute stats
        const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const summaryRes = await fetch(`${serverUrl}/api/monthSummary?email=${encodeURIComponent(email)}&month=${monthStr}`);
        const summaryJson = await summaryRes.json();
        if (summaryJson.ok) {
          setMonthlyStats({ attended: summaryJson.attended, total: summaryJson.total });
        }
      } catch (e) {
        console.error('failed to load asistencia from server', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUser]);

  // Effect: when checkedDays changes, sync to server and update stats
  useEffect(() => {
    if (loading || !currentUser || !currentUser.email) return;
    
    // Check if checkedDays actually changed
    if (arraysEqual(prevCheckedRef.current, checkedDays)) return;
    
    prevCheckedRef.current = checkedDays;
    
    const attended = checkedDays.filter(day => day).length;
    const absent = checkedDays.length - attended;
    
    setDaysAttended(attended);
    setDaysAbsent(absent);
    
    // Sync to server
    const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
    const email = currentUser.email;
    
    // Build asistencia map for this week
    const now = new Date();
    const day = now.getDay();
    const diff = (day === 0) ? -6 : (1 - day);
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    
    const { weekKey } = getMondayKey(monday);
    const asistenciaMap = { [weekKey]: checkedDays };
    
    (async () => {
      try {
        await fetch(`${serverUrl}/api/syncAsistencia`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, asistencia: asistenciaMap })
        });
        
        // Refresh monthly stats
        const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const summaryRes = await fetch(`${serverUrl}/api/monthSummary?email=${encodeURIComponent(email)}&month=${monthStr}`);
        const summaryJson = await summaryRes.json();
        if (summaryJson.ok) {
          setMonthlyStats({ attended: summaryJson.attended, total: summaryJson.total });
        }
      } catch (e) {
        console.error('failed to sync asistencia', e);
      }
    })();
  }, [checkedDays, currentUser, loading]);

  // Effect: update wallet amount when monthly stats change
  useEffect(() => {
    const monthlyPercentage = monthlyStats.total > 0 ? (monthlyStats.attended / monthlyStats.total) * 100 : 0;
    setWalletAmount(calculateWalletAmount(monthlyPercentage));
  }, [monthlyStats]);

  const monthlyPercentage = monthlyStats.total > 0 ? (monthlyStats.attended / monthlyStats.total) * 100 : 0;
  const chartData = {
    datasets: [{
      data: [monthlyPercentage, 100 - monthlyPercentage],
      backgroundColor: ['#A52488', '#E8E8E8'],
      borderWidth: 0,
      cutout: '80%'
    }],
  };

  const chartOptions = {
    plugins: {
      tooltip: {
        enabled: false
      }
    },
    maintainAspectRatio: false,
  };
  return(
    <div className="asistencia-contenedor">
      <div className="nav-contenedor">
        <BackCircle/>
        <h1 className="titulo-asistencia">ASISTENCIA</h1>
      </div>
      <div className="contenedor">
        <div className="semana-contenedor">
          <div className="numero-semana">{getWeekNumber()}</div>
          <div>
            <div className="texto-semana">Semana</div>
            <div className="detalle-semana">{getWeekRange()}</div>
          </div>
        </div>

        <div>Asistencia de esta semana</div>
        <div className="registro-contenedor">
          {['L', 'M', 'M', 'J', 'V'].map((day, index) => (
            <div className="registro-item" key={index}>
              <div className="registro-dia">{day}</div>
              <div 
                className={`registro-check ${checkedDays[index] ? 'checked' : ''}`}
                onClick={() => handleCheck(index)}
              >
                {checkedDays[index] && IconCheck}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="contenedor resumen-contenedor">
        <div className='dias-asistidos'>
          <div className='numero'>{daysAttended} {daysAttended === 1 ? 'día' : 'días'}</div>
          <div>asistidos</div>
        </div>
        <div className='billetera-virtual'>
          <div className='numero'>${walletAmount.toLocaleString()}</div>
          <div>Billetera Virtual</div>
        </div>
        <div className='dias-ausentes'>
          <div className='numero'>{daysAbsent} {daysAbsent === 1 ? 'día' : 'días'}</div>
          <div>ausente</div>          
        </div>
      </div>

      <div className="contenedor grafico-contenedor">
        <div className="chart-wrapper">
          <Doughnut data={chartData} options={chartOptions} />
          <div className="percentage-text">
            {Math.round(monthlyPercentage)}%
          </div>
        </div>
        <div className="chart-label">Asistencia Mensual</div>
      </div>    
    </div>
  );
}

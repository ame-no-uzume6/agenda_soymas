import '../hojas-estilo/Asistencia.css';
import BackCircle from '../componentes/BackCircle';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip);


const IconCheck = <FontAwesomeIcon icon={faCheck} style={{ color: '#ffffff' }} />;

export default function Asistencia() {
  const [checkedDays, setCheckedDays] = useState([false, false, false, false, false]);
  const [attendancePercentage, setAttendancePercentage] = useState(0);
  const [daysAttended, setDaysAttended] = useState(0);
  const [daysAbsent, setDaysAbsent] = useState(0);
  const [walletAmount, setWalletAmount] = useState(0);
  const { updateCurrentUserData } = useAuth();

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
    return `asistencia-week-${y}-${m}-${dayd}`;
  };

  const handleCheck = (index) => {
    const newCheckedDays = [...checkedDays];
    newCheckedDays[index] = !newCheckedDays[index];
    setCheckedDays(newCheckedDays);
  };

  const calculateWalletAmount = (attendance) => {
    if (attendance === 5) return 20000;
    if (attendance === 4) return 10000;
    return 0;
  };

  useEffect(() => {
    const attended = checkedDays.filter(day => day).length;
    const absent = checkedDays.length - attended;
    const percentage = (attended / checkedDays.length) * 100;
    
    setDaysAttended(attended);
    setDaysAbsent(absent);
    setAttendancePercentage(percentage);
    
    // Calculate wallet amount based only on number of days attended
    setWalletAmount(calculateWalletAmount(attended));
    // persist attendance for the current user for this week
    try{
      const key = getMondayKey();
      if(typeof updateCurrentUserData === 'function'){
        updateCurrentUserData(prev => ({
          ...prev,
          asistencia: {
            ...(prev && prev.asistencia ? prev.asistencia : {}),
            [key]: checkedDays
          }
        }));
      }
    }catch(e){
      console.error('persist asistencia failed', e);
    }
  }, [checkedDays, updateCurrentUserData]);

  const chartData = {
    datasets: [{
      data: [attendancePercentage, 100 - attendancePercentage],
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
            {Math.round(attendancePercentage)}%
          </div>
        </div>
        <div className="chart-label">Asistencia</div>
      </div>    
    </div>
  );
}

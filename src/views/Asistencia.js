import '../hojas-estilo/Asistencia.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faCheck } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip);

const IconCalendar = <FontAwesomeIcon icon={faCalendarDays} style={{ color: '#A52488' }} />;
const IconCheck = <FontAwesomeIcon icon={faCheck} style={{ color: '#ffffff' }} />;

export default function Asistencia() {
  const [checkedDays, setCheckedDays] = useState([false, false, false, false, false]);
  const [attendancePercentage, setAttendancePercentage] = useState(0);
  const [daysAttended, setDaysAttended] = useState(0);
  const [daysAbsent, setDaysAbsent] = useState(0);
  const [walletAmount, setWalletAmount] = useState(0);

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
  }, [checkedDays]);

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
      <div className="contenedor titulo-asistencia-contenedor">
        <h1 className="titulo-asistencia">{IconCalendar}ASISTENCIA</h1>
      </div>
      <div className="contenedor">
        <div className="semana-contenedor">
          <div className="numero-semana">14</div>
          <div>
            <div className="texto-semana">Semana</div>
            <div className="detalle-semana">27-30 Noviembre 2025</div>
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

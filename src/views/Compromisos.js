import '../hojas-estilo/Compromisos.css';
import Compromiso from '../componentes/Compromiso';
import { faDumbbell, faBed, faAppleAlt, faBrain, faSpa, faUsers } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { Chart as ChartJS, ArcElement } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement);

export default function Compromisos() {
  const [totalChecks, setTotalChecks] = useState(0);
  return (
    <div className="compromisos-contenedor">
      <div className="titulo-compromisos-contenedor">
        <h1 className="titulo-compromisos">MI COMPROMISO SEMANAL</h1>
      </div>

      <div className="registro-compromisos-contenedor">
        <Compromiso tipo="DEPORTE" descripcion="Yoga 30 min" icon={faDumbbell} onChecksChange={(count) => setTotalChecks(prev => prev + count)} />
        <Compromiso tipo="SUEÑO" descripcion="8 horas" icon={faBed} onChecksChange={(count) => setTotalChecks(prev => prev + count)} />
        <Compromiso tipo="NUTRICIÓN" descripcion="Comida equilibrada" icon={faAppleAlt} onChecksChange={(count) => setTotalChecks(prev => prev + count)} />
        <Compromiso tipo="SALUD MENTAL" descripcion="Terapia breve" icon={faBrain} onChecksChange={(count) => setTotalChecks(prev => prev + count)} />
        <Compromiso tipo="MINDFULNESS" descripcion="Meditación 10 min" icon={faSpa} onChecksChange={(count) => setTotalChecks(prev => prev + count)} />
        <Compromiso tipo="RELACIONES" descripcion="Contactar a un amigo" icon={faUsers} onChecksChange={(count) => setTotalChecks(prev => prev + count)} />
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
                  data: [totalChecks, 42 - totalChecks],
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
              {Math.round((totalChecks / 42) * 100)}%
            </div>
          </div>
        </div>
        <div className="resumen-compromisos-frase">¡Vas genial, sigue así!</div>
      </div>
    </div>
  );
}

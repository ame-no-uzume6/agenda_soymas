import '../hojas-estilo/Compromiso.css';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

function Compromiso ({ tipo = 'DEPORTE', descripcion = 'Yoga 30 min', icon = null, onChecksChange }){
  // track checkbox state for 7 days
  const [checked, setChecked] = useState([false,false,false,false,false,false,false]);
  const days = ['LUN','MAR','MIE','JUE','VIE','SAB','DOM'];

  const toggle = (i) => {
    const copy = [...checked];
    const oldValue = copy[i];
    copy[i] = !copy[i];
    setChecked(copy);
    
    // Report check change to parent (+1 for check, -1 for uncheck)
    if (onChecksChange) {
      onChecksChange(copy[i] ? 1 : -1);
    }
  };

  return(
    <div className="registro-compromisos">
      <div className="registro-compromiso-texto">
        {icon && (
          <div className="compromiso-icon">
            <FontAwesomeIcon icon={icon} />
          </div>
        )}
        <div className="texto-wrap">
          <div className="tipo-compromiso">{tipo}</div>
          <div className="descripcion-compromiso">{descripcion}</div>
        </div>
      </div>
      <div className="registro-compromiso-check">
        {days.map((d, idx) => (
          <div className="check-item" key={d}>
            <div className="check-dia">{d}</div>
            <div
              className="check-box"
              role="button"
              aria-pressed={checked[idx]}
              onClick={() => toggle(idx)}
            >
              <div className={`check-circle ${checked[idx] ? 'active' : ''}`}>
                <FontAwesomeIcon icon={faCheck} className="ticket-icon" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Compromiso;
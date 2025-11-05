import '../hojas-estilo/Compromiso.css';
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

function Compromiso ({ tipo = 'DEPORTE', descripcion = 'Yoga 30 min', icon = null, initialChecks = null, onChecksChange, target = 0, onAchievedChange }){
  // track checkbox state for 7 days
  const [checked, setChecked] = useState([false,false,false,false,false,false,false]);
  const days = ['LUN','MAR','MIE','JUE','VIE','SAB','DOM'];

  const toggle = (i) => {
    const copy = [...checked];
    copy[i] = !copy[i];
    setChecked(copy);
    
    // Report achieved count to parent
    if (onAchievedChange) {
      const achieved = copy.filter(Boolean).length;
      onAchievedChange(achieved);
    }
    // also provide full checked array to parent for persistence
    if (onChecksChange) {
      onChecksChange(copy);
    }
  };

  // report initial achieved count (in case parent needs it)
  useEffect(()=>{
    // If parent provided an initial checked array, apply it first
    if(Array.isArray(initialChecks) && initialChecks.length === checked.length){
      setChecked(initialChecks);
      if(onAchievedChange){
        onAchievedChange(initialChecks.filter(Boolean).length);
      }
      if(onChecksChange){
        onChecksChange(initialChecks);
      }
    } else {
      if(onAchievedChange){
        const achieved = checked.filter(Boolean).length;
        onAchievedChange(achieved);
      }
      if(onChecksChange){
        onChecksChange(checked);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const achievedCount = checked.filter(Boolean).length;

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
        <div className="meta-compromiso">{achievedCount} / {target || 0} días</div>
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
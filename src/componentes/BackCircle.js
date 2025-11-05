import { useNavigate } from 'react-router-dom';
import '../hojas-estilo/BackCircle.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';

export default function BackCircle({ bcolor = '#A52488',color = '#fff', size = 48 }){
  const navigate = useNavigate();
  const style = {
    background: bcolor,
    color: color,
    width: size,
    height: size,
    fontSize: Math.round(size * 0.45) + 'px'
  };

  return (
    <button
      className="back-circle"
      style={style}
      aria-label="Volver a datos personales"
      onClick={() => navigate('/calendario-inicio')}
    >
      <FontAwesomeIcon icon={faChevronLeft} />
    </button>
  );
}

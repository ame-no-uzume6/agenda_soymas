import '../hojas-estilo/Boton.css';

function Boton({ texto, esBotonInicio, onClick, icon, className }) {
  const baseClass = esBotonInicio ? 'boton-inicio' : 'boton-perfil';
  return (
    <button
      className={[baseClass, className].filter(Boolean).join(' ')}
      onClick={onClick}>
      {icon && <span className="boton-icon">{icon}</span>}
      <span className="boton-text">{texto}</span>
    </button>
  );
}

export default Boton;
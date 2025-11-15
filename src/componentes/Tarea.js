import '../hojas-estilo/Tarea.css';
import { useState, useCallback, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faEllipsisV, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';

function Tarea({ Descripción, onEdit, onDelete, activa = true, onToggle }) {
  // activa = 1 significa activa (no tachada), activa = 0 significa completada (tachada)
  const [checked, setChecked] = useState(activa === 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Actualizar checked cuando cambia activa (por ejemplo, al cargar desde BBDD)
  useEffect(() => {
    setChecked(activa === 0);
  }, [activa]);

  const handleDelete = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onDelete && onDelete();
    }, 300); // Match this with CSS animation duration
  }, [onDelete]);

  const handleToggle = () => {
    const newChecked = !checked;
    setChecked(newChecked);
    // Llamar callback para actualizar en BBDD
    if (onToggle) {
      onToggle(newChecked ? 0 : 1); // Si checked=true, activa=0 (completada/tachada)
    }
  };

  return (
    <div className={`tarea-contenedor ${isExiting ? 'exiting' : ''}`}>
      <div className={`tarea-descripción ${checked ? 'done' : ''}`}>
        {Descripción}
      </div>

      <div className="tarea-check" onClick={handleToggle} role="button" aria-pressed={checked}>
        <div className={`tarea-check-circle ${checked ? 'active' : ''}`}>
          {checked && <FontAwesomeIcon icon={faCheck} className="tarea-check-icon" />}
        </div>
      </div>

      <div className="tarea-menu">
        <button className="menu-button" onClick={() => setMenuOpen(v => !v)} aria-expanded={menuOpen}>
          <FontAwesomeIcon icon={faEllipsisV} />
        </button>
        {menuOpen && (
          <div className="menu-popover">
            <button className="menu-item" onClick={() => { setMenuOpen(false); onEdit && onEdit(); }}><FontAwesomeIcon icon={faEdit} /> Editar</button>
            <button className="menu-item" onClick={() => { setMenuOpen(false); handleDelete(); }}><FontAwesomeIcon icon={faTrash} /> Eliminar</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Tarea;
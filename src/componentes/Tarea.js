import '../hojas-estilo/Tarea.css';
import { useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faEllipsisV, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';

function Tarea({ Descripción, onEdit, onDelete }) {
  const [checked, setChecked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleDelete = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onDelete && onDelete();
    }, 300); // Match this with CSS animation duration
  }, [onDelete]);

  return (
    <div className={`tarea-contenedor ${isExiting ? 'exiting' : ''}`}>
      <div className={`tarea-descripción ${checked ? 'done' : ''}`}>
        {Descripción}
      </div>

      <div className="tarea-check" onClick={() => setChecked(c => !c)} role="button" aria-pressed={checked}>
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
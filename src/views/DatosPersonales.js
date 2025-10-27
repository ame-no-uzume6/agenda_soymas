import { useNavigate } from 'react-router-dom';
import '../hojas-estilo/DatosPersonales.css';
import Boton from '../componentes/Boton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faHandFist, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { faCircleCheck } from '@fortawesome/free-regular-svg-icons';

const IconCalendar = <FontAwesomeIcon icon={faCalendarDays} style={{ color: '#fff' }} />;
const IconCheck = <FontAwesomeIcon icon={faHandFist} style={{ color: '#fff' }} />;
const IconClipboard = <FontAwesomeIcon icon={faCircleCheck} style={{ color: '#fff' }} />;
const IconInfo = <FontAwesomeIcon icon={faCircleInfo} style={{ color: '#fff' }} />;

export default function DatosPersonales() {
  const navigate = useNavigate();

  const calendario = () => {
    navigate('/login');
  };

  return (
    <div className="datos-contenedor">
      <div className="imagen-contendor">
        <img className='imagen-datos' src={require('../imagenes/datos.png')} alt="Imagen de Login" />
      </div>
      <div className="perfil-contenedor">
        <div className="imagen-perfil-contendor">
          <img className='imagenPerfil' src={require('../imagenes/perfil.png')} alt="Imagen de Login" />
        </div>
        
        <h1 className='nombre'>Nombre Estudiante</h1>
        <Boton
          esBotonInicio={false}
          texto="CALENDARIO"
          icon={IconCalendar}
          onClick={calendario} />
        <Boton
          esBotonInicio={false}
          texto="ASISTENCIA"
          icon={IconCheck}
          onClick={calendario} />
        <Boton
          esBotonInicio={false}
          texto="COMPROMISOS"
          icon={IconClipboard}
          onClick={calendario} />
        <Boton
          esBotonInicio={false}
          texto="INFORMACIÓN"
          icon={IconInfo}
          onClick={calendario} />
      </div>
    </div>
  );
}

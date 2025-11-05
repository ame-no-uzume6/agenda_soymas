import '../hojas-estilo/Inicio.css';
import { useNavigate } from 'react-router-dom';
import Boton from "../componentes/Boton";
import imagenInicio from '../imagenes/inicio.png';

export default function Inicio() {
  const navigate = useNavigate();

  const rutaIniciarSesion = () => {
    navigate('/login');
  };

  return (
    <div className="inicio-contenedor">
      <div className='logo-contenedor'>
        <img className='logo' src={require('../imagenes/logoSoymas.png')} alt="Logo" />
      </div>

      <h1 className='titulo'>TU AGENDA VIRTUAL</h1>

        <div className="imagen-contenedor">
          <img className='imagen-inicio' src={imagenInicio} alt="Imagen de inicio" />
        </div>
        <div className="frase-contenedor">
          <h1 className='frase'>Atrévete a empezar</h1>
        </div>
        <Boton
          esBotonInicio={true}
          texto="INICIAR SESIÓN"
          onClick={rutaIniciarSesion} />
    </div>
  );
}

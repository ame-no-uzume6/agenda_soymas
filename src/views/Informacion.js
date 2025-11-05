import '../hojas-estilo/Información.css';
import BackCircle from '../componentes/BackCircle';

export default function Informacion() {
  return (
    <div className="informacion-contenedor">
      <div className="nav-contenedor">
        <BackCircle/>
        <h1 className="titulo-informacion">INFORMACIÓN</h1>
      </div>
      <img className='imagen-informacion' src={require('../imagenes/Informacion.png')} alt="Imagen de información" />
    </div>
  );
}
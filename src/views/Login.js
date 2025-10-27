import { useNavigate } from 'react-router-dom';
import '../hojas-estilo/Login.css';
import Boton from '../componentes/Boton';

export default function Login() {
  const navigate = useNavigate();
  const login = () => {
    // Lógica de inicio de sesión aquí
    navigate('/datos-personales');
  }

  return (
    <div className="login-contenedor">
      <div className="imagen-contendor">
        <img className="imagen-login" src={require('../imagenes/login.png')} alt="Imagen de Login" />
      </div>
      <div className="formulario-contenedor">
        <div className="frase-contenedor">
          <h1 className='frase'>Ama tu camino</h1>
        </div>
        <input type="text" placeholder="Correo electrónico" className="input-usuario" />
        <input type="password" placeholder="Contraseña" className="input-contraseña" />
        <Boton
                  esBotonInicio={true}
                  texto="INGRESAR"
                  onClick={login} />
        <a className='mensaje-contraseña' href='#'>¿Olvidaste tu contraseña?</a>
      </div>
    </div>
  );
}

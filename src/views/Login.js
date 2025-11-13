import { useNavigate } from 'react-router-dom';
import '../hojas-estilo/Login.css';
import Boton from '../componentes/Boton';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const doLogin = async () => {
    setError('');
    try {
      const res = await login(email.trim(), password);
      if(res && res.ok){
        navigate('/calendario-inicio');
      } else {
        setError(res && res.message ? res.message : 'Error al iniciar sesión');
      }
    } catch (e) {
      console.error('login exception', e);
      setError('Error de red al iniciar sesión');
    }
  }

  return (
    <div className="login-contenedor">
      <div className="formulario-contenedor">
        <div className="frase-contenedor">
          <h1 className='frase'>Ama tu camino</h1>
        </div>
        <input value={email} onChange={e=>setEmail(e.target.value)} type="text" placeholder="Correo electrónico" className="input-usuario" />
        <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Contraseña" className="input-contraseña" />
        {error && <div className="login-error">{error}</div>}
        <Boton
                  esBotonInicio={true}
                  texto="INGRESAR"
                  onClick={doLogin} />
      </div>
    </div>
  );
}

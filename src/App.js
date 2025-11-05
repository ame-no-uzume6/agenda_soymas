import './App.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Inicio from './views/Inicio';
import Login from './views/Login';
import Compromisos from './views/Compromisos';
import Asistencia from './views/Asistencia';
import Informacion from './views/Informacion';
import CalendarioInicio from './views/CalendarioInicio';
import { AuthProvider } from './context/AuthContext';

const router = createBrowserRouter([
  { path: '/', element: <Inicio /> },
  { path: '/login', element: <Login /> },
  { path: '/calendario-inicio', element: <CalendarioInicio /> },
  { path: '/compromisos', element: <Compromisos /> },
  { path: '/asistencia', element: <Asistencia /> },
  {path: '/informacion', element: <Informacion /> },
]);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;

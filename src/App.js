import './App.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Inicio from './views/Inicio';
import Login from './views/Login';
import DatosPersonales from './views/DatosPersonales';
import Compromisos from './views/Compromisos';
import Calendario from './views/Calendario';
import Asistencia from './views/Asistencia';

const router = createBrowserRouter([
  { path: '/', element: <Inicio /> },
  { path: '/login', element: <Login /> },
  { path: '/datos-personales', element: <DatosPersonales /> },
  { path: '/compromisos', element: <Compromisos /> },
  { path: '/calendario', element: <Calendario /> },
  { path: '/asistencia', element: <Asistencia /> },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;

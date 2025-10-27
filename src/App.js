import './App.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Inicio from './views/Inicio';
import Login from './views/Login';
import DatosPersonales from './views/DatosPersonales';
import Compromisos from './views/Compromisos';
import Calendario from './views/Calendario';
import Asistencia from './views/Asistencia';

const router = createBrowserRouter([
  { path: 'agenda_soymas/', element: <Inicio /> },
  { path: 'agenda_soymas/login', element: <Login /> },
  { path: 'agenda_soymas/datos-personales', element: <DatosPersonales /> },
  { path: 'agenda_soymas/compromisos', element: <Compromisos /> },
  { path: 'agenda_soymas/calendario', element: <Calendario /> },
  { path: 'agenda_soymas/asistencia', element: <Asistencia /> },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;

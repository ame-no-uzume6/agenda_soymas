# 📅 Agenda Virtual - Gestor de Tareas y Asistencia

Una aplicación web moderna para gestionar tareas, asistencia semanal, compromisos personales y realizar seguimiento del desempeño con monedero virtual integrado.

## ✨ Características Principales

- **📊 Panel de Control**: Vista general de asistencia, tareas y compromisos
- **📅 Calendario Interactivo**: Visualización de tareas por mes con indicadores visuales
- **✅ Registro de Asistencia**: Control semanal de asistencia con cálculo automático de porcentaje mensual
- **💰 Monedero Virtual**: Sistema de recompensas basado en porcentaje de asistencia
  - 60-69%: $10,000
  - 70-79%: $15,000
  - 80-89%: $20,000
  - 90-100%: $25,000
- **📝 Gesión de Tareas**: Crear, editar y eliminar tareas con visualización en calendario
- **🎯 Compromisos Semanales**: Seguimiento de 6 tipos de compromisos con progreso diario
- **🔐 Autenticación Segura**: Sistema de login integrado

## 🛠️ Stack Tecnológico

### Frontend
- **React 19** - Librería UI
- **React Router v7** - Navegación
- **Chart.js** - Gráficos y visualización de datos
- **Font Awesome** - Iconografía
- **CSS3** - Estilos personalizados

### Backend
- **Node.js + Express** - Servidor REST API
- **MySQL** - Base de datos relacional
- **mysql2/promise** - Cliente MySQL asincrónico

### Base de Datos
- **Database**: `agenda_soymas`
- **Tablas principales**:
  - `usuarios` - Información de usuarios
  - `asistencia` - Registros de asistencia diaria
  - `tareascalendario` - Tareas del usuario
  - `compsemanal` - Configuración de compromisos

## 🚀 Guía de Inicio Rápido

### Requisitos Previos
- Node.js (v14 o superior)
- npm o yarn
- MySQL Server
- Git

### Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/ame-no-uzume6/agenda-soymas.git
cd agenda-virtual
```

2. **Instalar dependencias del frontend**
```bash
npm install
```

3. **Configurar el backend**
```bash
cd server
npm install
```

4. **Configurar variables de entorno**

Crear archivo `.env` en la carpeta `server/`:
```
PORT=4000
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=tu_contraseña
MYSQL_DATABASE=agenda_soymas
ALLOW_PASSWORDLESS=false
```

5. **Configurar la base de datos**

Ejecutar los scripts SQL en `server/SETUP.md` para crear las tablas necesarias.

### Desarrollo Local

**Terminal 1 - Backend**:
```bash
cd server
npm start
```
El servidor ejecutará en `http://localhost:4000`

**Terminal 2 - Frontend**:
```bash
npm start
```
La aplicación abrirá en `http://localhost:3000`

## 📖 Uso

### Panel Principal
- **Dashboar**: Resumen de asistencia del mes, monedero virtual y próximos compromisos
- **Asistencia**: Registra tu asistencia diaria (lunes a viernes)
- **Calendario**: Visualiza tus tareas en formato mensual
- **Compromisos**: Establece y realiza seguimiento de tus compromisos semanales

### Gestión de Tareas
1. Accede a la sección "Calendario Inicio"
2. Haz clic en una fecha para crear una nueva tarea
3. Completa el formulario con:
   - Título de la tarea
   - Descripción
   - Categoría
4. Las tareas aparecerán con un círculo morado en el calendario

### Registro de Asistencia
1. Ve a la sección "Asistencia"
2. Marca los días que asististe (L-V)
3. El sistema calcula automáticamente:
   - Porcentaje mensual basado en días laborales
   - Monto del monedero según el porcentaje

## 📊 API Endpoints

### Autenticación
- `POST /api/login` - Login de usuario
- `GET /api/user` - Obtener info del usuario

### Asistencia
- `GET /api/asistenciaRange` - Obtener asistencia de un rango de fechas
- `POST /api/syncAsistencia` - Guardar/actualizar asistencia
- `GET /api/monthSummary` - Resumen mensual de asistencia

### Tareas
- `GET /api/tasks` - Listar todas las tareas
- `POST /api/tasks` - Crear nueva tarea
- `PUT /api/tasks/:id` - Actualizar tarea
- `DELETE /api/tasks/:id` - Eliminar tarea

### Compromisos
- `GET /api/compromisos` - Obtener compromisos configurados
- `POST /api/compromisos` - Crear/actualizar compromiso
- `PUT /api/compromisos/:id` - Actualizar compromiso

## 🌐 Despliegue

### Despliegue en GitHub Pages (Frontend)

1. Crear repositorio en GitHub
2. Actualizar `package.json`:
```json
{
  "homepage": "https://usuario.github.io/agenda-virtual",
  "scripts": {
    "deploy": "gh-pages -d build"
  }
}
```

3. Ejecutar:
```bash
npm run build
npm run deploy
```

### Despliegue del Backend

Opciones recomendadas:
- **Render.com** (gratuito con limitaciones)
- **Railway.app** (créditos iniciales gratis)
- **Servidor local** (máximo control)

Una vez deployado, actualizar la URL de la API en el frontend.

## 📁 Estructura del Proyecto

```
agenda-virtual/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── App.js
│   ├── index.js
│   ├── views/
│   │   ├── Asistencia.js
│   │   ├── CalendarioInicio.js
│   │   ├── CalendarioMes.js
│   │   └── Compromisos.js
│   ├── componentes/
│   │   └── CalendarioMes.js
│   └── hojas-estilo/
│       ├── App.css
│       ├── Calendario.css
│       └── index.css
├── server/
│   ├── server.js
│   ├── .env.example
│   └── SETUP.md
└── package.json
```

## 🔧 Variables de Entorno

### Frontend (.env en raíz)
```
REACT_APP_API_URL=http://localhost:4000
```

### Backend (server/.env)
```
PORT=4000
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=agenda_soymas
ALLOW_PASSWORDLESS=false
```

## 🐛 Troubleshooting

### Error 401 en Login
- Verificar que el usuario existe en la base de datos
- Activar `ALLOW_PASSWORDLESS=true` en desarrollo para pruebas
- Revisar las credenciales en la BD

### Task Indicators no aparecen
- Asegurar que las tareas se guardaron en la BD (`tareascalendario`)
- Verificar que el email del usuario coincide en todas las tablas
- Limpiar caché del navegador (Ctrl+Shift+Del)

### Errores de conexión a BD
- Verificar que MySQL está ejecutándose
- Confirmar credenciales en `.env`
- Revisar que la base de datos `agenda_soymas` existe

## 📝 Notas Importantes

- La asistencia se calcula basándose en **días laborales** (lunes a viernes)
- Los porcentajes mensuales se actualizan automáticamente
- Las tareas eliminadas también desaparecen del calendario
- Los compromisos se reinician cada semana (lunes a domingo)

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Para cambios mayores, por favor abre un issue primero para discutir los cambios propuestos.

## 📄 Licencia

Este proyecto está bajo licencia MIT. Ver archivo LICENSE para más detalles.

## 📧 Contacto

Para preguntas o sugerencias, contacta al equipo de desarrollo.

---

**Última actualización**: Noviembre 2025

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

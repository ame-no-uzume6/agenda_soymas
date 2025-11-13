# Server Setup & Testing Guide

## Prerequisites
1. Node.js 14+ installed
2. MySQL server running with the `agenda_soymas` database
3. Database schema created (use the SQL dump provided)

## Initial Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and fill in your database credentials:
```bash
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=agenda_soymas
PORT=4000
ALLOW_PASSWORDLESS=false
```

### 3. Create Test User in Database

Connect to your MySQL database and run one of the following:

#### Option A: Create a new test user
```sql
INSERT INTO usuarios (Nombre, Apellido, Correo, Contraseña, Oficio)
VALUES ('Test', 'Usuario', 'test@example.com', 'password123', 'Oficina');
```

#### Option B: Update an existing user's password
```sql
UPDATE usuarios 
SET Contraseña = 'password123' 
WHERE Correo = 'your.email@example.com';
```

### 4. (Optional) Enable Passwordless Mode for Development
If you want to login without password checking during development:
1. Open `.env` and set: `ALLOW_PASSWORDLESS=true`
2. Restart the server
3. You can login with any email that exists in the `usuarios` table

## Running the Server

```bash
npm start
```

Expected output:
```
Agenda server listening on port 4000
```

## API Endpoints

### Authentication
- **POST /api/login**
  - Body: `{ "email": "test@example.com", "password": "password123" }`
  - Response: `{ "ok": true, "user": { "IdUsuario": 1, "email": "...", "name": "...", "oficio": "..." } }`

### User Info
- **GET /api/user?email=test@example.com**
  - Returns user basic information

### Attendance (Asistencia)
- **GET /api/asistenciaRange?email=test@example.com&start=2025-11-10&end=2025-11-14**
  - Returns attendance records for date range
  
- **POST /api/syncAsistencia**
  - Body: `{ "email": "test@example.com", "asistencia": { "asistencia-week-2025-11-10": [true, false, true, false, true] } }`
  - Syncs weekly attendance to database

- **GET /api/monthSummary?email=test@example.com&month=2025-11**
  - Returns monthly attendance stats (attended days, total working days)

### Tasks (Tareas)
- **GET /api/tasks?email=test@example.com&date=2025-11-10** (optional date filter)
- **POST /api/tasks**
  - Body: `{ "email": "...", "FechaHora": "2025-11-10T14:30:00", "Descripcion": "Task description" }`
- **PUT /api/tasks/1**
- **DELETE /api/tasks/1**

### Commitments (Compromisos)
- **GET /api/compromisos?email=test@example.com&weekStart=2025-11-10** (optional)
- **POST /api/compromisos**
  - Body: `{ "email": "...", "Factor": 5, "Descripcion": "DEPORTE", "DiasCantidad": 3, "Regis_Fecha": "2025-11-10" }`
- **PUT /api/compromisos/1**

## Testing the Frontend

1. Start the backend server:
   ```bash
   cd server
   npm start
   ```

2. In another terminal, start the frontend (from project root):
   ```bash
   npm start
   ```

3. Login with test user credentials:
   - Email: `test@example.com`
   - Password: `password123` (or leave blank if ALLOW_PASSWORDLESS=true)

4. Test Asistencia:
   - Check/uncheck attendance boxes for the week
   - Changes should persist to the database
   - Monthly percentage should update based on total working days in the month
   - Wallet amount should update according to percentage ranges

## Database Schema Notes

### Table: `asistencia`
- `IdRegistro` (int, PK, auto-increment)
- `IdUsuario` (int, FK → usuarios.IdUsuario)
- `Fecha_Regis` (date) — the attendance date
- `Asistencia` (tinyint) — 1 for attended, 0 for absent

### Table: `usuarios`
- `IdUsuario` (int, PK, auto-increment)
- `Nombre` (varchar)
- `Apellido` (varchar)
- `Correo` (varchar, unique)
- `Contraseña` (varchar) — currently plain-text; should be hashed in production
- `Oficio` (varchar)

## Troubleshooting

### Port 4000 already in use
Kill existing Node processes:
```powershell
Get-Process -Name node | Stop-Process -Force
```

### Database connection failed
- Check that MySQL is running
- Verify credentials in `.env` match your database
- Ensure `agenda_soymas` database exists and has the correct schema

### Login returns 401 (Unauthorized)
- Verify the user exists in the `usuarios` table with correct email
- Check that the password matches (case-sensitive)
- If using ALLOW_PASSWORDLESS mode, check that it's set to `true` in `.env`

## Security Notes for Production

⚠️ **This setup is for development/testing only.**

Before deploying to production:
1. **Hash passwords**: Use bcrypt or similar instead of plain-text
2. **Use HTTPS**: Never send passwords over HTTP
3. **JWT tokens**: Implement token-based auth instead of session-based
4. **Disable ALLOW_PASSWORDLESS**: Remove the development mode
5. **Rate limiting**: Add rate limiting to prevent brute-force attacks
6. **Validation**: Add stricter input validation and sanitization

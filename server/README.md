Agenda server

This small Express server provides endpoints to sync attendance to a MySQL database that matches your provided SQL schema.

Quick start

1. Copy `.env.example` to `.env` and fill DB credentials.
2. Install dependencies:

   cd server
   npm install

3. Start server:

   npm start

Endpoints

- POST /api/syncAsistencia
  Body: { email: 'user@example.com', asistencia: { 'asistencia-week-YYYY-MM-DD': [true,false,true,false,true], ... } }
  Behavior: for each week key the server will insert/delete per-day rows in the `asistencia` table for that user.

- GET /api/monthSummary?email=...&month=YYYY-MM
  Returns { ok:true, attended, total } where total is number of working days (Mon-Fri) in that month.

Notes

- The server expects the `usuarios` table populated with users where `Correo` matches the frontend email. For a production-ready app you'll need secure password hashing, validation, auth tokens, and proper error handling.

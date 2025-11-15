const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const pool = require('./db');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));

// Health
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Simple login (by email+password) - optionally used by frontend later
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) return res.status(400).json({ ok: false, message: 'Missing email' });
    // For better diagnostics and to support development environments, first fetch by email
    const [rowsByEmail] = await pool.query('SELECT * FROM usuarios WHERE Correo = ?', [email]);
    if (!rowsByEmail || rowsByEmail.length === 0) {
      console.warn(`[LOGIN] Email not found: ${email}`);
      return res.status(401).json({ ok: false, message: 'Invalid credentials (email not found)' });
    }
    const user = rowsByEmail[0];
    console.log(`[LOGIN] User found: ${email}, DB fields:`, Object.keys(user));

    const allowPasswordless = process.env.ALLOW_PASSWORDLESS === 'true';
    if (!allowPasswordless) {
      if (!password) return res.status(400).json({ ok: false, message: 'Missing password' });
      // verify password column if present
      const dbPass = user.Contraseña || '';
      console.log(`[LOGIN] Password check: sent="${password}", db="${dbPass}", match=${dbPass === password}`);
      if (dbPass !== password) {
        console.warn(`[LOGIN] Password mismatch for ${email}`);
        return res.status(401).json({ ok: false, message: 'Invalid credentials (password mismatch)' });
      }
    } else {
      // passwordless mode: log a warning on the server and allow login if email exists
      console.warn(`[LOGIN] ALLOW_PASSWORDLESS enabled: allowing login by email without password for ${email}`);
    }
    console.log(`[LOGIN] Success for ${email}`);
    // map DB fields to front-end friendly fields
    const mapped = {
      IdUsuario: user.IdUsuario,
      email: user.Correo,
      name: user.Nombre + ' ' + user.Apellido,
      oficio: user.Oficio
    };
    res.json({ ok: true, user: mapped });
  } catch (e) {
    console.error('[LOGIN] Exception:', e);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// Sync asistencia: receive an 'asistencia' object from frontend and persist per-day rows
// Expected body: { email: 'ana@example.com', asistencia: { 'asistencia-week-YYYY-MM-DD': [true,false,...], ... } }
app.post('/api/syncAsistencia', async (req, res) => {
  try {
    const { email, asistencia } = req.body;
    if (!email || !asistencia) return res.status(400).json({ ok: false, message: 'Missing email or asistencia' });

    // find user
    const [users] = await pool.query('SELECT IdUsuario FROM usuarios WHERE Correo = ?', [email]);
    if (!users || users.length === 0) return res.status(404).json({ ok: false, message: 'User not found' });
    const userId = users[0].IdUsuario;

    // We'll upsert each date: delete existing row for that user and date, then insert new
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      for (const [key, weekArr] of Object.entries(asistencia)) {
        if (!key.startsWith('asistencia-week-')) continue;
        const datePart = key.replace('asistencia-week-', ''); // YYYY-MM-DD (monday)
        const mondayDate = new Date(datePart);
        if (isNaN(mondayDate)) continue;

        // iterate 5 days (Mon-Fri)
        for (let i = 0; i < weekArr.length; i++) {
          const dayDate = new Date(mondayDate);
          dayDate.setDate(mondayDate.getDate() + i);
          const yyyy = dayDate.getFullYear();
          const mm = String(dayDate.getMonth() + 1).padStart(2, '0');
          const dd = String(dayDate.getDate()).padStart(2, '0');
          const dayStr = `${yyyy}-${mm}-${dd}`;
          const value = weekArr[i] ? 1 : 0;

          // delete existing for that user/date
          await conn.query('DELETE FROM asistencia WHERE IdUsuario = ? AND Fecha_Regis = ?', [userId, dayStr]);
          // insert new
          await conn.query('INSERT INTO asistencia (IdUsuario, Fecha_Regis, Asistencia) VALUES (?, ?, ?)', [userId, dayStr, value]);
        }
      }

      await conn.commit();
      res.json({ ok: true });
    } catch (e) {
      await conn.rollback();
      console.error('syncAsistencia transaction error', e);
      res.status(500).json({ ok: false, message: 'Database error' });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// Get user basic info (and optional related counts)
app.get('/api/user', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ ok: false, message: 'Missing email' });
    const [rows] = await pool.query('SELECT IdUsuario, Nombre, Apellido, Oficio, Correo FROM usuarios WHERE Correo = ?', [email]);
    if (!rows || rows.length === 0) return res.status(404).json({ ok: false, message: 'User not found' });
    const u = rows[0];
    res.json({ ok: true, user: { IdUsuario: u.IdUsuario, email: u.Correo, name: `${u.Nombre} ${u.Apellido}`, oficio: u.Oficio } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// Get asistencia rows for a date range for an email
app.get('/api/asistenciaRange', async (req, res) => {
  try {
    const { email, start, end } = req.query; // YYYY-MM-DD
    if (!email || !start || !end) return res.status(400).json({ ok: false, message: 'Missing params' });
    const [users] = await pool.query('SELECT IdUsuario FROM usuarios WHERE Correo = ?', [email]);
    if (!users || users.length === 0) return res.status(404).json({ ok: false, message: 'User not found' });
    const userId = users[0].IdUsuario;
    const [rows] = await pool.query('SELECT Fecha_Regis, Asistencia FROM asistencia WHERE IdUsuario = ? AND Fecha_Regis BETWEEN ? AND ?', [userId, start, end]);
    res.json({ ok: true, rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// Tasks endpoints (tareascalendario)
app.get('/api/tasks', async (req, res) => {
  try {
    const { email, date } = req.query; // date optional YYYY-MM-DD
    if (!email) return res.status(400).json({ ok: false, message: 'Missing email' });
    const [users] = await pool.query('SELECT IdUsuario FROM usuarios WHERE Correo = ?', [email]);
    if (!users || users.length === 0) return res.status(404).json({ ok: false, message: 'User not found' });
    const userId = users[0].IdUsuario;
    if (date) {
      // return FechaHora and FechaRegistro as formatted strings to avoid JS Date->ISO conversions
      const [rows] = await pool.query("SELECT IdTarea, Descripcion, DATE_FORMAT(FechaHora, '%Y-%m-%d %H:%i:%s') AS FechaHora, DATE_FORMAT(FechaRegistro, '%Y-%m-%d') AS FechaRegistro FROM tareascalendario WHERE IdUsuario = ? AND FechaRegistro = ?", [userId, date]);
      return res.json({ ok: true, rows });
    }
    const [rows] = await pool.query("SELECT IdTarea, Descripcion, DATE_FORMAT(FechaHora, '%Y-%m-%d %H:%i:%s') AS FechaHora, DATE_FORMAT(FechaRegistro, '%Y-%m-%d') AS FechaRegistro FROM tareascalendario WHERE IdUsuario = ? ORDER BY FechaHora DESC", [userId]);
    res.json({ ok: true, rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const { email, FechaHora, Descripcion } = req.body;
    if (!email || !Descripcion) return res.status(400).json({ ok: false, message: 'Missing params' });
    const [users] = await pool.query('SELECT IdUsuario FROM usuarios WHERE Correo = ?', [email]);
    if (!users || users.length === 0) return res.status(404).json({ ok: false, message: 'User not found' });
    const userId = users[0].IdUsuario;
    const fechaRegistro = FechaHora ? String(FechaHora).split(/T| /)[0] : new Date().toISOString().slice(0,10);
    const [result] = await pool.query('INSERT INTO tareascalendario (IdUsuario, FechaHora, Descripcion, FechaRegistro) VALUES (?, ?, ?, ?)', [userId, FechaHora || null, Descripcion, fechaRegistro]);
    res.json({ ok: true, id: result.insertId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { FechaHora, Descripcion } = req.body;
    if (!id) return res.status(400).json({ ok: false, message: 'Missing id' });
    await pool.query('UPDATE tareascalendario SET FechaHora = ?, Descripcion = ? WHERE IdTarea = ?', [FechaHora || null, Descripcion || '', id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ ok: false, message: 'Missing id' });
    await pool.query('DELETE FROM tareascalendario WHERE IdTarea = ?', [id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// Compromisos endpoints (compsemanal)
app.get('/api/compromisos', async (req, res) => {
  try {
    const { email, weekStart } = req.query; // weekStart optional YYYY-MM-DD
    if (!email) return res.status(400).json({ ok: false, message: 'Missing email' });
    const [users] = await pool.query('SELECT IdUsuario FROM usuarios WHERE Correo = ?', [email]);
    if (!users || users.length === 0) return res.status(404).json({ ok: false, message: 'User not found' });
    const userId = users[0].IdUsuario;
    if (weekStart) {
      const [rows] = await pool.query('SELECT * FROM compsemanal WHERE IdUsuario = ? AND Regis_Fecha = ?', [userId, weekStart]);
      return res.json({ ok: true, rows });
    }
    const [rows] = await pool.query('SELECT * FROM compsemanal WHERE IdUsuario = ? ORDER BY Regis_Fecha DESC', [userId]);
    res.json({ ok: true, rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

app.post('/api/compromisos', async (req, res) => {
  try {
    const { email, Factor, Descripcion, DiasCantidad, Regis_Fecha } = req.body;
    if (!email || !Factor) return res.status(400).json({ ok: false, message: 'Missing params' });
    const [users] = await pool.query('SELECT IdUsuario FROM usuarios WHERE Correo = ?', [email]);
    if (!users || users.length === 0) return res.status(404).json({ ok: false, message: 'User not found' });
    const userId = users[0].IdUsuario;
    const regDate = Regis_Fecha || new Date().toISOString().slice(0,10);
    const [result] = await pool.query('INSERT INTO compsemanal (IdUsuario, Factor, Descripcion, DiasCantidad, Regis_Fecha) VALUES (?, ?, ?, ?, ?)', [userId, Factor, Descripcion || '', DiasCantidad || 0, regDate]);
    res.json({ ok: true, id: result.insertId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

app.put('/api/compromisos/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { Factor, Descripcion, DiasCantidad } = req.body;
    if (!id) return res.status(400).json({ ok: false, message: 'Missing id' });
    await pool.query('UPDATE compsemanal SET Factor = ?, Descripcion = ?, DiasCantidad = ? WHERE IdCompromiso = ?', [Factor || '', Descripcion || '', DiasCantidad || 0, id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// RegistroCompromiso endpoints - para guardar checks de compromisos
// GET: obtener registros de checks para una semana específica
app.get('/api/registroCompromiso', async (req, res) => {
  try {
    const { email, weekStart } = req.query;
    if (!email || !weekStart) return res.status(400).json({ ok: false, message: 'Missing email or weekStart' });

    const [users] = await pool.query('SELECT IdUsuario FROM usuarios WHERE Correo = ?', [email]);
    if (!users || users.length === 0) return res.status(404).json({ ok: false, message: 'User not found' });
    const userId = users[0].IdUsuario;

    // Obtener compromisos de la semana
    const [compromisos] = await pool.query('SELECT IdCompromiso, Factor FROM compsemanal WHERE IdUsuario = ? AND Regis_Fecha = ?', [userId, weekStart]);

    if (!compromisos || compromisos.length === 0) {
      return res.json({ ok: true, checks: {} });
    }

    // Obtener registros de checks para esos compromisos
    const compromisosIds = compromisos.map(c => c.IdCompromiso);
    const [registros] = await pool.query(
      'SELECT IdRegistro, IdCompromiso, completado, fecha_completado FROM registroCompromiso WHERE IdCompromiso IN (?) AND IdUsuario = ?',
      [compromisosIds, userId]
    );

    // Convertir registros a arrays de 7 booleanos por tipo
    const checksPorTipo = {};
    const weekStartDate = new Date(weekStart);

    compromisos.forEach(comp => {
      // Inicializar array de 7 días en false
      const checksArray = [false, false, false, false, false, false, false];

      // Buscar registros de este compromiso
      const regsCompromiso = registros.filter(r => r.IdCompromiso === comp.IdCompromiso && r.completado);

      regsCompromiso.forEach(reg => {
        // Calcular qué día de la semana es (0-6)
        const fechaCompletado = new Date(reg.fecha_completado);
        const diffTime = fechaCompletado - weekStartDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays < 7) {
          checksArray[diffDays] = true;
        }
      });

      checksPorTipo[comp.Factor] = checksArray;
    });

    res.json({ ok: true, checks: checksPorTipo });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// POST/PUT: crear o actualizar el estado de todos los checks de un compromiso para la semana
app.post('/api/registroCompromiso', async (req, res) => {
  try {
    const { email, idCompromiso, checks } = req.body;
    // checks es un array de 7 booleanos [true, false, true, ...]
    if (!email || !idCompromiso || !Array.isArray(checks) || checks.length !== 7) {
      return res.status(400).json({ ok: false, message: 'Missing params or invalid checks array' });
    }

    const [users] = await pool.query('SELECT IdUsuario FROM usuarios WHERE Correo = ?', [email]);
    if (!users || users.length === 0) return res.status(404).json({ ok: false, message: 'User not found' });
    const userId = users[0].IdUsuario;

    // Obtener fecha de inicio de la semana del compromiso
    const [compRows] = await pool.query('SELECT Regis_Fecha FROM compsemanal WHERE IdCompromiso = ?', [idCompromiso]);
    if (!compRows || compRows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Compromiso not found' });
    }
    const weekStart = compRows[0].Regis_Fecha;

    // Eliminar registros anteriores de esta semana para este compromiso
    await pool.query(
      'DELETE FROM registroCompromiso WHERE IdCompromiso = ? AND IdUsuario = ?',
      [idCompromiso, userId]
    );

    // Insertar nuevos registros solo para los días marcados como true
    const insertPromises = [];
    for (let i = 0; i < checks.length; i++) {
      if (checks[i]) {
        // Calcular la fecha del día específico
        const dayDate = new Date(weekStart);
        dayDate.setDate(dayDate.getDate() + i);
        const fechaCompletado = dayDate.toISOString().slice(0, 19).replace('T', ' ');

        insertPromises.push(
          pool.query(
            'INSERT INTO registroCompromiso (IdCompromiso, IdUsuario, completado, fecha_completado) VALUES (?, ?, ?, ?)',
            [idCompromiso, userId, true, fechaCompletado]
          )
        );
      }
    }

    if (insertPromises.length > 0) {
      await Promise.all(insertPromises);
    }

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// optional: endpoint to get monthly summary (Mon-Fri total and attended count) for an email and month YYYY-MM
app.get('/api/monthSummary', async (req, res) => {
  try {
    const { email, month } = req.query; // month = 'YYYY-MM'
    if (!email || !month) return res.status(400).json({ ok: false, message: 'Missing email or month' });
    const [users] = await pool.query('SELECT IdUsuario FROM usuarios WHERE Correo = ?', [email]);
    if (!users || users.length === 0) return res.status(404).json({ ok: false, message: 'User not found' });
    const userId = users[0].IdUsuario;

    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthStr, 10) - 1;
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    // compute total working days
    let totalWorkingDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dd = new Date(year, monthIndex, d);
      const wd = dd.getDay();
      if (wd >= 1 && wd <= 5) totalWorkingDays++;
    }

    // query attended days in that month
    const startDate = `${yearStr}-${monthStr}-01`;
    const endDate = `${yearStr}-${monthStr}-${String(daysInMonth).padStart(2, '0')}`;
    const [rows] = await pool.query('SELECT COUNT(*) as attended FROM asistencia WHERE IdUsuario = ? AND Fecha_Regis BETWEEN ? AND ? AND Asistencia = 1', [userId, startDate, endDate]);
    const attended = rows && rows[0] ? rows[0].attended : 0;

    res.json({ ok: true, attended, total: totalWorkingDays });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});

app.listen(port, () => {
  console.log(`Agenda server listening on port ${port}`);
});

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http'); // Importar HTTP
const { Server } = require('socket.io'); // Importar Socket.io

const app = express();
app.use(cors());
app.use(bodyParser.json());

// CREAR SERVIDOR HTTP Y SOCKET.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Permitir frontend
    methods: ["GET", "POST"]
  }
});

// ==========================================
// CONFIGURACIÓN DE LA BASE DE DATOS
// ==========================================
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'motodriver_db',
  password: 'admin123',
  port: 5432,
});

// SOCKET.IO EVENTOS
io.on('connection', (socket) => {
  console.log('Un usuario se conectó:', socket.id);

  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
  });
});

// ... (rest of the file)



// ==========================================
// AUTENTICACIÓN (LOGIN)
// ==========================================
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1 AND password = $2', [email, password]);
    if (result.rows.length > 0) {
      res.json({ success: true, user: result.rows[0] });
    } else {
      res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

// ==========================================
// ROL: DUEÑO (ADMINISTRADOR)
// ==========================================

// 1. Estadísticas Generales
app.get('/api/reportes/estadisticas', async (req, res) => {
  try {
    const viajes = await pool.query('SELECT COUNT(*) as total FROM viajes');
    const dinero = await pool.query("SELECT SUM(costo) as total_dinero FROM viajes WHERE estado = 'pagado'");
    res.json({ viajes: viajes.rows[0].total, ingresos: dinero.rows[0].total_dinero });
  } catch (err) { res.status(500).json(err); }
});

// 1.1 Estadísticas Detalladas (Para el Dueño)
app.get('/api/reportes/detallados', async (req, res) => {
  try {
    // Join para obtener datos del conductor y del motocarro asociado
    // Nota: Asume que el conductor tiene el mismo carro asignado (limitación del modelo actual)
    const query = `
      SELECT v.*, u.nombre as nombre_conductor, m.placa, m.modelo 
      FROM viajes v
      LEFT JOIN usuarios u ON v.conductor_id = u.id
      LEFT JOIN motocarros m ON v.conductor_id = m.conductor_id
      WHERE v.estado = 'pagado'
      ORDER BY v.fecha DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) { res.status(500).json(err); }
});

// 2. Gestión de Conductores
app.get('/api/conductores', async (req, res) => {
  const result = await pool.query("SELECT * FROM usuarios WHERE rol = 'conductor' ORDER BY id DESC");
  res.json(result.rows);
});

app.post('/api/conductores', async (req, res) => {
  const { nombre, email, password } = req.body;
  try {
    await pool.query("INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, 'conductor')", [nombre, email, password]);
    res.json({ success: true });
  } catch (err) { res.status(500).json(err); }
});

app.delete('/api/conductores/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Primero desvinculamos el carro para no romper la base de datos
    await pool.query("UPDATE motocarros SET conductor_id = NULL WHERE conductor_id = $1", [id]);
    await pool.query("DELETE FROM usuarios WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json(err); }
});

// 3. Gestión de Motocarros
app.get('/api/motocarros', async (req, res) => {
  const query = `
    SELECT m.*, u.nombre as nombre_conductor 
    FROM motocarros m 
    LEFT JOIN usuarios u ON m.conductor_id = u.id
    ORDER BY m.id DESC
  `;
  const result = await pool.query(query);
  res.json(result.rows);
});

app.post('/api/motocarros', async (req, res) => {
  const { placa, modelo, conductor_id } = req.body;
  try {
    await pool.query('INSERT INTO motocarros (placa, modelo, conductor_id) VALUES ($1, $2, $3)', [placa, modelo, conductor_id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json(err); }
});

app.delete('/api/motocarros/:id', async (req, res) => {
  try {
    await pool.query("DELETE FROM motocarros WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json(err); }
});

// ==========================================
// ROL: CLIENTE
// ==========================================

// 1. Ver Motocarros Disponibles
app.get('/api/motocarros/disponibles', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM motocarros WHERE estado = 'disponible'");
    res.json(result.rows);
  } catch (err) { res.status(500).json(err); }
});

// 2. Solicitar Viaje
app.post('/api/viajes/solicitar', async (req, res) => {
  const { cliente_id, origen, destino, costo } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO viajes (cliente_id, origen, destino, estado, costo) VALUES ($1, $2, $3, 'solicitado', $4) RETURNING *",
      [cliente_id, origen, destino, costo]
    );
    const nuevoViaje = result.rows[0];

    // NOTIFICAR A TODOS LOS CONDUCTORES
    io.emit('nuevo_viaje', nuevoViaje);

    console.log("Nueva solicitud recibida ID:", nuevoViaje.id);
    res.json(nuevoViaje);
  } catch (err) { res.status(500).json(err); }
});

// 3. Pagar Viaje (CRÍTICO: Libera al conductor)
app.post('/api/viajes/pagar', async (req, res) => {
  const { viaje_id, calificacion, monto_pagado } = req.body;
  try {
    // Averiguar quién condujo este viaje
    const viaje = await pool.query("SELECT conductor_id FROM viajes WHERE id = $1", [viaje_id]);
    const conductorId = viaje.rows[0]?.conductor_id;

    // Registrar pago
    await pool.query(
      "UPDATE viajes SET estado = 'pagado', calificacion = $1, costo = $2 WHERE id = $3",
      [calificacion, monto_pagado, viaje_id]
    );

    // Liberar conductor
    if (conductorId) {
      await pool.query("UPDATE motocarros SET estado = 'disponible' WHERE conductor_id = $1", [conductorId]);

      // NOTIFICAR AL CONDUCTOR QUE LE PAGARON
      io.emit('viaje_pagado', { viaje_id, conductor_id: conductorId });
      // NOTIFICAR A TODOS QUE EL CONDUCTOR ESTÁ DISPONIBLE
      io.emit('conductor_disponible', { conductor_id: conductorId });
    }

    res.json({ success: true, message: "Pago registrado y conductor liberado" });
  } catch (err) { res.status(500).json(err); }
});

// 4. Ver estado de un viaje específico
app.get('/api/viajes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM viajes WHERE id = $1", [id]);
    if (result.rows.length > 0) res.json(result.rows[0]);
    else res.status(404).json({ message: "Viaje no encontrado" });
  } catch (err) { res.status(500).json(err); }
});

// ==========================================
// ROL: CONDUCTOR
// ==========================================

// 1. Cambiar Estado (Conectar/Desconectar)
app.post('/api/conductor/estado', async (req, res) => {
  const { conductor_id, estado, zona } = req.body;
  try {
    const result = await pool.query(
      'UPDATE motocarros SET estado = $1, zona_actual = $2 WHERE conductor_id = $3',
      [estado, zona, conductor_id]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ success: false, message: 'No tienes un motocarro asignado. Contacta al Dueño.' });
    }

    // NOTIFICAR CAMBIO DE ESTADO (Aparecer/Desaparecer del mapa)
    io.emit('estado_conductor_cambiado', { conductor_id, estado, zona });

    res.json({ success: true });
  } catch (err) { res.status(500).json(err); }
});

// 2. Ver Solicitudes Pendientes
app.get('/api/viajes/pendientes', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM viajes WHERE estado = 'solicitado' ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) { res.status(500).json(err); }
});

// 3. Aceptar Viaje
app.post('/api/viajes/aceptar', async (req, res) => {
  const { viaje_id, conductor_id } = req.body;
  try {
    // Asignar viaje
    await pool.query("UPDATE viajes SET estado = 'aceptado', conductor_id = $1 WHERE id = $2", [conductor_id, viaje_id]);

    // Marcar carro como ocupado
    await pool.query("UPDATE motocarros SET estado = 'ocupado' WHERE conductor_id = $1", [conductor_id]);

    // NOTIFICAR QUE EL VIAJE FUE ACEPTADO (Cliente recibe esto)
    io.emit('viaje_aceptado', { viaje_id, conductor_id });

    // NOTIFICAR A TODOS LOS CONDUCTORES QUE EL VIAJE YA NO ESTÁ DISPONIBLE
    io.emit('viaje_tomado', { viaje_id });

    // NOTIFICAR QUE CONDUCTOR YA NO ESTÁ DISPONIBLE
    io.emit('conductor_ocupado', { conductor_id });

    res.json({ success: true });
  } catch (err) { res.status(500).json(err); }
});

// 4. Mis Reportes (Conductor)
app.get('/api/conductores/:id/reportes', async (req, res) => {
  try {
    const { id } = req.params;
    // Agregamos orden por fecha
    const result = await pool.query("SELECT * FROM viajes WHERE conductor_id = $1 AND estado = 'pagado' ORDER BY fecha DESC", [id]);
    res.json(result.rows);
  } catch (err) { res.status(500).json(err); }
});

// INICIAR SERVIDOR
// INICIAR SERVIDOR
server.listen(3001, async () => {
  console.log('-------------------------------------------');
  console.log('🚀 Servidor MotoDriver con Socket.io en puerto 3001');
  console.log('-------------------------------------------');

  // MIGRACIÓN AUTOMÁTICA (SIMPLE)
  try {
    // 1. Agregar columna fecha si no existe
    await pool.query("ALTER TABLE viajes ADD COLUMN IF NOT EXISTS fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
    console.log("✅ Base de datos actualizada: Columna 'fecha' verificada.");
  } catch (err) {
    console.error("Error en migración DB:", err.message);
  }
});
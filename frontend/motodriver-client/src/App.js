import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:3001/api';
const socket = io('http://localhost:3001'); // Conectar a Socket.io

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/login`, { email, password });
      setUser(res.data.user);
    } catch (error) { alert('Credenciales incorrectas'); }
  };

  const logout = () => { setUser(null); setEmail(''); setPassword(''); };

  if (!user) {
    return (
      <div className="vh-100-custom">
        <div className="card-custom p-5 animate-fade-in" style={{ width: '400px', maxWidth: '90%' }}>
          <div className="text-center mb-5">
            <h1 className="fw-bold text-primary-custom mb-0" style={{ fontSize: '2.5rem' }}>MotoDriver</h1>
            <p className="text-muted">Tu transporte seguro y rápido 🛺</p>
          </div>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="form-label text-muted small fw-bold">CORREO ELECTRÓNICO</label>
              <input className="form-control-custom w-100" type="email" placeholder="ej. admin@moto.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="mb-4">
              <label className="form-label text-muted small fw-bold">CONTRASEÑA</label>
              <input className="form-control-custom w-100" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn-custom btn-primary-custom w-100 shadow-sm">INICIAR SESIÓN</button>
          </form>
          <div className="mt-5 pt-3 border-top text-center text-muted small">
            <p className="mb-1"><strong>Credenciales de Prueba:</strong></p>
            <div className="d-flex justify-content-center gap-2 flex-wrap">
              <span className="badge bg-light text-dark border">admin@moto.com</span>
              <span className="badge bg-light text-dark border">chofer@moto.com</span>
              <span className="badge bg-light text-dark border">cliente@moto.com</span>
            </div>
            <p className="mt-2 text-muted">(Pass: 123)</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <nav className="card-custom navbar navbar-light px-4 mb-5 d-flex justify-content-between align-items-center">
        <span className="navbar-brand mb-0 h3 fw-bold text-primary-custom">
          MotoDriver <span className="badge bg-light text-primary border ms-2" style={{ fontSize: '0.6em', verticalAlign: 'middle' }}>{user.rol.toUpperCase()}</span>
        </span>
        <button onClick={logout} className="btn btn-outline-danger btn-sm rounded-pill px-3 fw-bold">Cerrar Sesión</button>
      </nav>
      <div className="animate-fade-in">
        {user.rol === 'dueno' && <DuenoDashboard />}
        {user.rol === 'conductor' && <ConductorDashboard user={user} />}
        {user.rol === 'cliente' && <ClienteDashboard user={user} />}
      </div>
    </div>
  );
}

// --- DUEÑO ---
function DuenoDashboard() {
  const [stats, setStats] = useState({ viajes: 0, ingresos: 0 });
  const [conductores, setConductores] = useState([]);
  const [motocarros, setMotocarros] = useState([]);
  const [newCond, setNewCond] = useState({ nombre: '', email: '', password: '123' });
  const [newMoto, setNewMoto] = useState({ placa: '', modelo: '', conductor_id: '' });

  const fetchData = async () => {
    const s = await axios.get(`${API_URL}/reportes/estadisticas`);
    const c = await axios.get(`${API_URL}/conductores`);
    const m = await axios.get(`${API_URL}/motocarros`);
    setStats(s.data); setConductores(c.data); setMotocarros(m.data);
  };
  useEffect(() => { fetchData(); }, []);

  const crearConductor = async () => {
    if (!newCond.nombre || !newCond.email) return;
    await axios.post(`${API_URL}/conductores`, newCond);
    setNewCond({ nombre: '', email: '', password: '123' }); fetchData();
  };
  const eliminarConductor = async (id) => {
    if (window.confirm('¿Eliminar?')) { await axios.delete(`${API_URL}/conductores/${id}`); fetchData(); }
  };
  const crearMotocarro = async () => {
    if (!newMoto.placa || !newMoto.conductor_id) return;
    await axios.post(`${API_URL}/motocarros`, newMoto);
    setNewMoto({ placa: '', modelo: '', conductor_id: '' }); fetchData();
  };
  const eliminarMotocarro = async (id) => { await axios.delete(`${API_URL}/motocarros/${id}`); fetchData(); };

  return (
    <div className="row g-4">
      {/* Resumen General */}
      <div className="col-12">
        <div className="card-custom bg-gradient-primary text-white p-4">
          <div className="d-flex justify-content-around align-items-center text-center">
            <div>
              <h1 className="fw-bold display-4 m-0">${stats.ingresos || 0}</h1>
              <span className="opacity-75 fs-5">Ingresos Totales</span>
            </div>
            <div style={{ width: '1px', height: '60px', background: 'rgba(255,255,255,0.3)' }}></div>
            <div>
              <h1 className="fw-bold display-4 m-0">{stats.viajes}</h1>
              <span className="opacity-75 fs-5">Viajes Realizados</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de Estadísticas Detalladas */}
      <div className="col-12">
        <DuenoStatsDetalladas />
      </div>

      <div className="col-md-6">
        <div className="card-custom p-4 h-100">
          <h5 className="fw-bold text-primary-custom mb-3">👥 Conductores</h5>
          <div className="d-flex gap-2 mb-3">
            <input placeholder="Nombre" className="form-control-custom w-50" value={newCond.nombre} onChange={e => setNewCond({ ...newCond, nombre: e.target.value })} />
            <input placeholder="Email" className="form-control-custom w-50" value={newCond.email} onChange={e => setNewCond({ ...newCond, email: e.target.value })} />
            <button className="btn-custom btn-primary-custom" onClick={crearConductor}>+</button>
          </div>
          <div className="d-flex flex-column gap-2">
            {conductores.map(c => (
              <div key={c.id} className="list-item-custom p-3 d-flex justify-content-between align-items-center">
                <span><strong>{c.nombre}</strong> <br /><small className="text-muted">{c.email}</small></span>
                <button className="btn btn-sm btn-outline-danger btn-custom py-1" onClick={() => eliminarConductor(c.id)}>Eliminar</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="col-md-6">
        <div className="card-custom p-4 h-100">
          <h5 className="fw-bold text-primary-custom mb-3">🛺 Motocarros</h5>
          <div className="d-flex gap-2 mb-3">
            <input placeholder="Placa" className="form-control-custom" value={newMoto.placa} onChange={e => setNewMoto({ ...newMoto, placa: e.target.value })} />
            <select className="form-control-custom form-select" value={newMoto.conductor_id} onChange={e => setNewMoto({ ...newMoto, conductor_id: e.target.value })}>
              <option value="">Asignar a...</option>
              {conductores.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            <button className="btn-custom btn-primary-custom" onClick={crearMotocarro}>+</button>
          </div>
          <div className="d-flex flex-column gap-2">
            {motocarros.map(m => (
              <div key={m.id} className="list-item-custom p-3 d-flex justify-content-between align-items-center">
                <span>
                  <span className="badge bg-dark me-2">{m.placa}</span>
                  {m.nombre_conductor ? <span className="text-success small">Conductor: {m.nombre_conductor}</span> : <span className="text-muted small">Sin conductor</span>}
                </span>
                <button className="btn btn-sm btn-outline-danger btn-custom py-1" onClick={() => eliminarMotocarro(m.id)}>Eliminar</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DuenoStatsDetalladas() {
  const [detalles, setDetalles] = useState([]);
  const [verDetalles, setVerDetalles] = useState(false);

  const cargarDetalles = async () => {
    try {
      const res = await axios.get(`${API_URL}/reportes/detallados`);
      setDetalles(res.data);
      setVerDetalles(!verDetalles);
    } catch (err) { console.error(err); }
  };

  return (
    <div className="card-custom p-4">
      <div className="d-flex justify-content-between align-items-center cursor-pointer" onClick={cargarDetalles}>
        <div className="d-flex align-items-center gap-2">
          <div className="bg-light p-2 rounded-circle">📊</div>
          <h5 className="fw-bold text-dark m-0">Reporte Detallado</h5>
        </div>
        <button className="btn btn-sm btn-outline-secondary btn-custom">{verDetalles ? 'Ocultar' : 'Ver Todos'}</button>
      </div>
      {verDetalles && (
        <div className="mt-4 animate-fade-in">
          {detalles.length === 0 ? (
            <p className="text-muted text-center">No hay viajes registrados aún.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-borderless align-middle">
                <thead className="bg-light text-muted small text-uppercase">
                  <tr>
                    <th>Fecha</th>
                    <th>Motocarro</th>
                    <th>Ruta</th>
                    <th>Ganancia</th>
                    <th>Calif.</th>
                  </tr>
                </thead>
                <tbody>
                  {detalles.map(v => (
                    <tr key={v.id} className="border-bottom">
                      <td><small className="fw-bold text-secondary">{new Date(v.fecha).toLocaleString()}</small></td>
                      <td>
                        {v.placa ? (
                          <span><span className="badge bg-secondary">{v.placa}</span> <small>{v.modelo}</small></span>
                        ) : <span className="text-muted">N/A</span>}
                      </td>
                      <td><div className="d-flex flex-column"><small>📍 {v.origen}</small><small>🏁 {v.destino}</small></div></td>
                      <td className="text-primary fw-bold">+ ${v.costo}</td>
                      <td><span className="text-warning">★</span> {v.calificacion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- CLIENTE ---
function ClienteDashboard({ user }) {
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [oferta, setOferta] = useState('');
  const [viajeActual, setViajeActual] = useState(null);
  const [motosDisponibles, setMotosDisponibles] = useState([]);
  const [calificacion, setCalificacion] = useState(5);
  const [montoFinal, setMontoFinal] = useState('');

  const cargarMotos = useCallback(async () => {
    try {
      const resMotos = await axios.get(`${API_URL}/motocarros/disponibles`);
      setMotosDisponibles(resMotos.data);
    } catch (err) { console.error(err); }
  }, []);

  // SOCKET.IO LISTENERS
  useEffect(() => {
    cargarMotos();
    socket.on('conductor_ocupado', () => cargarMotos());
    socket.on('conductor_disponible', () => cargarMotos());
    socket.on('estado_conductor_cambiado', () => cargarMotos());

    socket.on('viaje_aceptado', (data) => {
      setViajeActual(prev => {
        if (prev && prev.id === data.viaje_id) {
          return { ...prev, estado: 'aceptado', conductor_id: data.conductor_id };
        }
        return prev;
      });
    });

    return () => {
      socket.off('conductor_ocupado'); socket.off('conductor_disponible'); socket.off('estado_conductor_cambiado'); socket.off('viaje_aceptado');
    };
  }, [cargarMotos]);

  const solicitarViaje = async () => {
    if (!origen || !destino || !oferta) return alert("Completa los campos");
    const res = await axios.post(`${API_URL}/viajes/solicitar`, { cliente_id: user.id, origen, destino, costo: oferta });
    setViajeActual(res.data); setMontoFinal(oferta);
  };

  const procesarPago = async () => {
    await axios.post(`${API_URL}/viajes/pagar`, { viaje_id: viajeActual.id, calificacion, monto_pagado: montoFinal });
    alert('¡Pago exitoso!'); setViajeActual(null); setOrigen(''); setDestino(''); setOferta('');
  };

  return (
    <div className="row g-4">
      <div className="col-md-8">
        {!viajeActual ? (
          <div className="card-custom p-5 bg-white h-100 d-flex flex-column justify-content-center">
            <h3 className="mb-4 text-primary-custom fw-bold">¿A dónde quieres ir? 🗺️</h3>
            <div className="mb-3">
              <label className="text-muted small fw-bold">PUNTO DE PARTIDA</label>
              <input className="form-control-custom w-100 mb-2" value={origen} onChange={e => setOrigen(e.target.value)} placeholder="Ej. Parque Principal" />
            </div>
            <div className="mb-4">
              <label className="text-muted small fw-bold">DESTINO</label>
              <input className="form-control-custom w-100" value={destino} onChange={e => setDestino(e.target.value)} placeholder="Ej. Centro Comercial" />
            </div>
            <label className="text-muted small fw-bold">TARIFA OFRECIDA ($)</label>
            <div className="input-group mb-4">
              <span className="input-group-text border-0 bg-light rounded-start text-muted">$</span>
              <input type="number" className="form-control-custom border-start-0 ps-1" value={oferta} onChange={e => setOferta(e.target.value)} placeholder="0.00" />
            </div>
            <button className="btn-custom btn-primary-custom w-100 py-3 shadow" onClick={solicitarViaje}>SOLICITAR MOTOCARRO</button>
          </div>
        ) : (
          <div className={`card-custom p-5 text-center h-100 ${viajeActual.estado === 'aceptado' ? 'border-primary' : ''}`}>
            {viajeActual.estado === 'solicitado' && (
              <div className="animate-fade-in">
                <div className="spinner-grow text-warning mb-4" role="status" style={{ width: '3rem', height: '3rem' }}></div>
                <h2 className="text-warning fw-bold mb-2">Buscando Conductor...</h2>
                <p className="text-muted mb-4">Estamos notificando a los conductores cercanos.</p>
                <div className="bg-light p-4 rounded-xl mb-4 text-start">
                  <div className="d-flex justify-content-between mb-2"><span>📍 Desde</span> <strong>{origen}</strong></div>
                  <div className="d-flex justify-content-between"><span>🏁 Hasta</span> <strong>{destino}</strong></div>
                </div>
                <h3 className="text-dark fw-bold display-6">${oferta}</h3>
              </div>
            )}

            {viajeActual.estado === 'aceptado' && (
              <div className="animate-fade-in">
                <div className="mb-4 text-primary-custom display-1"><i className="bi bi-check-circle-fill"></i>🚀</div>
                <h2 className="text-primary-custom fw-bold mb-3">¡Viaje Iniciado!</h2>
                <div className="alert alert-success rounded-pill px-4">Tu conductor está en camino.</div>

                <div className="bg-light p-4 rounded-xl mb-4 text-start">
                  <h5 className="fw-bold mb-3">Detalles del Servicio</h5>
                  <p className="mb-1">📍 <strong>{origen}</strong></p>
                  <p className="mb-0">🏁 <strong>{destino}</strong></p>
                </div>

                <div className="mt-auto pt-4 border-top">
                  <h5 className="text-muted mb-3">Finalizar y Pagar</h5>
                  <input type="number" className="form-control-custom text-center fw-bold fs-4 mb-3" value={montoFinal} onChange={e => setMontoFinal(e.target.value)} />
                  <div className="mb-4">
                    <p className="mb-2 small fw-bold text-muted">CALIFICACIÓN</p>
                    <div className="d-flex justify-content-center gap-2">
                      {[1, 2, 3, 4, 5].map(s => <button key={s} className={`btn btn-sm rounded-circle ${calificacion >= s ? 'btn-warning text-white' : 'btn-outline-secondary'}`} style={{ width: 40, height: 40 }} onClick={() => setCalificacion(s)}>★</button>)}
                    </div>
                  </div>
                  <button className="btn-custom btn-success w-100 py-3 shadow" onClick={procesarPago}>PAGAR Y FINALIZAR</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="col-md-4">
        <div className="card-custom bg-white p-4 h-100">
          <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
            <h6 className="text-primary-custom mb-0 fw-bold">DISPONIBLES CERCA</h6>
            <span className="badge bg-primary rounded-pill">{motosDisponibles.length}</span>
          </div>
          <div className="d-flex flex-column gap-3 overflow-auto" style={{ maxHeight: '600px' }}>
            {motosDisponibles.map(m => (
              <div key={m.id} className="d-flex align-items-center p-3 rounded bg-light border">
                <div className="bg-white p-2 rounded-circle shadow-sm me-3">🛺</div>
                <div>
                  <h6 className="fw-bold mb-0 text-dark">{m.placa}</h6>
                  <small className="text-muted">{m.zona_actual || 'Zona General'}</small>
                </div>
              </div>
            ))}
            {motosDisponibles.length === 0 && <p className="text-center text-muted mt-5">No hay motocarros disponibles.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- CONDUCTOR ---
function ConductorDashboard({ user }) {
  const [pendientes, setPendientes] = useState([]);
  const [conectado, setConectado] = useState(false);
  const [currentViajeId, setCurrentViajeId] = useState(null);
  const [zona, setZona] = useState('Centro');
  const [viendoReportes, setViendoReportes] = useState(false);
  const [misReportes, setMisReportes] = useState([]);

  const cargarMisReportes = async () => {
    try {
      const res = await axios.get(`${API_URL}/conductores/${user.id}/reportes`);
      setMisReportes(res.data);
      setViendoReportes(true);
    } catch (err) { console.error(err); }
  };

  // 1. SINCRONIZACIÓN INICIAL
  useEffect(() => {
    const verificarEstadoInicial = async () => {
      try {
        const res = await axios.get(`${API_URL}/motocarros`);
        const miCarro = res.data.find(m => m.conductor_id === user.id);
        if (miCarro) {
          if (miCarro.estado === 'disponible' || miCarro.estado === 'ocupado') {
            setConectado(true);
            setZona(miCarro.zona_actual || 'Centro');
            if (miCarro.estado === 'ocupado') {
              setCurrentViajeId('RESTORED_SESSION');
            }
          }
        }
      } catch (err) { console.error("Error sync:", err); }
    };
    verificarEstadoInicial();
    actualizarSolicitudes();

    socket.on('nuevo_viaje', (viaje) => setPendientes(prev => [viaje, ...prev]));
    socket.on('viaje_tomado', (data) => setPendientes(prev => prev.filter(v => v.id !== data.viaje_id)));
    socket.on('viaje_pagado', (data) => {
      if (data.conductor_id === user.id) {
        setCurrentViajeId(null);
        alert("¡Te han pagado! Ya estás disponible nuevamente.");
        actualizarSolicitudes();
      }
    });

    return () => { socket.off('nuevo_viaje'); socket.off('viaje_tomado'); socket.off('viaje_pagado'); };
  }, [user.id]);

  const cambiarEstado = async (nuevoEstado) => {
    try {
      await axios.post(`${API_URL}/conductor/estado`, { conductor_id: user.id, estado: nuevoEstado, zona });
      setConectado(nuevoEstado === 'disponible');
      if (nuevoEstado === 'disponible') actualizarSolicitudes();
    } catch (error) {
      if (error.response && error.response.data.message) alert("ERROR: " + error.response.data.message);
      setConectado(false);
    }
  };

  const aceptarViaje = async (id) => {
    try {
      await axios.post(`${API_URL}/viajes/aceptar`, { viaje_id: id, conductor_id: user.id });
      setCurrentViajeId(id);
    } catch (err) { console.error(err); alert("Error al aceptar"); }
  };

  const actualizarSolicitudes = async () => {
    try {
      const res = await axios.get(`${API_URL}/viajes/pendientes`);
      setPendientes(res.data);
    } catch (err) { console.error(err); }
  };

  return (
    <div className="card-custom shadow overflow-hidden">
      {/* HEADER */}
      <div className={`p-4 text-white d-flex justify-content-between align-items-center ${currentViajeId ? 'bg-warning' : (conectado ? 'bg-gradient-primary' : 'bg-secondary')}`}>
        <div className="d-flex align-items-center gap-3">
          <div className="bg-white text-dark rounded-circle p-2 fs-4">👮</div>
          <div>
            <h5 className="mb-0 fw-bold text-uppercase">{currentViajeId ? 'OCUPADO' : (conectado ? 'DISPONIBLE' : 'DESCONECTADO')}</h5>
            <small className="opacity-75">{user.nombre}</small>
          </div>
        </div>
        <div className="d-flex gap-2">
          {!currentViajeId && (
            <button className="btn btn-sm btn-light text-primary fw-bold rounded-pill px-3 shadow-sm" onClick={viendoReportes ? () => setViendoReportes(false) : cargarMisReportes}>
              {viendoReportes ? 'Volver' : '📜 Mis Reportes'}
            </button>
          )}
          {conectado && !currentViajeId && <button className="btn btn-sm btn-danger rounded-pill px-3 shadow-sm" onClick={() => cambiarEstado('no_disponible')}>Cerrar Turno</button>}
        </div>
      </div>

      {/* BODY */}
      <div className="card-body p-0 bg-white">
        {viendoReportes ? (
          <div className="p-4 animate-fade-in">
            <h4 className="fw-bold mb-4 text-primary-custom">Historial de Viajes</h4>
            {misReportes.length === 0 ? <p className="text-center text-muted py-5">No has completado viajes aún.</p> : (
              <div className="d-flex flex-column gap-2">
                {misReportes.map(r => (
                  <div key={r.id} className="list-item-custom p-3 d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-bold fs-5">{r.origen} ➝ {r.destino}</div>
                      <small className="text-muted"><i className="bi bi-clock"></i> {new Date(r.fecha).toLocaleString()} | ⭐ {r.calificacion}</small>
                    </div>
                    <span className="badge bg-success rounded-pill fs-5 px-3">+ ${r.costo}</span>
                  </div>
                ))}
                <div className="mt-4 p-3 bg-light rounded text-end">
                  <h3 className="fw-bold m-0 text-success">Total Ganado: ${misReportes.reduce((acc, curr) => acc + (parseFloat(curr.costo) || 0), 0)}</h3>
                </div>
              </div>
            )}
          </div>
        ) : (
          currentViajeId ? (
            <div className="text-center py-5 px-4 animate-fade-in">
              <div className="display-1 mb-4">🛺💨</div>
              <h2 className="fw-bold text-dark mb-3">Viaje en Curso</h2>
              <p className="text-muted lead mb-4">Llevando al cliente a su destino. Espera el pago para finalizar.</p>
              <div className="d-flex align-items-center justify-content-center gap-2 text-primary">
                <div className="spinner-grow spinner-grow-sm"></div><span className="fw-bold">Esperando finalización...</span>
              </div>
            </div>
          ) : (
            !conectado ? (
              <div className="text-center py-5 animate-fade-in">
                <h3 className="mb-4 fw-bold">¿Listo para trabajar? 🚦</h3>
                <div className="mb-4 d-flex justify-content-center">
                  <input className="form-control-custom text-center fs-5 fw-bold" style={{ maxWidth: '300px' }} value={zona} onChange={e => setZona(e.target.value)} placeholder="Zona de trabajo" />
                </div>
                <button className="btn-custom btn-primary-custom btn-lg px-5 shadow-lg" onClick={() => cambiarEstado('disponible')}>INICIAR TURNO</button>
              </div>
            ) : (
              <div>
                <div className="bg-light p-2 text-center border-bottom"><small className="text-muted fw-bold">ZONA ACTUAL: <span className="text-dark">{zona}</span></small></div>
                <div className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="mb-0 fw-bold">Solicitudes Recientes</h5>
                    <span className="badge bg-danger rounded-pill px-3">{pendientes.length}</span>
                  </div>
                  {pendientes.length === 0 && <div className="text-center py-5 text-muted opacity-50"><h1>📡</h1><p>Buscando pasajeros...</p></div>}
                  <div className="d-flex flex-column gap-3">
                    {pendientes.map(v => (
                      <div key={v.id} className="card-custom border-start border-5 border-primary p-4 animate-fade-in">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <h4 className="fw-bold text-success m-0">${v.costo}</h4>
                            <small className="text-muted">Tarifa Ofertada</small>
                          </div>
                          <span className="badge bg-warning text-dark">NUEVO</span>
                        </div>
                        <div className="mb-4">
                          <div className="d-flex gap-2 mb-2"><span className="text-primary">📍</span> <strong>{v.origen}</strong></div>
                          <div className="d-flex gap-2"><span className="text-danger">🏁</span> <strong>{v.destino}</strong></div>
                        </div>
                        <button className="btn-custom btn-primary-custom w-100" onClick={() => aceptarViaje(v.id)}>ACEPTAR VIAJE</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          )
        )}
      </div>
    </div>
  );
}

export default App;
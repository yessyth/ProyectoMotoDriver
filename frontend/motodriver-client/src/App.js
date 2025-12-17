import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import MapComponent from './MapComponent';

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

  // --- REGISTRO ---
  const [isRegistering, setIsRegistering] = useState(false);
  const [regData, setRegData] = useState({ nombre: '', email: '', password: '', rol: 'cliente' });

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/register`, regData);
      if (res.data.success) {
        setUser(res.data.user);
        alert(`¡Bienvenido ${res.data.user.nombre}! Registro exitoso.`);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error en el registro');
    }
  };

  if (!user) {
    return (
      <div className="vh-100-custom">
        <div className="card-custom p-5 animate-fade-in" style={{ width: '400px', maxWidth: '90%' }}>
          <div className="text-center mb-5">
            <h1 className="fw-bold text-primary-custom mb-0" style={{ fontSize: '2.5rem' }}>MotoDriver</h1>
            <p className="text-muted">Tu transporte seguro y rápido 🛺</p>
          </div>

          {!isRegistering ? (
            /* LOGIN FORM */
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="form-label text-muted small fw-bold">CORREO ELECTRÓNICO</label>
                <input className="form-control-custom w-100" type="email" placeholder="ej. admin@moto.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="mb-4">
                <label className="form-label text-muted small fw-bold">CONTRASEÑA</label>
                <input className="form-control-custom w-100" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <button type="submit" className="btn-custom btn-primary-custom w-100 shadow-sm mb-3">INICIAR SESIÓN</button>
              <button type="button" className="btn btn-link w-100 text-decoration-none text-muted" onClick={() => setIsRegistering(true)}>¿No tienes cuenta? Regístrate</button>
            </form>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegister} className="animate-fade-in">
              <div className="mb-3">
                <label className="form-label text-muted small fw-bold">NOMBRE COMPLETO</label>
                <input className="form-control-custom w-100" type="text" placeholder="Tu nombre" value={regData.nombre} onChange={e => setRegData({ ...regData, nombre: e.target.value })} required />
              </div>
              <div className="mb-3">
                <label className="form-label text-muted small fw-bold">CORREO ELECTRÓNICO</label>
                <input className="form-control-custom w-100" type="email" placeholder="tucorreo@ejemplo.com" value={regData.email} onChange={e => setRegData({ ...regData, email: e.target.value })} required />
              </div>
              <div className="mb-3">
                <label className="form-label text-muted small fw-bold">CONTRASEÑA</label>
                <input className="form-control-custom w-100" type="password" placeholder="••••••••" value={regData.password} onChange={e => setRegData({ ...regData, password: e.target.value })} required />
              </div>
              <div className="mb-4">
                <label className="form-label text-muted small fw-bold">QUIERO SER:</label>
                <select className="form-control-custom form-select" value={regData.rol} onChange={e => setRegData({ ...regData, rol: e.target.value })}>
                  <option value="cliente">👤 Pasajero (Cliente)</option>
                  <option value="conductor">👮 Conductor</option>
                  <option value="dueno">💼 Dueño (Admin)</option>
                </select>
              </div>
              <button type="submit" className="btn-custom btn-success w-100 shadow-sm mb-3">REGISTRARSE</button>
              <button type="button" className="btn btn-link w-100 text-decoration-none text-muted" onClick={() => setIsRegistering(false)}>Volver al inicio de sesión</button>
            </form>
          )}

          {!isRegistering && (
            <div className="mt-5 pt-3 border-top text-center text-muted small">
              <p className="mb-1"><strong>Credenciales de Prueba:</strong></p>
              <div className="d-flex justify-content-center gap-2 flex-wrap">
                <span className="badge bg-light text-dark border">admin@moto.com</span>
                <span className="badge bg-light text-dark border">chofer@moto.com</span>
                <span className="badge bg-light text-dark border">cliente@moto.com</span>
              </div>
              <p className="mt-2 text-muted">(Pass: 123)</p>
            </div>
          )}
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
        {user.rol === 'dueno' && <DuenoDashboard user={user} />}
        {user.rol === 'conductor' && <ConductorDashboard user={user} />}
        {user.rol === 'cliente' && <ClienteDashboard user={user} />}
      </div>
    </div>
  );
}

// --- DUEÑO ---
function DuenoDashboard({ user }) { // Recibimos user prop
  const [stats, setStats] = useState({ viajes: 0, ingresos: 0 });
  const [conductores, setConductores] = useState([]);
  const [motocarros, setMotocarros] = useState([]);
  const [newCond, setNewCond] = useState({ nombre: '', email: '', password: '123' });
  const [newMoto, setNewMoto] = useState({ placa: '', modelo: '', conductor_id: '' });

  const fetchData = useCallback(async () => {
    // Agregamos dueno_id a las peticiones
    const config = { params: { dueno_id: user.id } };

    const s = await axios.get(`${API_URL}/reportes/estadisticas`, config);
    const c = await axios.get(`${API_URL}/conductores`, config);
    const m = await axios.get(`${API_URL}/motocarros`, config);
    setStats(s.data); setConductores(c.data); setMotocarros(m.data);
  }, [user.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const crearConductor = async () => {
    if (!newCond.nombre || !newCond.email) return;
    // Enviamos dueno_id
    await axios.post(`${API_URL}/conductores`, { ...newCond, dueno_id: user.id });
    setNewCond({ nombre: '', email: '', password: '123' }); fetchData();
  };
  const eliminarConductor = async (id) => {
    if (window.confirm('¿Eliminar?')) { await axios.delete(`${API_URL}/conductores/${id}`); fetchData(); }
  };
  const crearMotocarro = async () => {
    if (!newMoto.placa) return;
    // Enviamos dueno_id
    await axios.post(`${API_URL}/motocarros`, { ...newMoto, dueno_id: user.id });
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
        <DuenoStatsDetalladas user={user} />
      </div>

      <div className="col-md-6">
        <div className="card-custom p-4 h-100">
          <h5 className="fw-bold text-primary-custom mb-3">👥 Mis Conductores</h5>
          <div className="d-flex gap-2 mb-3">
            <input placeholder="Nombre" className="form-control-custom w-50" value={newCond.nombre} onChange={e => setNewCond({ ...newCond, nombre: e.target.value })} />
            <input placeholder="Email" className="form-control-custom w-50" value={newCond.email} onChange={e => setNewCond({ ...newCond, email: e.target.value })} />
            <button className="btn-custom btn-primary-custom" onClick={crearConductor}>+</button>
          </div>
          <div className="d-flex flex-column gap-2">
            {conductores.length === 0 && <small className="text-muted">No tienes conductores registrados.</small>}
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
          <h5 className="fw-bold text-primary-custom mb-3">🛺 Mis Motocarros</h5>
          <div className="d-flex gap-2 mb-3">
            <input placeholder="Placa" className="form-control-custom" value={newMoto.placa} onChange={e => setNewMoto({ ...newMoto, placa: e.target.value })} />
            <select className="form-control-custom form-select" value={newMoto.conductor_id} onChange={e => setNewMoto({ ...newMoto, conductor_id: e.target.value })}>
              <option value="">Asignar a...</option>
              {conductores.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            <button className="btn-custom btn-primary-custom" onClick={crearMotocarro}>+</button>
          </div>
          <div className="d-flex flex-column gap-2">
            {motocarros.length === 0 && <small className="text-muted">No tienes motocarros registrados.</small>}
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

function DuenoStatsDetalladas({ user }) {
  const [detalles, setDetalles] = useState([]);
  const [verDetalles, setVerDetalles] = useState(false);

  const cargarDetalles = async () => {
    try {
      const res = await axios.get(`${API_URL}/reportes/detallados`, { params: { dueno_id: user.id } });
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

// ... (existing App logic)

// --- CLIENTE ---
function ClienteDashboard({ user }) {
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [oferta, setOferta] = useState('');
  const [viajeActual, setViajeActual] = useState(null);
  const [motosDisponibles, setMotosDisponibles] = useState([]);
  const [calificacion, setCalificacion] = useState(5);
  const [montoFinal, setMontoFinal] = useState('');

  // MAP STATE
  const [mapCenter, setMapCenter] = useState([4.6097, -74.0817]); // Default
  const [driverLocation, setDriverLocation] = useState(null);
  const [pickupCoords, setPickupCoords] = useState(null); // Coordenadas del cliente

  const cargarMotos = useCallback(async () => {
    try {
      const resMotos = await axios.get(`${API_URL}/motocarros/disponibles`);
      setMotosDisponibles(resMotos.data);
    } catch (err) { console.error(err); }
  }, []);

  // SOCKET.IO LISTENERS
  useEffect(() => {
    cargarMotos();

    // Escuchar actualizaciones de ubicación global de motos
    socket.on('ubicacion_conductor', (data) => {
      setMotosDisponibles(prev => prev.map(m =>
        m.conductor_id === data.conductor_id ? { ...m, lat: data.coords.lat, lng: data.coords.lng } : m
      ));

      // Si hay viaje activo con este conductor
      if (viajeActual && viajeActual.conductor_id === data.conductor_id) {
        setDriverLocation(data.coords);
      }
    });

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

    socket.on('viaje_iniciado', (data) => {
      setViajeActual(prev => {
        if (prev && prev.id === data.viaje_id) {
          return { ...prev, estado: 'en_curso' };
        }
        return prev;
      });
    });

    return () => {
      socket.off('conductor_ocupado'); socket.off('conductor_disponible'); socket.off('estado_conductor_cambiado'); socket.off('viaje_aceptado'); socket.off('ubicacion_conductor'); socket.off('viaje_iniciado');
    };
  }, [cargarMotos, viajeActual]);

  const solicitarViaje = async () => {
    if (!origen || !destino || !oferta) return alert("Completa los campos");

    const payload = {
      cliente_id: user.id,
      origen, destino,
      costo: oferta,
      lat_origen: pickupCoords?.lat,
      lng_origen: pickupCoords?.lng
    };

    const res = await axios.post(`${API_URL}/viajes/solicitar`, payload);
    setViajeActual(res.data); setMontoFinal(oferta);
  };

  const procesarPago = async () => {
    await axios.post(`${API_URL}/viajes/pagar`, { viaje_id: viajeActual.id, calificacion, monto_pagado: montoFinal });
    alert('¡Pago exitoso!'); setViajeActual(null); setOrigen(''); setDestino(''); setOferta(''); setDriverLocation(null); setPickupCoords(null);
  };

  const handleMapClick = (latlng) => {
    setPickupCoords(latlng);
    setOrigen(`${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`);
  };

  const markers = [];
  // 1. Mostrar todas las motos disponibles (si no estamos en viaje aceptado)
  if (!viajeActual || viajeActual.estado === 'solicitado') {
    motosDisponibles.forEach(m => {
      // Asumimos que si no tiene lat/lng es porque es nuevo o no se ha movido, usamos default o nada
      if (m.lat && m.lng) {
        markers.push({ lat: m.lat, lng: m.lng, type: 'driver', popup: `Moto: ${m.placa}` });
      }
    });
  }

  // 2. Si estamos en viaje aceptado O en curso, mostrar SOLO mi conductor
  if (viajeActual && (viajeActual.estado === 'aceptado' || viajeActual.estado === 'en_curso') && driverLocation) {
    markers.push({ ...driverLocation, type: 'driver', popup: 'Tu Conductor' });
  }

  // 3. Mostrar MI ubicación (Pickup)
  // Si está EN CURSO, mi ubicación es la del conductor (me recogió)
  if (viajeActual && viajeActual.estado === 'en_curso' && driverLocation) {
    markers.push({ ...driverLocation, type: 'client', popup: 'Tú (En viaje)' });
  } else if (pickupCoords) {
    // Si no ha iniciado el viaje o estoy esperando, mi ubicación es lat_origen
    markers.push({ lat: pickupCoords.lat, lng: pickupCoords.lng, type: 'client', popup: 'Tu Ubicación' });
  }


  return (
    <div className="row g-4">
      <div className="col-md-8">
        {!viajeActual ? (
          <div className="card-custom p-5 bg-white h-100 d-flex flex-column justify-content-center">
            {/* MAPA DE SELECCIÓN */}
            <div className="mb-4">
              <label className="fw-bold text-primary mb-2">📍 Selecciona tu ubicación de recogida</label>
              <MapComponent center={mapCenter} markers={markers} onLocationSelect={handleMapClick} style={{ height: '300px', width: '100%' }} />
            </div>

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

            {/* MAPA EN TIEMPO REAL */}
            {(viajeActual.estado === 'aceptado' || viajeActual.estado === 'en_curso') && (
              <div className="mb-4 text-start">
                <label className="fw-bold text-primary mb-2">📍 RASTREO EN VIVO</label>
                <MapComponent center={driverLocation ? [driverLocation.lat, driverLocation.lng] : mapCenter} markers={markers} style={{ height: '300px', width: '100%' }} />
              </div>
            )}

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

            {(viajeActual.estado === 'aceptado' || viajeActual.estado === 'en_curso') && (
              <div className="animate-fade-in">
                <h2 className="text-primary-custom fw-bold mb-3">{viajeActual.estado === 'aceptado' ? '¡Tu conductor está en camino!' : '¡En viaje a tu destino!'}</h2>
                <div className="alert alert-success rounded-pill px-4">{viajeActual.estado === 'aceptado' ? 'Prepárate para abordar.' : 'Disfruta el recorrido.'}</div>

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
        {/* Same sidebar */}
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
  const [activeTripClientLocation, setActiveTripClientLocation] = useState(null); // Store active trip client loc
  const [passengerPickedUp, setPassengerPickedUp] = useState(false);

  // MAP STATE
  const [myLocation, setMyLocation] = useState({ lat: 4.6097, lng: -74.0817 });

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
        setActiveTripClientLocation(null); // Limpiar marcador del pasajero
        setPassengerPickedUp(false);
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
      if (nuevoEstado === 'disponible') {
        actualizarSolicitudes();
        // Force location update so clients see me immediately
        socket.emit('actualizar_ubicacion', { conductor_id: user.id, coords: myLocation });
      }
    } catch (error) {
      if (error.response && error.response.data.message) alert("ERROR: " + error.response.data.message);
      setConectado(false);
    }
  };

  const aceptarViaje = async (id) => {
    try {
      // Find trip details first to set location
      const trip = pendientes.find(p => p.id === id);
      if (trip && trip.lat_origen && trip.lng_origen) {
        setActiveTripClientLocation({ lat: trip.lat_origen, lng: trip.lng_origen });
      } else {
        setActiveTripClientLocation(null);
      }
      setPassengerPickedUp(false);

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

  // HANDLE LOCATION UPDATE SIMULATION
  const handleMapClick = (latlng) => {
    setMyLocation(latlng);
    // Emitir al servidor
    socket.emit('actualizar_ubicacion', { conductor_id: user.id, coords: latlng });

    if (passengerPickedUp) {
      setActiveTripClientLocation(latlng);
    }
  };

  const handleMarkerClick = async (marker) => {
    if (marker.type === 'client' && currentViajeId) {
      setMyLocation({ lat: marker.lat, lng: marker.lng });
      socket.emit('actualizar_ubicacion', { conductor_id: user.id, coords: { lat: marker.lat, lng: marker.lng } });

      // CALL BACKEND TO START TRIP (Syncs with client)
      try {
        await axios.post(`${API_URL}/viajes/iniciar`, { viaje_id: currentViajeId });
        setPassengerPickedUp(true);
        setActiveTripClientLocation({ lat: marker.lat, lng: marker.lng });
      } catch (e) { console.error(e); }
    }
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
            {misReportes.length === 0 ? (
              <p className="text-muted text-center pt-5">No has realizado viajes aún.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="bg-light">
                    <tr>
                      <th>Fecha</th>
                      <th>Origen/Destino</th>
                      <th>Costo</th>
                      <th>Calif.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {misReportes.map(r => (
                      <tr key={r.id}>
                        <td><small>{new Date(r.fecha).toLocaleDateString()}</small><br /><small className='text-muted'>{new Date(r.fecha).toLocaleTimeString()}</small></td>
                        <td>
                          <div className="d-flex flex-column" style={{ fontSize: '0.85em' }}>
                            <span><strong>Desde:</strong> {r.origen}</span>
                            <span><strong>Hasta:</strong> {r.destino}</span>
                          </div>
                        </td>
                        <td className="fw-bold text-success">${r.costo}</td>
                        <td><span className="text-warning">★</span> {r.calificacion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <button className="btn btn-secondary mt-3" onClick={() => setViendoReportes(false)}>Volver al Mapa</button>
          </div>
        ) : (
          currentViajeId ? (
            <div className="text-center py-5 px-4 animate-fade-in">
              <div className="display-1 mb-4">🛺💨</div>
              <h2 className="fw-bold text-dark mb-3">Viaje en Curso</h2>
              <p className="text-muted lead mb-4">Llevando al cliente a su destino. Espera el pago para finalizar.</p>

              <div className="alert alert-info border-0 shadow-sm mb-4">
                <strong>Simula tu movimiento:</strong> Haz clic en el mapa para actualizar tu ubicación.
              </div>
              <MapComponent
                center={[myLocation.lat, myLocation.lng]}
                markers={[
                  { lat: myLocation.lat, lng: myLocation.lng, type: 'driver', popup: 'Tu (Conductor)' },
                  ...(activeTripClientLocation ? [{ lat: activeTripClientLocation.lat, lng: activeTripClientLocation.lng, type: 'client', popup: 'Pasajero' }] : [])
                ]}
                onLocationSelect={handleMapClick}
                onMarkerClick={handleMarkerClick}
                style={{ height: '300px' }}
              />

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

                  {/* PENDIENTES */}
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

                  {/* MAPA PREVIEW */}
                  <div className="mt-5">
                    <h6 className="text-muted fw-bold mb-3">RADAR DE SOLICITUDES</h6>
                    <p className="small text-muted">Solicitudes pendientes = Iconos de Usuario</p>
                    <MapComponent
                      center={[myLocation.lat, myLocation.lng]}
                      markers={[
                        { lat: myLocation.lat, lng: myLocation.lng, type: 'driver', popup: 'Tu Ubicación' },
                        // Filter pending trips that have coordinates
                        ...pendientes.filter(p => p.lat_origen && p.lng_origen).map(p => ({
                          lat: p.lat_origen, lng: p.lng_origen, type: 'client', popup: `Viaje: $${p.costo}`
                        }))
                      ]}
                      onLocationSelect={handleMapClick}
                      style={{ height: '400px' }}
                    />
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
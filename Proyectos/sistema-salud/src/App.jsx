import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import {
  Calendar, User, FileText, Settings, Phone, CheckCircle,
  AlertCircle, XCircle, MessageSquare, HeartPulse,
  LogOut, Shield, Search, Key, Plus, MapPin, Mail,
  Clock, Activity, ClipboardList, ChevronRight,
  PhoneCall, Send
} from 'lucide-react';

// ============================================================================
// FIREBASE CONFIG
// ============================================================================
const firebaseConfig = {
  apiKey: "AIzaSyD76GgWRwZ-1gYQYugmYAAExzy4m0aZQMc",
  authDomain: "sistema-de-salud-230c4.firebaseapp.com",
  projectId: "sistema-de-salud-230c4",
  storageBucket: "sistema-de-salud-230c4.firebasestorage.app",
  messagingSenderId: "900757994933",
  appId: "1:900757994933:web:04952852aea88767aaedfc",
  measurementId: "G-Q27Q402GH5"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const APP_ID = 'sistema-de-salud-230c4';

// ============================================================================
// CONSTANTES — edita estos datos cuando tengas el nombre definitivo
// ============================================================================
const NOMBRE_CLINICA = 'NOMBRE PENDIENTE';
const SLOGAN = 'Tu salud, nuestra prioridad';
const CONTACTO = {
  telefono: '+57 (XXX) XXX-XXXX',
  whatsapp: '+57XXXXXXXXXX',
  correo: 'contacto@ejemplo.com',
  direccion: 'Dirección del establecimiento, Ciudad',
  horario: 'Lunes a Viernes 7:00 AM – 6:00 PM'
};

const ESPECIALIDADES = [
  'Medicina General', 'Pediatría', 'Ginecología',
  'Odontología', 'Psicología', 'Nutrición', 'Cardiología'
];
const HORARIOS_DISPONIBLES = [
  '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
  '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
];

const getHorasDisponibles = (date, specialty, all, currentId = null) => {
  if (!date || !specialty) return [];
  const ocupadas = all.filter(c =>
    c.status !== 'Cancelada' && c.date === date &&
    c.specialty === specialty && c.id !== currentId
  ).map(c => c.time);
  return HORARIOS_DISPONIBLES.filter(h => !ocupadas.includes(h));
};

// ============================================================================
// ESTILOS GLOBALES
// ============================================================================
const G = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
  :root {
    --p: #1a4b8c; --pd: #0f2d5c; --pl: #2563b0;
    --acc: #e8f0fb; --acc2: #3b82f6;
    --w: #ffffff; --g50: #f8fafd; --g100: #eef2f9;
    --g200: #dde6f5; --g500: #64748b; --g700: #334155; --g900: #0f172a;
    --ok: #059669; --err: #dc2626;
    --sh: 0 1px 3px rgba(26,75,140,.08),0 1px 2px rgba(26,75,140,.06);
    --shm: 0 4px 20px rgba(26,75,140,.12),0 2px 8px rgba(26,75,140,.08);
    --r: 12px; --rl: 20px;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'DM Sans',sans-serif;background:var(--g50);color:var(--g900)}
  .df{font-family:'Playfair Display',serif}
  .card{background:var(--w);border-radius:var(--rl);box-shadow:var(--sh);border:1px solid var(--g100)}
  .fi{width:100%;padding:11px 14px;border:1.5px solid var(--g200);border-radius:var(--r);font-family:'DM Sans',sans-serif;font-size:15px;color:var(--g900);background:var(--w);transition:border-color .2s,box-shadow .2s;outline:none}
  .fi:focus{border-color:var(--pl);box-shadow:0 0 0 3px rgba(59,130,246,.12)}
  .fi::placeholder{color:#94a3b8}
  .fl{display:block;font-size:13px;font-weight:600;color:var(--g700);margin-bottom:6px;letter-spacing:.02em;text-transform:uppercase}
  .bp{background:var(--p);color:#fff;border:none;border-radius:var(--r);padding:12px 28px;font-family:'DM Sans',sans-serif;font-weight:600;font-size:15px;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;gap:8px}
  .bp:hover{background:var(--pl);transform:translateY(-1px);box-shadow:var(--shm)}
  .bp:disabled{background:#94a3b8;cursor:not-allowed;transform:none;box-shadow:none}
  .bs{background:var(--acc);color:var(--p);border:1.5px solid var(--g200);border-radius:var(--r);padding:12px 28px;font-family:'DM Sans',sans-serif;font-weight:600;font-size:15px;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;gap:8px}
  .bs:hover{background:var(--g200)}
  .badge{display:inline-flex;align-items:center;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:600}
  .bg{background:#dcfce7;color:#166534}
  .br{background:#fee2e2;color:#991b1b}
  .bb{background:#dbeafe;color:#1e40af}
  .div{height:1px;background:var(--g100);margin:24px 0}
  @keyframes fi{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  .ai{animation:fi .35s ease forwards}
  @keyframes su{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
  .su{animation:su .4s ease forwards}
  ::-webkit-scrollbar{width:6px}
  ::-webkit-scrollbar-track{background:var(--g100)}
  ::-webkit-scrollbar-thumb{background:var(--g200);border-radius:3px}
`;

// ============================================================================
// APP PRINCIPAL
// ============================================================================
export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home');
  const [isAdmin, setIsAdmin] = useState(null);
  const [hasConsent, setHasConsent] = useState(false);
  const [pendingView, setPendingView] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [pqrsList, setPqrsList] = useState([]);
  const [adminsList, setAdminsList] = useState([]);
  const [toast, setToast] = useState(null);
  const [loadingApp, setLoadingApp] = useState(true);

  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    const unsub = onAuthStateChanged(auth, u => { setUser(u); setLoadingApp(false); });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const base = col => collection(db, 'artifacts', APP_ID, 'public', 'data', col);
    const u1 = onSnapshot(base('appointments'), snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.createdAt?.toDate() || 0) - new Date(a.createdAt?.toDate() || 0));
      setAppointments(list);
    });
    const u2 = onSnapshot(base('pqrs'), snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.createdAt?.toDate() || 0) - new Date(a.createdAt?.toDate() || 0));
      setPqrsList(list);
    });
    const u3 = onSnapshot(base('admins'), snap => setAdminsList(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { u1(); u2(); u3(); };
  }, [user]);

  const handleNavigate = target => {
    if ((target === 'agendar' || target === 'pqrs') && !hasConsent) setPendingView(target);
    else setView(target);
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  if (loadingApp) return (
    <>
      <style>{G}</style>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <HeartPulse style={{ width: 48, height: 48, color: 'var(--p)' }} />
      </div>
    </>
  );

  return (
    <>
      <style>{G}</style>
      <div style={{ minHeight: '100vh', background: 'var(--g50)', display: 'flex', flexDirection: 'column' }}>
        <Navbar view={view} isAdmin={isAdmin} onNavigate={handleNavigate} />

        <main style={{ flex: 1, maxWidth: 1180, margin: '0 auto', width: '100%', padding: '36px 20px' }}>
          {view === 'home'        && <HomeView onNavigate={handleNavigate} appointments={appointments} />}
          {view === 'agendar'     && <AgendarView appointments={appointments} showToast={showToast} onNavigate={handleNavigate} />}
          {view === 'pqrs'        && <PqrsView showToast={showToast} onNavigate={handleNavigate} />}
          {view === 'admin-login' && <AdminLoginView setIsAdmin={setIsAdmin} setView={setView} showToast={showToast} />}
          {view === 'admin' && isAdmin && (
            <AdminDashboard appointments={appointments} pqrsList={pqrsList} adminsList={adminsList}
              isAdmin={isAdmin} setIsAdmin={setIsAdmin} showToast={showToast} setView={setView} />
          )}
        </main>

        <Footer onNavigate={handleNavigate} />

        {/* Modal consentimiento */}
        {pendingView && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 50, backdropFilter: 'blur(4px)' }}>
            <div className="card su" style={{ maxWidth: 520, width: '100%', padding: 36 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 44, height: 44, background: 'var(--acc)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield style={{ color: 'var(--p)', width: 22, height: 22 }} />
                </div>
                <div>
                  <h3 className="df" style={{ fontSize: 20, color: 'var(--pd)' }}>Tratamiento de Datos</h3>
                  <p style={{ fontSize: 13, color: 'var(--g500)' }}>Ley 1581 de 2012 — Colombia</p>
                </div>
              </div>
              <div style={{ background: 'var(--g50)', padding: 16, borderRadius: 10, border: '1px solid var(--g200)', fontSize: 14, color: 'var(--g700)', maxHeight: 180, overflowY: 'auto', lineHeight: 1.6, marginBottom: 24 }}>
                <p style={{ marginBottom: 10 }}><strong>Autorización para el Tratamiento de Datos Personales</strong></p>
                <p style={{ marginBottom: 10 }}>Al hacer clic en "Aceptar", usted autoriza de manera previa, expresa e informada a <strong>{NOMBRE_CLINICA}</strong> para la recolección, almacenamiento, uso y tratamiento de sus datos personales, incluyendo datos sensibles, con la finalidad exclusiva de gestionar su agendamiento de citas médicas, historial clínico, PQRS y envío de notificaciones.</p>
                <p>Esta autorización se otorga en cumplimiento de las leyes aplicables de protección de datos. Usted tiene derecho a conocer, actualizar, rectificar y solicitar la eliminación de sus datos comunicándose directamente con la administración.</p>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="bs" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setPendingView(null)}>Rechazar</button>
                <button className="bp" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setHasConsent(true); setView(pendingView); setPendingView(null); }}>
                  <CheckCircle size={16} /> Aceptar y Continuar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 100, background: toast.type === 'error' ? 'var(--err)' : 'var(--ok)', color: '#fff', padding: '14px 20px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 32px rgba(0,0,0,.2)', fontWeight: 500, fontSize: 14 }}>
            {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
            {toast.message}
          </div>
        )}
      </div>
    </>
  );
}

// ============================================================================
// NAVBAR
// ============================================================================
function Navbar({ view, isAdmin, onNavigate }) {
  return (
    <nav style={{ background: 'var(--pd)', borderBottom: '1px solid rgba(255,255,255,.08)', position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 2px 20px rgba(15,45,92,.4)' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => onNavigate('home')}>
          <div style={{ width: 38, height: 38, background: 'rgba(255,255,255,.12)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,.15)' }}>
            <HeartPulse style={{ width: 22, height: 22, color: '#93c5fd' }} />
          </div>
          <div>
            <div className="df" style={{ fontWeight: 700, fontSize: 17, color: '#fff', lineHeight: 1.1 }}>{NOMBRE_CLINICA}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', letterSpacing: '.08em', textTransform: 'uppercase' }}>{SLOGAN}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[['home','Inicio',null],['agendar','Citas',<Calendar size={14}/>],['pqrs','PQRS',<FileText size={14}/>]].map(([k,l,ic]) => (
            <button key={k} onClick={() => onNavigate(k)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'DM Sans', fontWeight: 500, fontSize: 14, background: view === k ? 'rgba(255,255,255,.12)' : 'transparent', color: view === k ? '#fff' : 'rgba(255,255,255,.65)', transition: 'all .2s' }}>
              {ic}{l}
            </button>
          ))}
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,.15)', margin: '0 8px' }} />
          <button onClick={() => onNavigate(isAdmin ? 'admin' : 'admin-login')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,.2)', cursor: 'pointer', fontFamily: 'DM Sans', fontWeight: 500, fontSize: 14, background: (view === 'admin' || view === 'admin-login') ? 'rgba(255,255,255,.12)' : 'transparent', color: 'rgba(255,255,255,.8)', transition: 'all .2s' }}>
            <Settings size={14} />{isAdmin ? 'Panel' : 'Admin'}
          </button>
        </div>
      </div>
    </nav>
  );
}

// ============================================================================
// HOME
// ============================================================================
function HomeView({ onNavigate, appointments }) {
  const stats = [
    { label: 'Especialidades', value: '7', icon: <Activity size={18}/> },
    { label: 'Citas Activas', value: appointments.filter(a => a.status !== 'Cancelada').length, icon: <Calendar size={18}/> },
    { label: 'Atención L–V', value: '7AM', icon: <Clock size={18}/> },
  ];

  return (
    <div className="ai">
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,var(--pd) 0%,var(--p) 60%,var(--pl) 100%)', borderRadius: 24, padding: 'clamp(32px,6vw,60px) clamp(24px,5vw,52px)', marginBottom: 36, position: 'relative', overflow: 'hidden', color: '#fff' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, background: 'rgba(255,255,255,.04)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -40, right: 80, width: 160, height: 160, background: 'rgba(255,255,255,.04)', borderRadius: '50%' }} />
        <div style={{ position: 'relative', maxWidth: 580 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.1)', borderRadius: 999, padding: '6px 16px', marginBottom: 20, fontSize: 13, fontWeight: 500, border: '1px solid rgba(255,255,255,.15)' }}>
            <HeartPulse size={13} style={{ color: '#93c5fd' }} /> Atención médica de calidad
          </div>
          <h1 className="df" style={{ fontSize: 'clamp(28px,4.5vw,46px)', fontWeight: 700, marginBottom: 16, lineHeight: 1.15 }}>
            Agenda tu cita médica<br />de forma rápida y segura
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.75)', marginBottom: 32, lineHeight: 1.65 }}>
            Accede a nuestros especialistas desde cualquier lugar. Sin filas, sin esperas innecesarias.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="bp" style={{ background: '#fff', color: 'var(--p)', padding: '13px 28px' }} onClick={() => onNavigate('agendar')}>
              <Calendar size={17} /> Agendar Cita
            </button>
            <button onClick={() => onNavigate('pqrs')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 12, border: '1.5px solid rgba(255,255,255,.3)', background: 'transparent', color: '#fff', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
              <FileText size={17} /> Radicar PQRS
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 36, flexWrap: 'wrap' }}>
          {stats.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.08)', borderRadius: 12, padding: '11px 18px', border: '1px solid rgba(255,255,255,.1)' }}>
              <div style={{ color: '#93c5fd' }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 19, fontWeight: 700 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cards servicios */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(270px,1fr))', gap: 18, marginBottom: 36 }}>
        {[
          { ic: <Calendar size={22} style={{ color: 'var(--p)' }}/>, title: 'Citas en Línea', desc: 'Agenda en segundos. Elige especialidad, fecha y hora disponible sin necesidad de llamar.', btn: 'Agendar ahora', fn: () => onNavigate('agendar') },
          { ic: <ClipboardList size={22} style={{ color: '#7c3aed' }}/>, title: 'PQRS', desc: 'Peticiones, quejas, reclamos y sugerencias. Tu voz es importante para mejorar nuestro servicio.', btn: 'Radicar PQRS', fn: () => onNavigate('pqrs') },
          { ic: <PhoneCall size={22} style={{ color: 'var(--ok)' }}/>, title: 'Contáctanos', desc: `Llámanos o escríbenos al WhatsApp. Horario: ${CONTACTO.horario}.`, btn: 'Ir a WhatsApp', fn: () => window.open(`https://wa.me/${CONTACTO.whatsapp}`) },
        ].map((c, i) => (
          <div key={i} className="card" style={{ padding: 26 }}>
            <div style={{ width: 50, height: 50, background: 'var(--g50)', borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, border: '1px solid var(--g100)' }}>{c.ic}</div>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{c.title}</h3>
            <p style={{ fontSize: 14, color: 'var(--g500)', lineHeight: 1.65, marginBottom: 20 }}>{c.desc}</p>
            <button className="bs" style={{ width: '100%', justifyContent: 'center', fontSize: 14 }} onClick={c.fn}>{c.btn} <ChevronRight size={14}/></button>
          </div>
        ))}
      </div>

      {/* Especialidades */}
      <div className="card" style={{ padding: 28 }}>
        <h2 className="df" style={{ fontSize: 24, color: 'var(--pd)', marginBottom: 6 }}>Nuestras Especialidades</h2>
        <p style={{ color: 'var(--g500)', fontSize: 14, marginBottom: 20 }}>Haz clic en una especialidad para agendar tu cita</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {ESPECIALIDADES.map(e => (
            <button key={e} onClick={() => onNavigate('agendar')} style={{ padding: '9px 18px', borderRadius: 999, border: '1.5px solid var(--g200)', background: 'var(--g50)', color: 'var(--p)', fontFamily: 'DM Sans', fontWeight: 500, fontSize: 14, cursor: 'pointer', transition: 'all .2s', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Activity size={12}/>{e}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// AGENDAR
// ============================================================================
function AgendarView({ appointments, showToast, onNavigate }) {
  const [form, setForm] = useState({ name: '', idNumber: '', email: '', phoneCode: '+57', phone: '', country: 'Colombia', address: '', specialty: '', date: '', time: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);

  const horas = useMemo(() => getHorasDisponibles(form.date, form.specialty, appointments), [form.date, form.specialty, appointments]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => { const n = { ...prev, [name]: value }; if (name === 'date' || name === 'specialty') n.time = ''; return n; });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.time) return showToast('Selecciona una hora disponible', 'error');
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'appointments'), { ...form, status: 'Agendada', createdAt: serverTimestamp() });
      const phone = `${form.phoneCode}${form.phone}`.replace(/\D/g, '');
      const msg = `Hola, soy ${form.name}. Agendé una cita de ${form.specialty} para el ${form.date} a las ${form.time} en ${NOMBRE_CLINICA}.`;
      setDone({ phone, msg, specialty: form.specialty, date: form.date, time: form.time });
    } catch { showToast('Error al agendar la cita', 'error'); }
    finally { setSubmitting(false); }
  };

  if (done) return (
    <div className="ai" style={{ maxWidth: 500, margin: '0 auto', paddingTop: 32, textAlign: 'center' }}>
      <div className="card" style={{ padding: 48 }}>
        <div style={{ width: 72, height: 72, background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckCircle style={{ width: 36, height: 36, color: 'var(--ok)' }} />
        </div>
        <h2 className="df" style={{ fontSize: 26, color: 'var(--pd)', marginBottom: 10 }}>¡Cita Agendada!</h2>
        <p style={{ color: 'var(--g500)', marginBottom: 28, fontSize: 15, lineHeight: 1.65 }}>
          Tu cita de <strong>{done.specialty}</strong> para el <strong>{done.date}</strong> a las <strong>{done.time}</strong> ha sido registrada exitosamente.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <a href={`https://wa.me/${done.phone}?text=${encodeURIComponent(done.msg)}`} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', background: '#22c55e', color: '#fff', borderRadius: 12, fontFamily: 'DM Sans', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>
            <MessageSquare size={18}/> Confirmar por WhatsApp
          </a>
          <button className="bs" style={{ width: '100%', justifyContent: 'center' }} onClick={() => onNavigate('home')}>
            Volver al Inicio
          </button>
        </div>
      </div>
    </div>
  );

  const hoy = new Date().toISOString().split('T')[0];

  return (
    <div className="ai" style={{ maxWidth: 860, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="df" style={{ fontSize: 28, color: 'var(--pd)' }}>Agendar Cita Médica</h1>
        <p style={{ color: 'var(--g500)', marginTop: 6, fontSize: 15 }}>Complete el formulario. Las horas ya reservadas no aparecerán disponibles.</p>
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ height: 4, background: 'linear-gradient(90deg,var(--p),var(--acc2))' }} />
        <form onSubmit={handleSubmit} style={{ padding: 36 }}>
          <SectionTitle icon={<User size={15} style={{ color: 'var(--p)' }}/>} title="Datos del Paciente" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 18, marginBottom: 24 }}>
            <FF label="Nombre Completo" name="name" value={form.name} onChange={handleChange} required placeholder="Ej. Juan García" />
            <FF label="Documento de Identidad" name="idNumber" value={form.idNumber} onChange={handleChange} required placeholder="Número de documento" />
            <FF label="Correo Electrónico" name="email" type="email" value={form.email} onChange={handleChange} required placeholder="correo@ejemplo.com" />
            <div>
              <label className="fl">Teléfono / WhatsApp *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select name="phoneCode" value={form.phoneCode} onChange={handleChange} className="fi" style={{ width: 110, flexShrink: 0 }}>
                  <option value="+57">🇨🇴 +57</option><option value="+52">🇲🇽 +52</option><option value="+34">🇪🇸 +34</option><option value="+1">🇺🇸 +1</option>
                </select>
                <input type="tel" name="phone" value={form.phone} onChange={handleChange} required placeholder="Número" className="fi" />
              </div>
            </div>
            <FF label="País" name="country" value={form.country} onChange={handleChange} required placeholder="Ej. Colombia" />
            <FF label="Dirección de Residencia" name="address" value={form.address} onChange={handleChange} required placeholder="Ej. Calle 10 #20-30, Ciudad" />
          </div>
          <div className="div" />
          <SectionTitle icon={<Calendar size={15} style={{ color: 'var(--p)' }}/>} title="Detalles de la Cita" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 18, marginBottom: 28 }}>
            <div>
              <label className="fl">Especialidad *</label>
              <select name="specialty" value={form.specialty} onChange={handleChange} required className="fi">
                <option value="">Seleccionar...</option>
                {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="fl">Fecha *</label>
              <input type="date" name="date" value={form.date} min={hoy} onChange={handleChange} required className="fi" />
            </div>
            <div>
              <label className="fl">Hora Disponible *</label>
              <select name="time" value={form.time} onChange={handleChange} required disabled={!form.date || !form.specialty} className="fi" style={{ opacity: (!form.date || !form.specialty) ? .5 : 1 }}>
                <option value="">Seleccionar hora...</option>
                {horas.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
              {form.date && form.specialty && horas.length === 0 && <p style={{ fontSize: 12, color: 'var(--err)', marginTop: 4 }}>No hay horas disponibles para esta fecha.</p>}
            </div>
          </div>
          <button type="submit" className="bp" disabled={submitting || !form.time} style={{ width: '100%', justifyContent: 'center', padding: 15, fontSize: 16 }}>
            {submitting ? 'Registrando...' : <><CheckCircle size={17}/> Confirmar y Agendar Cita</>}
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// PQRS
// ============================================================================
function PqrsView({ showToast, onNavigate }) {
  const [form, setForm] = useState({ type: 'Petición', name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'pqrs'), { ...form, status: 'Abierto', createdAt: serverTimestamp() });
      setDone(true);
    } catch { showToast('Error al enviar', 'error'); }
    finally { setSubmitting(false); }
  };

  if (done) return (
    <div className="ai" style={{ maxWidth: 500, margin: '0 auto', paddingTop: 32, textAlign: 'center' }}>
      <div className="card" style={{ padding: 48 }}>
        <div style={{ width: 72, height: 72, background: '#dbeafe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Send style={{ width: 32, height: 32, color: 'var(--p)' }} />
        </div>
        <h2 className="df" style={{ fontSize: 26, color: 'var(--pd)', marginBottom: 10 }}>¡PQRS Enviada!</h2>
        <p style={{ color: 'var(--g500)', marginBottom: 28, fontSize: 15, lineHeight: 1.65 }}>
          Tu <strong>{form.type.toLowerCase()}</strong> ha sido radicada exitosamente. Nos pondremos en contacto pronto.
        </p>
        <button className="bp" style={{ width: '100%', justifyContent: 'center' }} onClick={() => onNavigate('home')}>
          Volver al Inicio
        </button>
      </div>
    </div>
  );

  const tipos = ['Petición','Queja','Reclamo','Sugerencia'];
  const cols = { Petición:'#dbeafe', Queja:'#fee2e2', Reclamo:'#fef3c7', Sugerencia:'#dcfce7' };

  return (
    <div className="ai" style={{ maxWidth: 660, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="df" style={{ fontSize: 28, color: 'var(--pd)' }}>Radicar PQRS</h1>
        <p style={{ color: 'var(--g500)', marginTop: 6, fontSize: 15 }}>Tu opinión nos ayuda a mejorar el servicio.</p>
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ height: 4, background: 'linear-gradient(90deg,#7c3aed,#a78bfa)' }} />
        <form onSubmit={handleSubmit} style={{ padding: 36 }}>
          <div style={{ marginBottom: 22 }}>
            <label className="fl">Tipo de Solicitud *</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {tipos.map(t => (
                <button key={t} type="button" onClick={() => setForm({ ...form, type: t })} style={{ padding: '9px 18px', borderRadius: 999, border: form.type === t ? '2px solid var(--p)' : '1.5px solid var(--g200)', background: form.type === t ? cols[t] : '#fff', color: form.type === t ? 'var(--pd)' : 'var(--g500)', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all .2s' }}>{t}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
            <FF label="Nombre Completo" name="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Tu nombre" />
            <FF label="Correo de Contacto" name="email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="correo@ejemplo.com" />
          </div>
          <div style={{ marginBottom: 28 }}>
            <label className="fl">Descripción *</label>
            <textarea rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required placeholder="Describe detalladamente tu solicitud..."
              style={{ width: '100%', padding: '12px 14px', border: '1.5px solid var(--g200)', borderRadius: 12, fontFamily: 'DM Sans', fontSize: 15, color: 'var(--g900)', background: '#fff', resize: 'vertical', outline: 'none' }} />
          </div>
          <button type="submit" className="bp" disabled={submitting} style={{ width: '100%', justifyContent: 'center', padding: 15, fontSize: 16, background: '#7c3aed' }}>
            {submitting ? 'Enviando...' : <><Send size={17}/> Enviar Radicado</>}
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// ADMIN LOGIN
// ============================================================================
function AdminLoginView({ setIsAdmin, setView, showToast }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const c = await signInWithEmailAndPassword(auth, email, password);
      setIsAdmin({ id: c.user.uid, name: c.user.email, email: c.user.email });
      setView('admin');
      showToast(`Bienvenido, ${c.user.email}`);
    } catch { showToast('Correo o contraseña incorrectos', 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="ai" style={{ maxWidth: 420, margin: '40px auto 0' }}>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ background: 'var(--pd)', padding: '32px 36px 28px', textAlign: 'center' }}>
          <div style={{ width: 54, height: 54, background: 'rgba(255,255,255,.1)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', border: '1px solid rgba(255,255,255,.15)' }}>
            <Settings style={{ width: 26, height: 26, color: '#93c5fd' }} />
          </div>
          <h2 className="df" style={{ fontSize: 22, color: '#fff', marginBottom: 4 }}>Panel Administrativo</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.5)' }}>{NOMBRE_CLINICA}</p>
        </div>
        <form onSubmit={handleLogin} style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <FF label="Correo electrónico" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="admin@clinica.com" />
          <FF label="Contraseña" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
          <button type="submit" className="bp" disabled={loading} style={{ justifyContent: 'center', padding: 14, fontSize: 15 }}>
            {loading ? 'Verificando...' : 'Ingresar al Panel'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// ADMIN DASHBOARD
// ============================================================================
function AdminDashboard({ appointments, pqrsList, adminsList, isAdmin, setIsAdmin, showToast, setView }) {
  const [tab, setTab] = useState('citas');
  const [search, setSearch] = useState('');
  const [managingCita, setManagingCita] = useState(null);

  const filtered = appointments.filter(a =>
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.idNumber?.includes(search) ||
    a.specialty?.toLowerCase().includes(search.toLowerCase())
  );

  const handleLogout = async () => {
    try { await signOut(auth); await signInAnonymously(auth); } catch (e) { console.error(e); }
    setIsAdmin(null); setView('home');
  };

  const stats = [
    { l: 'Total Citas', v: appointments.length, bg: '#dbeafe', c: 'var(--p)' },
    { l: 'Activas', v: appointments.filter(a => a.status === 'Agendada').length, bg: '#dcfce7', c: '#166534' },
    { l: 'PQRS', v: pqrsList.length, bg: '#ede9fe', c: '#5b21b6' },
    { l: 'Canceladas', v: appointments.filter(a => a.status === 'Cancelada').length, bg: '#fee2e2', c: '#991b1b' },
  ];

  return (
    <div className="ai" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ background: 'linear-gradient(135deg,var(--pd),var(--p))', borderRadius: 20, padding: '22px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h2 className="df" style={{ fontSize: 22, color: '#fff', marginBottom: 3 }}>Panel de Administración</h2>
          <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 13 }}>Sesión: {isAdmin.email}</p>
        </div>
        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 10, padding: '10px 18px', color: '#fff', fontFamily: 'DM Sans', fontWeight: 500, fontSize: 14, cursor: 'pointer' }}>
          <LogOut size={15}/> Cerrar Sesión
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14 }}>
        {stats.map((s, i) => (
          <div key={i} className="card" style={{ padding: '18px 22px', background: s.bg, border: 'none' }}>
            <div className="df" style={{ fontSize: 30, fontWeight: 700, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 13, color: s.c, opacity: .8, fontWeight: 500 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ borderBottom: '2px solid var(--g100)', display: 'flex', gap: 2 }}>
        {[['citas',`Citas (${appointments.length})`],['pqrs',`PQRS (${pqrsList.length})`],['config','Configuración']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding: '11px 20px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 14, color: tab === k ? 'var(--p)' : 'var(--g500)', borderBottom: tab === k ? '2px solid var(--p)' : '2px solid transparent', marginBottom: -2, transition: 'all .2s' }}>{l}</button>
        ))}
      </div>

      <div className="card" style={{ padding: 26 }}>
        {tab === 'citas' && (
          <div>
            <div style={{ position: 'relative', maxWidth: 360, marginBottom: 18 }}>
              <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--g500)', width: 15, height: 15 }} />
              <input type="text" placeholder="Buscar paciente, documento, especialidad..." value={search} onChange={e => setSearch(e.target.value)} className="fi" style={{ paddingLeft: 36, fontSize: 14 }} />
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: 'var(--g50)' }}>
                    {['Paciente','Especialidad','Fecha / Hora','Estado','Acción'].map(h => (
                      <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--g500)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id} style={{ borderTop: '1px solid var(--g100)' }}>
                      <td style={{ padding: '13px 14px' }}>
                        <div style={{ fontWeight: 600 }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--g500)' }}>CC {c.idNumber} · {c.phoneCode} {c.phone}</div>
                      </td>
                      <td style={{ padding: '13px 14px', fontWeight: 500, color: 'var(--p)' }}>{c.specialty}</td>
                      <td style={{ padding: '13px 14px' }}>
                        <div style={{ fontWeight: 600 }}>{c.date}</div>
                        <div style={{ fontSize: 12, color: 'var(--g500)' }}>{c.time}</div>
                      </td>
                      <td style={{ padding: '13px 14px' }}>
                        <span className={`badge ${c.status === 'Cancelada' ? 'br' : c.status === 'Reagendada' ? 'bb' : 'bg'}`}>{c.status}</span>
                      </td>
                      <td style={{ padding: '13px 14px' }}>
                        {c.status !== 'Cancelada' && (
                          <button onClick={() => setManagingCita(c)} style={{ padding: '6px 13px', borderRadius: 8, border: '1.5px solid var(--g200)', background: '#fff', color: 'var(--g700)', fontFamily: 'DM Sans', fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>Gestionar</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && <tr><td colSpan={5} style={{ padding: 36, textAlign: 'center', color: 'var(--g500)' }}>No se encontraron citas.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'pqrs' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: 14 }}>
            {pqrsList.map(item => (
              <div key={item.id} style={{ border: '1.5px solid var(--g100)', borderRadius: 14, padding: 18, background: 'var(--g50)' }}>
                <span className="badge bb" style={{ marginBottom: 10 }}>{item.type}</span>
                <div style={{ fontWeight: 700, marginBottom: 3 }}>{item.name}</div>
                <div style={{ fontSize: 13, color: 'var(--p)', marginBottom: 10 }}>{item.email}</div>
                <p style={{ fontSize: 14, color: 'var(--g700)', lineHeight: 1.6, background: '#fff', padding: 12, borderRadius: 8, border: '1px solid var(--g100)' }}>{item.message}</p>
              </div>
            ))}
            {pqrsList.length === 0 && <p style={{ color: 'var(--g500)', gridColumn: '1/-1', textAlign: 'center', padding: 36 }}>No hay PQRS registradas.</p>}
          </div>
        )}

        {tab === 'config' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
            <div>
              <h3 style={{ fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}><Shield size={17} style={{ color: 'var(--ok)' }}/> Sesión Activa</h3>
              <div style={{ background: 'var(--g50)', borderRadius: 12, padding: 18, border: '1px solid var(--g100)', fontSize: 14 }}>
                <p style={{ marginBottom: 8 }}><strong>Correo:</strong> {isAdmin.email}</p>
                <p style={{ fontSize: 12, color: 'var(--g500)' }}><strong>UID:</strong> {isAdmin.id}</p>
              </div>
            </div>
            <div>
              <h3 style={{ fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}><Key size={17} style={{ color: 'var(--p)' }}/> Agregar Administrador</h3>
              <div style={{ background: '#eff6ff', borderRadius: 12, padding: 18, border: '1px solid #bfdbfe', fontSize: 14, color: 'var(--pd)', lineHeight: 1.7 }}>
                <p>Para agregar nuevos administradores:</p>
                <p style={{ marginTop: 8 }}><strong>Firebase Console → Authentication → Usuarios → Agregar usuario</strong></p>
              </div>
            </div>
          </div>
        )}
      </div>

      {managingCita && <GestionarCitaModal cita={managingCita} onClose={() => setManagingCita(null)} appointments={appointments} showToast={showToast} />}
    </div>
  );
}

// ============================================================================
// MODAL GESTIONAR CITA
// ============================================================================
function GestionarCitaModal({ cita, onClose, appointments, showToast }) {
  const [mode, setMode] = useState('menu');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [doneData, setDoneData] = useState(null);
  const horas = useMemo(() => getHorasDisponibles(newDate, cita.specialty, appointments, cita.id), [newDate, cita.specialty, appointments, cita.id]);

  const executeAction = async type => {
    try {
      const ref = doc(db, 'artifacts', APP_ID, 'public', 'data', 'appointments', cita.id);
      const phone = `${cita.phoneCode}${cita.phone}`.replace(/\D/g, '');
      let msg = '';
      if (type === 'cancel') {
        await updateDoc(ref, { status: 'Cancelada' });
        msg = `Hola ${cita.name}, su cita de ${cita.specialty} del ${cita.date} a las ${cita.time} ha sido CANCELADA. Contáctenos para más información.`;
      } else {
        await updateDoc(ref, { date: newDate, time: newTime, status: 'Reagendada' });
        msg = `Hola ${cita.name}, su cita de ${cita.specialty} ha sido REAGENDADA para el ${newDate} a las ${newTime}.`;
      }
      setDoneData({ link: `https://wa.me/${phone}?text=${encodeURIComponent(msg)}` });
      setMode('done');
      showToast(type === 'cancel' ? 'Cita cancelada' : 'Cita reagendada');
    } catch { showToast('Error al procesar', 'error'); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 60, backdropFilter: 'blur(4px)' }}>
      <div className="card su" style={{ width: '100%', maxWidth: 440, padding: 26 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 className="df" style={{ fontSize: 20, color: 'var(--pd)' }}>Gestionar Cita</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--g500)' }}><XCircle size={22}/></button>
        </div>
        <div style={{ background: 'var(--g50)', borderRadius: 12, padding: 14, border: '1px solid var(--g200)', marginBottom: 18, fontSize: 14, lineHeight: 1.7 }}>
          <p><strong>Paciente:</strong> {cita.name}</p>
          <p><strong>Especialidad:</strong> {cita.specialty}</p>
          <p><strong>Fecha actual:</strong> {cita.date} a las {cita.time}</p>
        </div>
        {mode === 'menu' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="bp" style={{ justifyContent: 'center' }} onClick={() => setMode('reschedule')}><Calendar size={15}/> Reagendar Cita</button>
            <button onClick={() => setMode('cancel')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 12, border: 'none', background: '#fee2e2', color: 'var(--err)', fontFamily: 'DM Sans', fontWeight: 600, cursor: 'pointer' }}>
              <XCircle size={15}/> Cancelar Cita
            </button>
          </div>
        )}
        {mode === 'cancel' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--g700)', marginBottom: 18, lineHeight: 1.6 }}>¿Confirmas que deseas cancelar esta cita? El cupo se liberará de inmediato.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="bs" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setMode('menu')}>Atrás</button>
              <button onClick={() => executeAction('cancel')} style={{ flex: 1, padding: 12, borderRadius: 12, border: 'none', background: 'var(--err)', color: '#fff', fontFamily: 'DM Sans', fontWeight: 700, cursor: 'pointer' }}>Sí, Cancelar</button>
            </div>
          </div>
        )}
        {mode === 'reschedule' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="fl">Nueva Fecha</label>
              <input type="date" min={new Date().toISOString().split('T')[0]} value={newDate} onChange={e => setNewDate(e.target.value)} className="fi" />
            </div>
            <div>
              <label className="fl">Nueva Hora</label>
              <select value={newTime} onChange={e => setNewTime(e.target.value)} disabled={!newDate} className="fi">
                <option value="">Seleccionar...</option>
                {horas.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="bs" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setMode('menu')}>Atrás</button>
              <button className="bp" style={{ flex: 1, justifyContent: 'center' }} disabled={!newDate || !newTime} onClick={() => executeAction('reschedule')}>Guardar</button>
            </div>
          </div>
        )}
        {mode === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <CheckCircle style={{ width: 42, height: 42, color: 'var(--ok)', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--g700)', marginBottom: 18, fontSize: 14 }}>Actualización guardada. Notifica al paciente por WhatsApp:</p>
            <a href={doneData.link} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 13, background: '#22c55e', color: '#fff', borderRadius: 12, fontFamily: 'DM Sans', fontWeight: 600, textDecoration: 'none', marginBottom: 10 }}>
              <MessageSquare size={15}/> Notificar por WhatsApp
            </a>
            <button className="bs" style={{ width: '100%', justifyContent: 'center' }} onClick={onClose}>Cerrar</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// FOOTER
// ============================================================================
function Footer({ onNavigate }) {
  return (
    <footer style={{ background: 'var(--pd)', color: 'rgba(255,255,255,.65)', marginTop: 60 }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '44px 20px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 36 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <HeartPulse style={{ width: 20, height: 20, color: '#93c5fd' }} />
            <span className="df" style={{ fontSize: 17, color: '#fff', fontWeight: 700 }}>{NOMBRE_CLINICA}</span>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.7, maxWidth: 240 }}>Comprometidos con tu salud y bienestar. Atención médica de calidad al alcance de todos.</p>
        </div>
        <div>
          <h4 style={{ color: '#fff', fontWeight: 600, marginBottom: 14, fontSize: 14 }}>Contacto</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: 14 }}>
            {[
              [<Phone size={13} style={{ color: '#93c5fd', flexShrink: 0 }}/>, CONTACTO.telefono, `tel:${CONTACTO.telefono}`],
              [<MessageSquare size={13} style={{ color: '#86efac', flexShrink: 0 }}/>, 'WhatsApp', `https://wa.me/${CONTACTO.whatsapp}`],
              [<Mail size={13} style={{ color: '#93c5fd', flexShrink: 0 }}/>, CONTACTO.correo, `mailto:${CONTACTO.correo}`],
            ].map(([ic, label, href], i) => (
              <a key={i} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,.7)', textDecoration: 'none' }}>{ic}{label}</a>
            ))}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <MapPin size={13} style={{ color: '#93c5fd', flexShrink: 0, marginTop: 2 }} />{CONTACTO.direccion}
            </div>
          </div>
        </div>
        <div>
          <h4 style={{ color: '#fff', fontWeight: 600, marginBottom: 14, fontSize: 14 }}>Horario</h4>
          <div style={{ fontSize: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={13} style={{ color: '#93c5fd' }}/>{CONTACTO.horario}</div>
            <p style={{ fontSize: 13, marginTop: 6, lineHeight: 1.65 }}>Las citas pueden agendarse en línea las 24 horas del día.</p>
          </div>
        </div>
        <div>
          <h4 style={{ color: '#fff', fontWeight: 600, marginBottom: 14, fontSize: 14 }}>Servicios</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: 14 }}>
            {[['Agendar Cita','agendar'],['Radicar PQRS','pqrs'],['Inicio','home']].map(([l,k]) => (
              <button key={k} onClick={() => onNavigate(k)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.7)', fontFamily: 'DM Sans', fontSize: 14, cursor: 'pointer', textAlign: 'left', padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ChevronRight size={12} style={{ color: '#93c5fd' }}/>{l}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', padding: '14px 20px', textAlign: 'center', fontSize: 13 }}>
        © {new Date().getFullYear()} {NOMBRE_CLINICA} · Todos los derechos reservados
      </div>
    </footer>
  );
}

// ============================================================================
// UTILIDADES
// ============================================================================
function FF({ label, name, value, onChange, type = 'text', required, placeholder }) {
  return (
    <div>
      <label className="fl">{label}{required && <span style={{ color: 'var(--err)' }}> *</span>}</label>
      <input type={type} name={name} value={value} onChange={onChange} required={required} placeholder={placeholder} className="fi" />
    </div>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <div style={{ width: 30, height: 30, background: 'var(--acc)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--g900)' }}>{title}</h3>
    </div>
  );
}
import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import {
  Calendar, User, FileText, Settings, Phone, CheckCircle,
  AlertCircle, XCircle, MessageSquare, HeartPulse,
  LogOut, Shield, Search, Key, MapPin, Mail,
  Clock, Activity, ClipboardList, ChevronRight,
  PhoneCall, Send, Link, Trash2, Download, FolderOpen,
  Plus, Lock, Globe, ExternalLink
} from 'lucide-react';

// ============================================================================
// FIREBASE CONFIG — hospital-ciudadano
// ============================================================================
const firebaseConfig = {
  apiKey: "AIzaSyDX52J0lHUUMZRtmH7ERcV917AbiMCr8Nk",
  authDomain: "hospital-ciudadano.firebaseapp.com",
  projectId: "hospital-ciudadano",
  storageBucket: "hospital-ciudadano.firebasestorage.app",
  messagingSenderId: "166676914730",
  appId: "1:166676914730:web:9cb7a6e4fd47aae8299953",
  measurementId: "G-MHR7JLV1GP"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const APP_ID = 'hospital-ciudadano';

// ============================================================================
// CONSTANTES
// ============================================================================
const NOMBRE_CLINICA = 'NOMBRE PENDIENTE';
const SLOGAN = 'Tu salud, nuestra prioridad';
const CONTACTO = {
  telefono: '+57 (XXX) XXX-XXXX',
  whatsapp: '57XXXXXXXXXX',
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

const colRef = col => collection(db, 'artifacts', APP_ID, 'public', 'data', col);

// ============================================================================
// ESTILOS GLOBALES
// ============================================================================
const G = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
  :root {
    --p:#1a4b8c;--pd:#0f2d5c;--pl:#2563b0;
    --acc:#e8f0fb;--acc2:#3b82f6;
    --w:#fff;--g50:#f8fafd;--g100:#eef2f9;--g200:#dde6f5;
    --g500:#64748b;--g700:#334155;--g900:#0f172a;
    --ok:#059669;--err:#dc2626;
    --sh:0 1px 3px rgba(26,75,140,.08),0 1px 2px rgba(26,75,140,.06);
    --shm:0 4px 20px rgba(26,75,140,.12),0 2px 8px rgba(26,75,140,.08);
    --r:12px;--rl:20px;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  html{-webkit-text-size-adjust:100%}
  body{font-family:'DM Sans',sans-serif;background:var(--g50);color:var(--g900);overflow-x:hidden}
  .df{font-family:'Playfair Display',serif}
  .card{background:var(--w);border-radius:var(--rl);box-shadow:var(--sh);border:1px solid var(--g100)}
  .fi{width:100%;padding:11px 14px;border:1.5px solid var(--g200);border-radius:var(--r);font-family:'DM Sans',sans-serif;font-size:16px;color:var(--g900);background:var(--w);transition:border-color .2s,box-shadow .2s;outline:none;-webkit-appearance:none}
  .fi:focus{border-color:var(--pl);box-shadow:0 0 0 3px rgba(59,130,246,.12)}
  .fi::placeholder{color:#94a3b8}
  .fl{display:block;font-size:13px;font-weight:600;color:var(--g700);margin-bottom:6px;letter-spacing:.02em;text-transform:uppercase}
  .bp{background:var(--p);color:#fff;border:none;border-radius:var(--r);padding:12px 28px;font-family:'DM Sans',sans-serif;font-weight:600;font-size:15px;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;gap:8px;-webkit-tap-highlight-color:transparent}
  .bp:hover{background:var(--pl);transform:translateY(-1px);box-shadow:var(--shm)}
  .bp:disabled{background:#94a3b8;cursor:not-allowed;transform:none;box-shadow:none}
  .bs{background:var(--acc);color:var(--p);border:1.5px solid var(--g200);border-radius:var(--r);padding:12px 28px;font-family:'DM Sans',sans-serif;font-weight:600;font-size:15px;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;gap:8px}
  .bs:hover{background:var(--g200)}
  .badge{display:inline-flex;align-items:center;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:600}
  .bg{background:#dcfce7;color:#166534}
  .br{background:#fee2e2;color:#991b1b}
  .bb{background:#dbeafe;color:#1e40af}
  .by{background:#fef3c7;color:#92400e}
  .div{height:1px;background:var(--g100);margin:24px 0}
  @keyframes fi{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  .ai{animation:fi .35s ease forwards}
  @keyframes su{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
  .su{animation:su .4s ease forwards}
  .nav-label{display:inline}
  @media(max-width:600px){
    .nav-label{display:none}
    .nav-btn{padding:8px 10px !important}
    .form-grid{grid-template-columns:1fr !important}
    .full-mob{width:100% !important}
    .hide-mob{display:none !important}
    .stack-mob{flex-direction:column !important}
  }
  @media(max-width:700px){
    .admin-table thead{display:none}
    .admin-table tr{display:block;background:var(--w);border:1px solid var(--g200);border-radius:14px;margin-bottom:12px;padding:14px}
    .admin-table td{display:flex;justify-content:space-between;align-items:center;padding:6px 0 !important;border:none !important;font-size:14px}
    .admin-table td:before{content:attr(data-label);font-weight:600;color:var(--g500);font-size:12px;text-transform:uppercase;margin-right:8px;flex-shrink:0}
  }
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
  const [docsList, setDocsList] = useState([]);
  const [toast, setToast] = useState(null);
  const [loadingApp, setLoadingApp] = useState(true);

  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    const unsub = onAuthStateChanged(auth, u => { setUser(u); setLoadingApp(false); });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const u1 = onSnapshot(colRef('appointments'), snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.createdAt?.toDate() || 0) - new Date(a.createdAt?.toDate() || 0));
      setAppointments(list);
    });
    const u2 = onSnapshot(colRef('pqrs'), snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.createdAt?.toDate() || 0) - new Date(a.createdAt?.toDate() || 0));
      setPqrsList(list);
    });
    const u3 = onSnapshot(colRef('documentos'), snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.createdAt?.toDate() || 0) - new Date(a.createdAt?.toDate() || 0));
      setDocsList(list);
    });
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
        <main style={{ flex: 1, maxWidth: 1180, margin: '0 auto', width: '100%', padding: '32px 16px' }}>
          {view === 'home'        && <HomeView onNavigate={handleNavigate} appointments={appointments} />}
          {view === 'canal'       && <CanalView onNavigate={handleNavigate} />}
          {view === 'agendar'     && <AgendarView appointments={appointments} showToast={showToast} onNavigate={handleNavigate} />}
          {view === 'pqrs'        && <PqrsView showToast={showToast} onNavigate={handleNavigate} />}
          {view === 'admin-login' && <AdminLoginView setIsAdmin={setIsAdmin} setView={setView} showToast={showToast} />}
          {view === 'admin' && isAdmin && (
            <AdminDashboard
              appointments={appointments} pqrsList={pqrsList} docsList={docsList}
              isAdmin={isAdmin} setIsAdmin={setIsAdmin} showToast={showToast} setView={setView}
            />
          )}
        </main>
        <Footer onNavigate={handleNavigate} />

        {/* Modal Consentimiento */}
        {pendingView && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 50, backdropFilter: 'blur(4px)' }}>
            <div className="card su" style={{ maxWidth: 520, width: '100%', padding: 32 }}>
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
              <div style={{ display: 'flex', gap: 12 }} className="stack-mob">
                <button className="bs full-mob" style={{ justifyContent: 'center' }} onClick={() => setPendingView(null)}>Rechazar</button>
                <button className="bp full-mob" style={{ justifyContent: 'center' }} onClick={() => { setHasConsent(true); setView(pendingView); setPendingView(null); }}>
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
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => onNavigate('home')}>
          <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,.12)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HeartPulse style={{ width: 20, height: 20, color: '#93c5fd' }} />
          </div>
          <div>
            <div className="df" style={{ fontWeight: 700, fontSize: 16, color: '#fff', lineHeight: 1.1 }}>{NOMBRE_CLINICA}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,.5)', letterSpacing: '.08em', textTransform: 'uppercase' }}>{SLOGAN}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {[['home','Inicio',<HeartPulse size={15}/>],['canal','Citas',<Calendar size={15}/>],['pqrs','PQRS',<FileText size={15}/>]].map(([k,l,ic]) => (
            <button key={k} onClick={() => onNavigate(k)} className="nav-btn" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'DM Sans', fontWeight: 500, fontSize: 14, background: (view === k || (k === 'canal' && view === 'agendar')) ? 'rgba(255,255,255,.12)' : 'transparent', color: (view === k || (k === 'canal' && view === 'agendar')) ? '#fff' : 'rgba(255,255,255,.65)', transition: 'all .2s' }}>
              {ic}<span className="nav-label">{l}</span>
            </button>
          ))}
          <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,.15)', margin: '0 4px' }} />
          <button onClick={() => onNavigate(isAdmin ? 'admin' : 'admin-login')} className="nav-btn" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,.2)', cursor: 'pointer', fontFamily: 'DM Sans', fontWeight: 500, fontSize: 14, background: (view === 'admin' || view === 'admin-login') ? 'rgba(255,255,255,.12)' : 'transparent', color: 'rgba(255,255,255,.8)' }}>
            <Settings size={15} /><span className="nav-label">{isAdmin ? 'Panel' : 'Admin'}</span>
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
      <div style={{ background: 'linear-gradient(135deg,var(--pd) 0%,var(--p) 60%,var(--pl) 100%)', borderRadius: 20, padding: 'clamp(24px,5vw,56px) clamp(20px,5vw,52px)', marginBottom: 28, position: 'relative', overflow: 'hidden', color: '#fff' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 260, height: 260, background: 'rgba(255,255,255,.04)', borderRadius: '50%' }} />
        <div style={{ position: 'relative', maxWidth: 580 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.1)', borderRadius: 999, padding: '6px 16px', marginBottom: 18, fontSize: 13, fontWeight: 500, border: '1px solid rgba(255,255,255,.15)' }}>
            <HeartPulse size={13} style={{ color: '#93c5fd' }} /> Atención médica de calidad
          </div>
          <h1 className="df" style={{ fontSize: 'clamp(26px,4.5vw,44px)', fontWeight: 700, marginBottom: 14, lineHeight: 1.15 }}>
            Agenda tu cita médica<br />de forma rápida y segura
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.75)', marginBottom: 28, lineHeight: 1.65 }}>
            Accede a nuestros especialistas desde cualquier lugar. Sin filas, sin esperas.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="bp full-mob" style={{ background: '#fff', color: 'var(--p)', padding: '13px 28px', justifyContent: 'center' }} onClick={() => onNavigate('canal')}>
              <Calendar size={17} /> Agendar Cita
            </button>
            <button onClick={() => onNavigate('pqrs')} className="full-mob" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 28px', borderRadius: 12, border: '1.5px solid rgba(255,255,255,.3)', background: 'transparent', color: '#fff', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
              <FileText size={17} /> Radicar PQRS
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 32, flexWrap: 'wrap' }}>
          {stats.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.08)', borderRadius: 12, padding: '10px 16px', border: '1px solid rgba(255,255,255,.1)' }}>
              <div style={{ color: '#93c5fd' }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { ic: <Calendar size={22} style={{ color: 'var(--p)' }}/>, title: 'Citas en Línea', desc: 'Agenda en segundos por WhatsApp, teléfono o directamente desde aquí.', btn: 'Agendar ahora', fn: () => onNavigate('canal') },
          { ic: <ClipboardList size={22} style={{ color: '#7c3aed' }}/>, title: 'PQRS', desc: 'Peticiones, quejas, reclamos y sugerencias. Tu voz es importante.', btn: 'Radicar PQRS', fn: () => onNavigate('pqrs') },
          { ic: <PhoneCall size={22} style={{ color: 'var(--ok)' }}/>, title: 'Contáctanos', desc: `Llámanos o escríbenos. Horario: ${CONTACTO.horario}.`, btn: 'Ir a WhatsApp', fn: () => window.open(`https://wa.me/${CONTACTO.whatsapp}`) },
        ].map((c, i) => (
          <div key={i} className="card" style={{ padding: 24 }}>
            <div style={{ width: 48, height: 48, background: 'var(--g50)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, border: '1px solid var(--g100)' }}>{c.ic}</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{c.title}</h3>
            <p style={{ fontSize: 14, color: 'var(--g500)', lineHeight: 1.65, marginBottom: 18 }}>{c.desc}</p>
            <button className="bs" style={{ width: '100%', justifyContent: 'center', fontSize: 14 }} onClick={c.fn}>{c.btn} <ChevronRight size={14}/></button>
          </div>
        ))}
      </div>

      {/* Especialidades */}
      <div className="card" style={{ padding: 26 }}>
        <h2 className="df" style={{ fontSize: 22, color: 'var(--pd)', marginBottom: 6 }}>Nuestras Especialidades</h2>
        <p style={{ color: 'var(--g500)', fontSize: 14, marginBottom: 18 }}>Haz clic para agendar tu cita</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {ESPECIALIDADES.map(e => (
            <button key={e} onClick={() => onNavigate('canal')} style={{ padding: '9px 16px', borderRadius: 999, border: '1.5px solid var(--g200)', background: 'var(--g50)', color: 'var(--p)', fontFamily: 'DM Sans', fontWeight: 500, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Activity size={12}/>{e}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CANAL VIEW — selección de canal de agendamiento
// ============================================================================
function CanalView({ onNavigate }) {
  const canales = [
    {
      icon: <MessageSquare size={32} style={{ color: '#16a34a' }} />,
      titulo: 'WhatsApp',
      desc: 'Envía un mensaje a nuestro número de WhatsApp y un asesor te ayudará a agendar tu cita.',
      color: '#f0fdf4',
      border: '#86efac',
      btnColor: '#16a34a',
      btnLabel: 'Abrir WhatsApp',
      accion: () => window.open(`https://wa.me/${CONTACTO.whatsapp}?text=${encodeURIComponent('Hola, deseo agendar una cita médica.')}`),
      disponible: true,
    },
    {
      icon: <Phone size={32} style={{ color: '#2563b0' }} />,
      titulo: 'Línea Telefónica',
      desc: `Llámanos al ${CONTACTO.telefono} en horario ${CONTACTO.horario} y con gusto te atendemos.`,
      color: '#eff6ff',
      border: '#bfdbfe',
      btnColor: '#94a3b8',
      btnLabel: CONTACTO.telefono,
      accion: null,
      disponible: false,
    },
    {
      icon: <Globe size={32} style={{ color: 'var(--p)' }} />,
      titulo: 'Página Web',
      desc: 'Agenda tu cita directamente aquí, selecciona especialidad, fecha y hora disponible.',
      color: 'var(--acc)',
      border: '#93c5fd',
      btnColor: 'var(--p)',
      btnLabel: 'Agendar en línea',
      accion: () => onNavigate('agendar'),
      disponible: true,
    },
  ];

  return (
    <div className="ai" style={{ maxWidth: 780, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 className="df" style={{ fontSize: 'clamp(24px,4vw,34px)', color: 'var(--pd)', marginBottom: 10 }}>¿Cómo deseas agendar tu cita?</h1>
        <p style={{ color: 'var(--g500)', fontSize: 15 }}>Elige el canal de atención que más te convenga</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 18 }}>
        {canales.map((c, i) => (
          <div key={i} style={{ background: c.color, border: `2px solid ${c.border}`, borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14 }}>
            <div style={{ width: 68, height: 68, background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,.08)' }}>
              {c.icon}
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--g900)' }}>{c.titulo}</h3>
              <p style={{ fontSize: 14, color: 'var(--g500)', lineHeight: 1.65 }}>{c.desc}</p>
            </div>
            {c.disponible ? (
              <button onClick={c.accion} style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: c.btnColor, color: '#fff', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {c.btnLabel}
              </button>
            ) : (
              <div style={{ width: '100%', padding: '12px', borderRadius: 12, background: '#e2e8f0', color: 'var(--g500)', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 14, textAlign: 'center', marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Lock size={14}/> Solo informativo
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <button className="bs" onClick={() => onNavigate('home')} style={{ fontSize: 14 }}>
          ← Volver al inicio
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// AGENDAR VIEW
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
      await addDoc(colRef('appointments'), { ...form, status: 'Agendada', origen: 'web', createdAt: serverTimestamp() });
      const phone = `${form.phoneCode}${form.phone}`.replace(/\D/g, '');
      const msg = `Hola, soy ${form.name}. Agendé una cita de ${form.specialty} para el ${form.date} a las ${form.time} en ${NOMBRE_CLINICA}.`;
      setDone({ phone, msg, specialty: form.specialty, date: form.date, time: form.time });
    } catch { showToast('Error al agendar la cita', 'error'); }
    finally { setSubmitting(false); }
  };

  if (done) return (
    <div className="ai" style={{ maxWidth: 500, margin: '0 auto', paddingTop: 32, textAlign: 'center' }}>
      <div className="card" style={{ padding: 44 }}>
        <div style={{ width: 70, height: 70, background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
          <CheckCircle style={{ width: 34, height: 34, color: 'var(--ok)' }} />
        </div>
        <h2 className="df" style={{ fontSize: 24, color: 'var(--pd)', marginBottom: 10 }}>¡Cita Agendada!</h2>
        <p style={{ color: 'var(--g500)', marginBottom: 24, fontSize: 15, lineHeight: 1.65 }}>
          Tu cita de <strong>{done.specialty}</strong> para el <strong>{done.date}</strong> a las <strong>{done.time}</strong> fue registrada.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <a href={`https://wa.me/${done.phone}?text=${encodeURIComponent(done.msg)}`} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', background: '#22c55e', color: '#fff', borderRadius: 12, fontFamily: 'DM Sans', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>
            <MessageSquare size={17}/> Confirmar por WhatsApp
          </a>
          <button className="bs" style={{ width: '100%', justifyContent: 'center' }} onClick={() => onNavigate('home')}>Volver al Inicio</button>
        </div>
      </div>
    </div>
  );

  const hoy = new Date().toISOString().split('T')[0];
  return (
    <div className="ai" style={{ maxWidth: 860, margin: '0 auto' }}>
      <div style={{ marginBottom: 22 }}>
        <h1 className="df" style={{ fontSize: 26, color: 'var(--pd)' }}>Agendar Cita Médica</h1>
        <p style={{ color: 'var(--g500)', marginTop: 6, fontSize: 15 }}>Las horas ya reservadas no aparecerán disponibles.</p>
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ height: 4, background: 'linear-gradient(90deg,var(--p),var(--acc2))' }} />
        <div style={{ padding: 'clamp(20px,4vw,36px)' }}>
          <form onSubmit={handleSubmit}>
            <ST icon={<User size={15} style={{ color: 'var(--p)' }}/>} title="Datos del Paciente" />
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 16, marginBottom: 22 }}>
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
            <ST icon={<Calendar size={15} style={{ color: 'var(--p)' }}/>} title="Detalles de la Cita" />
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 16, marginBottom: 26 }}>
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
            <button type="submit" className="bp" disabled={submitting || !form.time} style={{ width: '100%', justifyContent: 'center', padding: 14, fontSize: 16 }}>
              {submitting ? 'Registrando...' : <><CheckCircle size={17}/> Confirmar y Agendar Cita</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PQRS VIEW
// ============================================================================
function PqrsView({ showToast, onNavigate }) {
  const [form, setForm] = useState({ type: 'Petición', name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(colRef('pqrs'), { ...form, status: 'Abierto', createdAt: serverTimestamp() });
      setDone(true);
    } catch { showToast('Error al enviar', 'error'); }
    finally { setSubmitting(false); }
  };

  if (done) return (
    <div className="ai" style={{ maxWidth: 500, margin: '0 auto', paddingTop: 32, textAlign: 'center' }}>
      <div className="card" style={{ padding: 44 }}>
        <div style={{ width: 70, height: 70, background: '#dbeafe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
          <Send style={{ width: 30, height: 30, color: 'var(--p)' }} />
        </div>
        <h2 className="df" style={{ fontSize: 24, color: 'var(--pd)', marginBottom: 10 }}>¡PQRS Enviada!</h2>
        <p style={{ color: 'var(--g500)', marginBottom: 24, fontSize: 15, lineHeight: 1.65 }}>Tu <strong>{form.type.toLowerCase()}</strong> ha sido radicada. Nos pondremos en contacto pronto.</p>
        <button className="bp" style={{ width: '100%', justifyContent: 'center' }} onClick={() => onNavigate('home')}>Volver al Inicio</button>
      </div>
    </div>
  );

  const tipos = ['Petición','Queja','Reclamo','Sugerencia'];
  const cols = { Petición:'#dbeafe', Queja:'#fee2e2', Reclamo:'#fef3c7', Sugerencia:'#dcfce7' };
  return (
    <div className="ai" style={{ maxWidth: 660, margin: '0 auto' }}>
      <div style={{ marginBottom: 22 }}>
        <h1 className="df" style={{ fontSize: 26, color: 'var(--pd)' }}>Radicar PQRS</h1>
        <p style={{ color: 'var(--g500)', marginTop: 6, fontSize: 15 }}>Tu opinión nos ayuda a mejorar el servicio.</p>
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ height: 4, background: 'linear-gradient(90deg,#7c3aed,#a78bfa)' }} />
        <form onSubmit={handleSubmit} style={{ padding: 'clamp(20px,4vw,32px)' }}>
          <div style={{ marginBottom: 20 }}>
            <label className="fl">Tipo de Solicitud *</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {tipos.map(t => (
                <button key={t} type="button" onClick={() => setForm({ ...form, type: t })} style={{ padding: '8px 16px', borderRadius: 999, border: form.type === t ? '2px solid var(--p)' : '1.5px solid var(--g200)', background: form.type === t ? cols[t] : '#fff', color: form.type === t ? 'var(--pd)' : 'var(--g500)', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>{t}</button>
              ))}
            </div>
          </div>
          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <FF label="Nombre Completo" name="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Tu nombre" />
            <FF label="Correo de Contacto" name="email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="correo@ejemplo.com" />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label className="fl">Descripción *</label>
            <textarea rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required placeholder="Describe tu solicitud..."
              style={{ width: '100%', padding: '12px 14px', border: '1.5px solid var(--g200)', borderRadius: 12, fontFamily: 'DM Sans', fontSize: 15, color: 'var(--g900)', background: '#fff', resize: 'vertical', outline: 'none' }} />
          </div>
          <button type="submit" className="bp" disabled={submitting} style={{ width: '100%', justifyContent: 'center', padding: 14, fontSize: 16, background: '#7c3aed' }}>
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
        <div style={{ background: 'var(--pd)', padding: '30px 32px 26px', textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, background: 'rgba(255,255,255,.1)', borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <Settings style={{ width: 24, height: 24, color: '#93c5fd' }} />
          </div>
          <h2 className="df" style={{ fontSize: 21, color: '#fff', marginBottom: 4 }}>Panel Administrativo</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.5)' }}>{NOMBRE_CLINICA}</p>
        </div>
        <form onSubmit={handleLogin} style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FF label="Correo electrónico" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="admin@clinica.com" />
          <FF label="Contraseña" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
          <button type="submit" className="bp" disabled={loading} style={{ justifyContent: 'center', padding: 13, fontSize: 15 }}>
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
function AdminDashboard({ appointments, pqrsList, docsList, isAdmin, setIsAdmin, showToast, setView }) {
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

  const statCards = [
    { l: 'Total Citas', v: appointments.length, bg: '#dbeafe', c: 'var(--p)' },
    { l: 'Activas', v: appointments.filter(a => a.status === 'Agendada').length, bg: '#dcfce7', c: '#166534' },
    { l: 'PQRS', v: pqrsList.length, bg: '#ede9fe', c: '#5b21b6' },
    { l: 'Canceladas', v: appointments.filter(a => a.status === 'Cancelada').length, bg: '#fee2e2', c: '#991b1b' },
  ];

  const tabs = [
    ['citas', `Citas (${appointments.length})`],
    ['horarios', 'Control Horarios'],
    ['pqrs', `PQRS (${pqrsList.length})`],
    ['documentos', `Documentos (${docsList.length})`],
    ['config', 'Configuración'],
  ];

  return (
    <div className="ai" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,var(--pd),var(--p))', borderRadius: 18, padding: '20px 26px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h2 className="df" style={{ fontSize: 22, color: '#fff', marginBottom: 3 }}>Panel de Administración</h2>
          <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 13 }}>{isAdmin.email}</p>
        </div>
        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 10, padding: '9px 16px', color: '#fff', fontFamily: 'DM Sans', fontWeight: 500, fontSize: 14, cursor: 'pointer' }}>
          <LogOut size={15}/> Cerrar Sesión
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12 }}>
        {statCards.map((s, i) => (
          <div key={i} className="card" style={{ padding: '16px 20px', background: s.bg, border: 'none' }}>
            <div className="df" style={{ fontSize: 28, fontWeight: 700, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 13, color: s.c, opacity: .8, fontWeight: 500 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '2px solid var(--g100)', display: 'flex', gap: 2, overflowX: 'auto' }}>
        {tabs.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 13, color: tab === k ? 'var(--p)' : 'var(--g500)', borderBottom: tab === k ? '2px solid var(--p)' : '2px solid transparent', marginBottom: -2, whiteSpace: 'nowrap' }}>{l}</button>
        ))}
      </div>

      <div className="card" style={{ padding: 24 }}>
        {tab === 'citas' && <TabCitas filtered={filtered} search={search} setSearch={setSearch} setManagingCita={setManagingCita} />}
        {tab === 'horarios' && <TabHorarios appointments={appointments} showToast={showToast} />}
        {tab === 'pqrs' && <TabPqrs pqrsList={pqrsList} />}
        {tab === 'documentos' && <TabDocumentos docsList={docsList} showToast={showToast} />}
        {tab === 'config' && <TabConfig isAdmin={isAdmin} />}
      </div>

      {managingCita && <GestionarCitaModal cita={managingCita} onClose={() => setManagingCita(null)} appointments={appointments} showToast={showToast} />}
    </div>
  );
}

// ── TAB: CITAS ──
function TabCitas({ filtered, search, setSearch, setManagingCita }) {
  return (
    <div>
      <div style={{ position: 'relative', maxWidth: 360, marginBottom: 16 }}>
        <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--g500)', width: 15, height: 15 }} />
        <input type="text" placeholder="Buscar paciente, documento..." value={search} onChange={e => setSearch(e.target.value)} className="fi" style={{ paddingLeft: 36, fontSize: 14 }} />
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--g50)' }}>
              {['Paciente','Especialidad','Fecha / Hora','Canal','Estado','Acción'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--g500)', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} style={{ borderTop: '1px solid var(--g100)' }}>
                <td data-label="Paciente" style={{ padding: '12px' }}>
                  <div style={{ fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--g500)' }}>CC {c.idNumber}</div>
                </td>
                <td data-label="Especialidad" style={{ padding: '12px', fontWeight: 500, color: 'var(--p)' }}>{c.specialty}</td>
                <td data-label="Fecha/Hora" style={{ padding: '12px' }}>
                  <div style={{ fontWeight: 600 }}>{c.date}</div>
                  <div style={{ fontSize: 12, color: 'var(--g500)' }}>{c.time}</div>
                </td>
                <td data-label="Canal" style={{ padding: '12px' }}>
                  <span className={`badge ${c.origen === 'telefono' ? 'by' : c.origen === 'whatsapp' ? 'bg' : 'bb'}`}>
                    {c.origen === 'telefono' ? '📞 Tel.' : c.origen === 'whatsapp' ? '💬 WA' : '🌐 Web'}
                  </span>
                </td>
                <td data-label="Estado" style={{ padding: '12px' }}>
                  <span className={`badge ${c.status === 'Cancelada' ? 'br' : c.status === 'Reagendada' ? 'bb' : 'bg'}`}>{c.status}</span>
                </td>
                <td data-label="Acción" style={{ padding: '12px' }}>
                  {c.status !== 'Cancelada' && (
                    <button onClick={() => setManagingCita(c)} style={{ padding: '5px 12px', borderRadius: 8, border: '1.5px solid var(--g200)', background: '#fff', color: 'var(--g700)', fontFamily: 'DM Sans', fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>Gestionar</button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--g500)' }}>No se encontraron citas.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── TAB: CONTROL HORARIOS ──
function TabHorarios({ appointments, showToast }) {
  const [form, setForm] = useState({ name: '', phone: '', specialty: '', date: '', time: '', origen: 'telefono' });
  const [submitting, setSubmitting] = useState(false);

  const horas = useMemo(() => getHorasDisponibles(form.date, form.specialty, appointments), [form.date, form.specialty, appointments]);
  const hoy = new Date().toISOString().split('T')[0];

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.time) return showToast('Selecciona una hora', 'error');
    setSubmitting(true);
    try {
      await addDoc(colRef('appointments'), {
        name: form.name,
        phone: form.phone,
        phoneCode: '+57',
        idNumber: 'N/A',
        email: 'N/A',
        country: 'Colombia',
        address: 'N/A',
        specialty: form.specialty,
        date: form.date,
        time: form.time,
        status: 'Agendada',
        origen: form.origen,
        createdAt: serverTimestamp()
      });
      showToast(`Cita registrada — ${form.time} bloqueada`);
      setForm({ name: '', phone: '', specialty: '', date: '', time: '', origen: 'telefono' });
    } catch { showToast('Error al registrar', 'error'); }
    finally { setSubmitting(false); }
  };

  // Horarios del día seleccionado
  const citasDelDia = form.date && form.specialty
    ? appointments.filter(a => a.date === form.date && a.specialty === form.specialty && a.status !== 'Cancelada')
    : [];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 24 }}>
      {/* Formulario */}
      <div>
        <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <PhoneCall size={18} style={{ color: 'var(--p)' }}/> Registrar Cita por Teléfono
        </h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FF label="Nombre del Paciente" name="name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="Nombre completo" />
          <FF label="Teléfono de Contacto" name="phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Número de contacto" />
          <div>
            <label className="fl">Origen *</label>
            <select value={form.origen} onChange={e => setForm({...form, origen: e.target.value})} className="fi">
              <option value="telefono">📞 Llamada telefónica</option>
              <option value="whatsapp">💬 WhatsApp</option>
              <option value="presencial">🏥 Presencial</option>
            </select>
          </div>
          <div>
            <label className="fl">Especialidad *</label>
            <select name="specialty" value={form.specialty} onChange={e => setForm({...form, specialty: e.target.value, time: ''})} required className="fi">
              <option value="">Seleccionar...</option>
              {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className="fl">Fecha *</label>
            <input type="date" value={form.date} min={hoy} onChange={e => setForm({...form, date: e.target.value, time: ''})} required className="fi" />
          </div>
          <div>
            <label className="fl">Hora *</label>
            <select value={form.time} onChange={e => setForm({...form, time: e.target.value})} disabled={!form.date || !form.specialty} required className="fi" style={{ opacity: (!form.date || !form.specialty) ? .5 : 1 }}>
              <option value="">Seleccionar hora...</option>
              {horas.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            {form.date && form.specialty && horas.length === 0 && <p style={{ fontSize: 12, color: 'var(--err)', marginTop: 4 }}>No hay horas disponibles.</p>}
          </div>
          <button type="submit" className="bp" disabled={submitting || !form.time} style={{ justifyContent: 'center', padding: 13 }}>
            {submitting ? 'Registrando...' : <><Lock size={15}/> Registrar y Bloquear Hora</>}
          </button>
        </form>
      </div>

      {/* Disponibilidad del día */}
      <div>
        <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={18} style={{ color: 'var(--p)' }}/> Disponibilidad del Día
        </h3>
        {!form.date || !form.specialty ? (
          <div style={{ background: 'var(--g50)', borderRadius: 14, padding: 24, textAlign: 'center', border: '1px dashed var(--g200)', color: 'var(--g500)', fontSize: 14 }}>
            Selecciona especialidad y fecha para ver disponibilidad
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 13, color: 'var(--g500)', marginBottom: 4 }}><strong>{form.specialty}</strong> — {form.date}</p>
            {HORARIOS_DISPONIBLES.map(h => {
              const cita = citasDelDia.find(c => c.time === h);
              const libre = !cita;
              return (
                <div key={h} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: libre ? '#f0fdf4' : '#fee2e2', border: `1px solid ${libre ? '#86efac' : '#fca5a5'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Clock size={14} style={{ color: libre ? 'var(--ok)' : 'var(--err)' }} />
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{h}</span>
                  </div>
                  <div style={{ fontSize: 13 }}>
                    {libre ? (
                      <span style={{ color: 'var(--ok)', fontWeight: 500 }}>Disponible</span>
                    ) : (
                      <span style={{ color: 'var(--err)', fontWeight: 500 }}>{cita.name} {cita.origen === 'telefono' ? '📞' : cita.origen === 'whatsapp' ? '💬' : '🌐'}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── TAB: PQRS ──
function TabPqrs({ pqrsList }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: 14 }}>
      {pqrsList.map(item => (
        <div key={item.id} style={{ border: '1.5px solid var(--g100)', borderRadius: 14, padding: 18, background: 'var(--g50)' }}>
          <span className="badge bb" style={{ marginBottom: 10 }}>{item.type}</span>
          <div style={{ fontWeight: 700, marginBottom: 3 }}>{item.name}</div>
          <div style={{ fontSize: 13, color: 'var(--p)', marginBottom: 10 }}>{item.email}</div>
          <p style={{ fontSize: 14, color: 'var(--g700)', lineHeight: 1.6, background: '#fff', padding: 12, borderRadius: 8, border: '1px solid var(--g100)' }}>{item.message}</p>
        </div>
      ))}
      {pqrsList.length === 0 && <p style={{ color: 'var(--g500)', gridColumn: '1/-1', textAlign: 'center', padding: 32 }}>No hay PQRS registradas.</p>}
    </div>
  );
}

// ── TAB: DOCUMENTOS (Google Drive) ──
function TabDocumentos({ docsList, showToast }) {
  const [form, setForm] = useState({ nombre: '', descripcion: '', enlace: '', tipo: 'PDF' });
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async e => {
    e.preventDefault();
    if (!form.enlace.startsWith('http')) return showToast('Ingresa un enlace válido', 'error');
    setSaving(true);
    try {
      await addDoc(colRef('documentos'), { ...form, createdAt: serverTimestamp() });
      showToast('Documento guardado');
      setForm({ nombre: '', descripcion: '', enlace: '', tipo: 'PDF' });
      setAdding(false);
    } catch { showToast('Error al guardar', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async id => {
    try {
      await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'documentos', id));
      showToast('Documento eliminado');
    } catch { showToast('Error al eliminar', 'error'); }
  };

  const tipoIcon = t => t === 'PDF' ? '📄' : t === 'Word' ? '📝' : t === 'Excel' ? '📊' : t === 'Imagen' ? '🖼️' : '🔗';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FolderOpen size={18} style={{ color: 'var(--p)' }}/> Bodega de Documentos
          </h3>
          <p style={{ fontSize: 13, color: 'var(--g500)', marginTop: 3 }}>Guarda enlaces de Google Drive para acceder a documentos</p>
        </div>
        <button className="bp" style={{ fontSize: 14, padding: '9px 18px' }} onClick={() => setAdding(!adding)}>
          <Plus size={15}/> Agregar Documento
        </button>
      </div>

      {/* Formulario agregar */}
      {adding && (
        <div style={{ background: 'var(--g50)', borderRadius: 14, padding: 20, border: '1px solid var(--g200)', marginBottom: 20 }}>
          <form onSubmit={handleSave}>
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14, marginBottom: 14 }}>
              <FF label="Nombre del Documento" name="nombre" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} required placeholder="Ej. Protocolo de Atención" />
              <div>
                <label className="fl">Tipo</label>
                <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} className="fi">
                  {['PDF','Word','Excel','Imagen','Otro'].map(t => <option key={t} value={t}>{tipoIcon(t)} {t}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <FF label="Enlace de Google Drive" name="enlace" value={form.enlace} onChange={e => setForm({...form, enlace: e.target.value})} required placeholder="https://drive.google.com/..." />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="fl">Descripción</label>
              <input className="fi" value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} placeholder="Descripción opcional..." />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="bs" type="button" onClick={() => setAdding(false)} style={{ fontSize: 14, padding: '9px 18px' }}>Cancelar</button>
              <button className="bp" type="submit" disabled={saving} style={{ fontSize: 14, padding: '9px 18px' }}>
                {saving ? 'Guardando...' : <><Link size={14}/> Guardar Enlace</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista documentos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
        {docsList.map(d => (
          <div key={d.id} style={{ border: '1.5px solid var(--g100)', borderRadius: 14, padding: 18, background: 'var(--g50)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: 28 }}>{tipoIcon(d.tipo)}</div>
              <button onClick={() => handleDelete(d.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fca5a5', padding: 4 }}>
                <Trash2 size={16}/>
              </button>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{d.nombre}</div>
              {d.descripcion && <p style={{ fontSize: 13, color: 'var(--g500)', lineHeight: 1.5 }}>{d.descripcion}</p>}
            </div>
            <a href={d.enlace} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', borderRadius: 10, background: 'var(--p)', color: '#fff', textDecoration: 'none', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 14, marginTop: 'auto' }}>
              <ExternalLink size={14}/> Abrir en Drive
            </a>
          </div>
        ))}
        {docsList.length === 0 && !adding && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: 'var(--g500)' }}>
            <FolderOpen size={40} style={{ marginBottom: 12, opacity: .4 }} />
            <p>No hay documentos guardados aún.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── TAB: CONFIGURACIÓN ──
function TabConfig({ isAdmin }) {
  return (
    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
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
      const phone = `${cita.phoneCode || ''}${cita.phone || ''}`.replace(/\D/g, '');
      let msg = '';
      if (type === 'cancel') {
        await updateDoc(ref, { status: 'Cancelada' });
        msg = `Hola ${cita.name}, su cita de ${cita.specialty} del ${cita.date} a las ${cita.time} ha sido CANCELADA.`;
      } else {
        await updateDoc(ref, { date: newDate, time: newTime, status: 'Reagendada' });
        msg = `Hola ${cita.name}, su cita de ${cita.specialty} ha sido REAGENDADA para el ${newDate} a las ${newTime}.`;
      }
      setDoneData({ link: phone ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}` : null });
      setMode('done');
      showToast(type === 'cancel' ? 'Cita cancelada' : 'Cita reagendada');
    } catch { showToast('Error al procesar', 'error'); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 60, backdropFilter: 'blur(4px)' }}>
      <div className="card su" style={{ width: '100%', maxWidth: 440, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 className="df" style={{ fontSize: 19, color: 'var(--pd)' }}>Gestionar Cita</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--g500)' }}><XCircle size={22}/></button>
        </div>
        <div style={{ background: 'var(--g50)', borderRadius: 12, padding: 14, border: '1px solid var(--g200)', marginBottom: 16, fontSize: 14, lineHeight: 1.7 }}>
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
            <p style={{ color: 'var(--g700)', marginBottom: 16, lineHeight: 1.6 }}>¿Confirmas cancelar esta cita?</p>
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
            <CheckCircle style={{ width: 40, height: 40, color: 'var(--ok)', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--g700)', marginBottom: 16, fontSize: 14 }}>Actualización guardada.</p>
            {doneData?.link && (
              <a href={doneData.link} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, background: '#22c55e', color: '#fff', borderRadius: 12, fontFamily: 'DM Sans', fontWeight: 600, textDecoration: 'none', marginBottom: 10 }}>
                <MessageSquare size={15}/> Notificar por WhatsApp
              </a>
            )}
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
    <footer style={{ background: 'var(--pd)', color: 'rgba(255,255,255,.65)', marginTop: 56 }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '40px 16px 22px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 32 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <HeartPulse style={{ width: 18, height: 18, color: '#93c5fd' }} />
            <span className="df" style={{ fontSize: 16, color: '#fff', fontWeight: 700 }}>{NOMBRE_CLINICA}</span>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.7 }}>Comprometidos con tu salud y bienestar.</p>
        </div>
        <div>
          <h4 style={{ color: '#fff', fontWeight: 600, marginBottom: 12, fontSize: 14 }}>Contacto</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: 14 }}>
            <a href={`tel:${CONTACTO.telefono}`} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,.7)', textDecoration: 'none' }}><Phone size={13} style={{ color: '#93c5fd' }}/>{CONTACTO.telefono}</a>
            <a href={`https://wa.me/${CONTACTO.whatsapp}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,.7)', textDecoration: 'none' }}><MessageSquare size={13} style={{ color: '#86efac' }}/>WhatsApp</a>
            <a href={`mailto:${CONTACTO.correo}`} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,.7)', textDecoration: 'none' }}><Mail size={13} style={{ color: '#93c5fd' }}/>{CONTACTO.correo}</a>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}><MapPin size={13} style={{ color: '#93c5fd', flexShrink: 0, marginTop: 2 }}/>{CONTACTO.direccion}</div>
          </div>
        </div>
        <div>
          <h4 style={{ color: '#fff', fontWeight: 600, marginBottom: 12, fontSize: 14 }}>Horario</h4>
          <div style={{ fontSize: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={13} style={{ color: '#93c5fd' }}/>{CONTACTO.horario}</div>
            <p style={{ fontSize: 13, marginTop: 6, lineHeight: 1.65 }}>Citas en línea las 24 horas.</p>
          </div>
        </div>
        <div>
          <h4 style={{ color: '#fff', fontWeight: 600, marginBottom: 12, fontSize: 14 }}>Servicios</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: 14 }}>
            {[['Agendar Cita','canal'],['Radicar PQRS','pqrs'],['Inicio','home']].map(([l,k]) => (
              <button key={k} onClick={() => onNavigate(k)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.7)', fontFamily: 'DM Sans', fontSize: 14, cursor: 'pointer', textAlign: 'left', padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ChevronRight size={12} style={{ color: '#93c5fd' }}/>{l}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', padding: '13px 16px', textAlign: 'center', fontSize: 13 }}>
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
function ST({ icon, title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
      <div style={{ width: 28, height: 28, background: 'var(--acc)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--g900)' }}>{title}</h3>
    </div>
  );
}
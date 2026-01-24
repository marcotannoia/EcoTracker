import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import PaginaAccesso from './pages/Login'; 
import PaginaRicerca from './pages/Ricerca'; 
import PaginaNuovoViaggio from './pages/NuovoViaggio'; 
import PaginaProfilo from './pages/Profilo'; 
import PaginaRiepilogo from './pages/Wrapped'; 
import Iridescence from './components/Iridescence'; 
import Dock from './components/Dock'; 
import './App.css'; 

const INDIRIZZO_API = 'https://ecotrack-86lj.onrender.com'; // come sempre sto nel baackedn

function ContenutoApp() {
  const [utenteLoggato, setUtenteLoggato] = useState(null);
  const [inCaricamento, setInCaricamento] = useState(true);
  const [tema, setTema] = useState(localStorage.getItem('theme') || 'dark');
  
  const naviga = useNavigate(); 
  const posizioneAttuale = useLocation();

  const alternaTema = () => {
    const nuovoTema = tema === 'light' ? 'dark' : 'light';
    setTema(nuovoTema);
    localStorage.setItem('theme', nuovoTema);
  };

  useEffect(() => {
    document.body.className = ''; 
    document.body.classList.add(`${tema}-mode`); 
  }, [tema]);


  const verificaSessione = async () => { // vedo se stava una sessione attiva
    try {
      const risp = await fetch(`${INDIRIZZO_API}/api/me`, { credentials: 'include' });
      const dati = await risp.json();
      if (dati.ok) setUtenteLoggato(dati);
    } catch (e) {
        console.error("Errore sessione");
    } finally { 
        setInCaricamento(false); 
    }
  };

  useEffect(() => { verificaSessione(); }, []);

  const eseguiLogout = async () => {
    await fetch(`${INDIRIZZO_API}/api/logout`, { method: 'POST' });
    setUtenteLoggato(null);
    naviga('/login'); // come sempre se faccio logout torno al login
  };

  const elementiMenu = [ // frontend
    {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>,
      label: 'Home',
      onClick: () => naviga('/')
    },
    {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
      label: 'Cerca',
      onClick: () => naviga('/cerca')
    },
    ...(utenteLoggato ? [{
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
      label: 'Profilo',
      onClick: () => naviga('/profilo')
    }] : []),
    {
      icon: tema === 'dark' 
        ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
        : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>,
      label: tema === 'dark' ? 'Chiaro' : 'Scuro',
      onClick: alternaTema
    },
    utenteLoggato ? {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" color="#ef4444"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
      label: 'Logout',
      onClick: eseguiLogout
    } : {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>,
      label: 'Login',
      onClick: () => naviga('/login')
    }
  ];

  if (inCaricamento) return <div style={{color:'white', padding:'20px'}}>Caricamento...</div>;

  return (
    <div className={`app-shell ${tema}-theme`}>
      <Iridescence color={[0.1, 0.3, 0.2]} mouseReact={false} amplitude={0.1} speed={0.2} />

      <main className="page-body" style={{ position: 'relative', zIndex: 1, paddingBottom: '100px' }}>
        <Routes>
          <Route path="/" element={<PaginaNuovoViaggio user={utenteLoggato} theme={tema} toggleTheme={alternaTema} />} />
          <Route path="/login" element={utenteLoggato ? <Navigate to="/" /> : <PaginaAccesso setUser={setUtenteLoggato} />} />
          <Route path="/cerca" element={utenteLoggato ? <PaginaRicerca user={utenteLoggato} /> : <Navigate to="/login" />} />
          <Route path="/profilo" element={utenteLoggato ? <PaginaProfilo user={utenteLoggato} setUser={setUtenteLoggato} /> : <Navigate to="/login" />} />
          
          <Route path="/wrapped/:username" element={utenteLoggato ? <PaginaRiepilogo /> : <Navigate to="/login" />} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <Dock items={elementiMenu} />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <ContenutoApp />
    </Router>
  );
}
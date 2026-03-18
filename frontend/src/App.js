import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';

// Importazione delle Pagine (assicurati che i file si chiamino esattamente così)
import Accesso from './pages/Accesso';
import NuovoViaggio from './pages/NuovoViaggio';
import StoricoCompleto from './pages/StoricoCompleto';
import Profilo from './pages/Profilo';
import Ricerca from './pages/Ricerca';
import Riepilogo from './pages/Riepilogo';

// Componente Navbar Globale
function NavbarMenu({ utente }) {
  const location = useLocation();
  
  // Non mostrare la navbar nella pagina di login
  if (location.pathname === '/login' || location.pathname === '/') return null;

  return (
    <nav className="fixed top-0 w-full bg-gray-900/90 backdrop-blur-md border-b border-gray-800 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/dashboard" className="text-2xl font-extrabold text-green-400 tracking-tight">
            EcoTrack
          </Link>
          <div className="flex space-x-6 text-sm font-medium text-gray-300">
            <Link to="/dashboard" className="hover:text-green-400 transition-colors">Nuovo Viaggio</Link>
            <Link to="/community" className="hover:text-green-400 transition-colors">Classifica</Link>
            
            {/* Link inattivi pronti per le future implementazioni AWS */}
            <span className="text-gray-600 cursor-not-allowed hidden md:inline" title="In arrivo con Amazon Rekognition">Smaltimento AI</span>
            <span className="text-gray-600 cursor-not-allowed hidden md:inline" title="In arrivo con Polygon">Badge NFT</span>
          </div>
          <div className="flex items-center">
            {utente ? (
              <Link to="/profilo" className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg hover:bg-green-500/30 font-bold transition-colors">
                {utente.username}
              </Link>
            ) : (
              <Link to="/login" className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700">Login</Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  // Gestione stato globale dell'utente loggato
  const [utenteLoggato, setUtenteLoggato] = useState(null);

  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white font-sans">
        <NavbarMenu utente={utenteLoggato} />
        
        {/* Il pt-16 serve per non far finire i contenuti sotto la Navbar fissa */}
        <div className="pt-16">
          <Routes>
            {/* Rotta di default: se non loggato va al login, altrimenti alla dashboard */}
            <Route path="/" element={utenteLoggato ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
            
            {/* Pagine Pubbliche / Auth */}
            <Route path="/login" element={
              utenteLoggato ? <Navigate to="/dashboard" /> : <Accesso setUser={setUtenteLoggato} />
            } />
            
            {/* Pagine Protette */}
            <Route path="/dashboard" element={<NuovoViaggio user={utenteLoggato} theme="dark" />} />
            <Route path="/storico" element={<StoricoCompleto />} />
            <Route path="/profilo" element={<Profilo user={utenteLoggato} setUser={setUtenteLoggato} />} />
            <Route path="/community" element={<Ricerca user={utenteLoggato} />} />
            <Route path="/wrapped/:username" element={<Riepilogo />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
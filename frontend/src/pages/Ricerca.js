import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const URL_BASE_API = 'https://api.ecotracker.it';
// const URL_BASE_API = 'http://localhost:5000'; // Usa questo per testare in locale

function PaginaRicerca({ user: utenteLoggato }) {
  const [listaUtenti, setListaUtenti] = useState([]);
  const [classifica, setClassifica] = useState([]); 
  const [testoRicerca, setTestoRicerca] = useState('');
  // const [inCaricamento, setInCaricamento] = useState(true); // Rimosso se non usato nella UI

  const naviga = useNavigate();

  useEffect(() => {
    caricaDati();
  }, []);

  const caricaDati = async () => {
    try {
      // IMPORTANTE: credentials: 'include'
      const rispUtenti = await fetch(`${URL_BASE_API}/api/utenti`, { credentials: 'include' });
      const datiUtenti = await rispUtenti.json();
      if (datiUtenti.ok) setListaUtenti(datiUtenti.utenti || []);

      const rispClassifica = await fetch(`${URL_BASE_API}/api/classifica`, { credentials: 'include' });
      const datiClassifica = await rispClassifica.json();
      if (datiClassifica.ok) setClassifica(datiClassifica.classifica || []);

    } catch (errore) {
      console.error("Errore caricamento ricerca:", errore);
    } 
    // finally { setInCaricamento(false); }
  };

  const utentiConsigliati = listaUtenti.filter(u => 
    utenteLoggato &&
    u.username !== utenteLoggato.username &&
    utenteLoggato.regione && u.regione && 
    u.regione.toLowerCase() === utenteLoggato.regione.toLowerCase()
  );

  const risultatiFiltrati = testoRicerca 
    ? listaUtenti.filter(u => 
        (utenteLoggato ? u.username !== utenteLoggato.username : true) &&
        u.username.toLowerCase().includes(testoRicerca.toLowerCase())
      )
    : [];

  const apriProfilo = (username) => {
    naviga(`/wrapped/${username}`);
  }; 

  const assegnaMedaglia = (posizione) => {
    if (posizione === 0) return "🥇";
    if (posizione === 1) return "🥈";
    if (posizione === 2) return "🥉";
    return `#${posizione + 1}`;
  };

  return (
    <div className="homesearch-page">
      <header className="hero-header fade-in">
        <h1 className="brand-title">EcoTrack</h1>
        <p className="brand-subtitle">Community & Classifica</p>
      </header>

     
    </div>
  );
}

export default PaginaRicerca;
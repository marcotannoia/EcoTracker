import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Ricerca.css';

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

      <main className="search-content fade-in">
        <div className="search-bar-container">
          <input 
            className="main-search-input"
            placeholder="Cerca un utente..."
            value={testoRicerca}
            onChange={(e) => setTestoRicerca(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>

        {!testoRicerca && (
          <>
             <section className="leaderboard-section">
              <div className="section-header">
                <span className="section-icon">🏆</span>
                <h3>EcoSavers</h3>
              </div>
              <div className="leaderboard-list">
                {classifica.length > 0 ? (
                  classifica.slice(0, 3).map((elemento, indice) => (
                    <div key={elemento.username} className={`rank-card rank-${indice + 1}`} onClick={() => apriProfilo(elemento.username)}>
                      <div className="rank-pos">{assegnaMedaglia(indice)}</div>
                      <div className="rank-info">
                        <h4>@{elemento.username}</h4>
                        <span className="rank-score">-{elemento.risparmio} kg CO₂</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-data-msg">Nessun dato in classifica.</p>
                )}
              </div>
            </section>
            
            {utentiConsigliati.length > 0 && (
              <section className="suggested-section">
                <div className="section-header">
                  <span className="section-icon">📍</span>
                  <h3>Vicino a te ({utenteLoggato?.regione})</h3>
                </div>
                <div className="cards-grid">
                  {utentiConsigliati.map(u => (
                    <div key={u.username} className="user-card suggested-card" onClick={() => apriProfilo(u.username)}>
                      <div className="card-avatar">{u.username.charAt(0).toUpperCase()}</div>
                      <div className="card-info">
                        <h4>@{u.username}</h4>
                        <span className="region-tag">{u.regione}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {testoRicerca && (
          <section className="results-section">
            <h3 className="section-title">Risultati</h3>
            <div className="cards-grid">
              {risultatiFiltrati.length > 0 ? (
                risultatiFiltrati.map(u => (
                  <div key={u.username} className="user-card" onClick={() => apriProfilo(u.username)}>
                    <div className="card-avatar simple">{u.username.charAt(0).toUpperCase()}</div>
                    <div className="card-info">
                      <h4>@{u.username}</h4>
                      {u.regione && <span className="region-mini">{u.regione}</span>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-results">Nessun utente trovato.</p>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default PaginaRicerca;
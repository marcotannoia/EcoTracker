import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Ricerca.css';

const URL_BASE_API = 'https://ecotrack-86lj.onrender.com';

function PaginaRicerca({ user: utenteLoggato }) {
  const [listaUtenti, setListaUtenti] = useState([]);
  const [classifica, setClassifica] = useState([]); 
  const [testoRicerca, setTestoRicerca] = useState('');
  const [inCaricamento, setInCaricamento] = useState(true);

  const naviga = useNavigate();

  useEffect(() => {
    caricaDati();
  }, []);

  const caricaDati = async () => {
    try {
      // 1. Caricamento Utenti
      const rispUtenti = await fetch(`${URL_BASE_API}/api/utenti`);
      const datiUtenti = await rispUtenti.json();
      if (datiUtenti.ok && Array.isArray(datiUtenti.utenti)) {
          setListaUtenti(datiUtenti.utenti);
      }

      // 2. Caricamento Classifica
      const rispClassifica = await fetch(`${URL_BASE_API}/api/classifica`);
      const datiClassifica = await rispClassifica.json();
      if (datiClassifica.ok && Array.isArray(datiClassifica.classifica)) {
          setClassifica(datiClassifica.classifica);
      }

    } catch (errore) {
      console.error("Errore durante il caricamento dati ricerca:", errore);
    } finally {
      setInCaricamento(false);
    }
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
    // HO CORRETTO LE EMOJI CHE ERANO CORROTTE NEL FILE ORIGINALE
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

        {inCaricamento ? (
            <p className="loading-msg">Caricamento in corso...</p>
        ) : (
        <>
            {!testoRicerca && (
            <>
                <section className="leaderboard-section">
                <div className="section-header">
                    <span className="section-icon">🏆</span>
                    <h3>EcoSavers - Top 10</h3>
                </div>

                <div className="leaderboard-list">
                    {classifica.length > 0 ? (
                    classifica.slice(0, 10).map((elemento, indice) => (
                        <div 
                        key={elemento.username} 
                        className={`rank-card rank-${indice + 1}`} 
                        onClick={() => apriProfilo(elemento.username)} 
                        style={{cursor: 'pointer'}}
                        >
                        <div className="rank-pos">{assegnaMedaglia(indice)}</div>
                        <div className="rank-info">
                            <h4>@{elemento.username}</h4>
                            <span className="rank-score">{elemento.risparmio} kg CO₂</span>
                        </div>
                        </div>
                    ))
                    ) : (
                    <p className="no-data-msg">Ancora nessun dato in classifica.</p>
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
                        <div 
                        key={u.username} 
                        className="user-card suggested-card" 
                        onClick={() => apriProfilo(u.username)}
                        >
                        <div className="card-avatar">
                            {u.username.charAt(0).toUpperCase()}
                        </div>
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
                    <div 
                        key={u.username} 
                        className="user-card" 
                        onClick={() => apriProfilo(u.username)}
                    >
                        <div className="card-avatar simple">
                        {u.username.charAt(0).toUpperCase()}
                        </div>
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
        </>
        )}

      </main>
    </div>
  );
}

export default PaginaRicerca;
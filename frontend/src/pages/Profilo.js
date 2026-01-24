import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import './Profilo.css';

const URL_SERVER = 'https://ecotrack-86lj.onrender.com';

function PaginaProfilo({ user: utenteLoggato, setUser: setUtenteLoggato }) {
  
  const [statistiche, setStatistiche] = useState({
    totaleViaggi: 0,
    totaleKm: 0,
    totaleCo2: 0,
    alberi: 0
  });

  const naviga = useNavigate();

  useEffect(() => {
    if (utenteLoggato) {
      calcolaStatistiche();
    }
  }, [utenteLoggato]);


  const calcolaStatistiche = async () => { 
    try {
      const risposta = await fetch(`${URL_SERVER}/api/storico`, { credentials: 'include' });
      const datiJson = await risposta.json(); 
      
      // FIX: Il backend ritorna { ok: true, viaggi: [...] }
      // Dobbiamo prendere .viaggi, non l'oggetto intero
      const listaViaggi = datiJson.viaggi || [];

      if (Array.isArray(listaViaggi)) {
        const CO2_AUTO_STANDARD = 0.120; // kg/km

        const sommaKm = listaViaggi.reduce((totale, viaggio) => {
          const kmViaggio = parseFloat(viaggio.km || 0);
          return totale + kmViaggio;
        }, 0);

        const sommaCo2Risparmiata = listaViaggi.reduce((totale, viaggio) => {
          const km = parseFloat(viaggio.km || 0);
          const co2EmessaReale = parseFloat(viaggio.co2 || 0);
          const co2SeFosseAuto = km * CO2_AUTO_STANDARD;
          let risparmioViaggio = co2SeFosseAuto - co2EmessaReale;
          if (risparmioViaggio < 0) risparmioViaggio = 0;
          return totale + risparmioViaggio;
        }, 0);

        setStatistiche({
          totaleViaggi: listaViaggi.length,
          totaleKm: sommaKm.toFixed(1),
          totaleCo2: sommaCo2Risparmiata.toFixed(1),
          alberi: (sommaCo2Risparmiata / 20).toFixed(1) 
        });
      }
    } catch (errore) {
      console.error("Impossibile recuperare lo storico:", errore);
    }
  };

  const eseguiLogout = async () => {
    try {
      await fetch(`${URL_SERVER}/api/logout`, { method: 'POST' });
      setUtenteLoggato(null); 
      naviga('/login');
    } catch (errore) {
      console.error("Errore logout", errore);
    }
  };

  const ottieniIniziale = () => {
    if (utenteLoggato?.username) return utenteLoggato.username.charAt(0).toUpperCase();
    return '?';
  };

  return (
    <div className="profile-page">
      <header className="hero-header fade-in">
        <h1 className="brand-title">EcoTrack</h1>
        <p className="brand-subtitle">IL TUO IMPATTO</p>
      </header>

      <main className="hero-content">
        <div className="profile-card-container">
          <div className="profile-card fade-in">
            <div className="profile-left-col">
              <div className="profile-avatar">{ottieniIniziale()}</div>
              <div className="profile-identity">
                <h2>@{utenteLoggato?.username}</h2>
                {utenteLoggato?.regione && (
                  <span className="region-badge">{utenteLoggato.regione}</span>
                )}
              </div>
              <div className="profile-actions">
                <button className="logout-btn" onClick={eseguiLogout}>Disconnettiti</button>
              </div>
            </div>

            <div className="profile-right-col">
              <h3 className="stats-title">Statistiche Generali</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-icon">🚀</span>
                  <div className="stat-info">
                    <span className="stat-value">{statistiche.totaleViaggi}</span>
                    <span className="stat-label">Viaggi Totali</span>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">🗺️</span>
                  <div className="stat-info">
                    <span className="stat-value">{statistiche.totaleKm}</span>
                    <span className="stat-label">Km Percorsi</span>
                  </div>
                </div>
                <div className="stat-item highlight-green">
                  <span className="stat-icon">🌱</span>
                  <div className="stat-info">
                    <span className="stat-value">{statistiche.totaleCo2} <small>kg</small></span>
                    <span className="stat-label">CO2 Risparmiata</span>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">🌳</span>
                  <div className="stat-info">
                    <span className="stat-value">{statistiche.alberi}</span>
                    <span className="stat-label">Alberi Equivalenti</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default PaginaProfilo;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import './Profilo.css';

const URL_SERVER = 'https://ecotrack-86lj.onrender.com';

function PaginaProfilo({ user: utenteLoggato, setUser: setUtenteLoggato }) {
  
// campi dashboardW
  const [statistiche, setStatistiche] = useState({
    totaleViaggi: 0,
    totaleKm: 0,
    totaleCo2: 0,
    alberi: 0
  });

  const naviga = useNavigate();
// carico le statistiche 
  useEffect(() => {
    if (utenteLoggato) {
      calcolaStatistiche();
    }
  }, [utenteLoggato]);


  const calcolaStatistiche = async () => { 
    try {
      const risposta = await fetch(`${URL_SERVER}/api/storico`, { credentials: 'include' });
      const storicoViaggi = await risposta.json(); 
      
      if (Array.isArray(storicoViaggi)) {
      
        const CO2_AUTO_STANDARD = 0.120; // kg/km

    
        const sommaKm = storicoViaggi.reduce((totale, viaggio) => {
          const kmViaggio = parseFloat(viaggio.km || viaggio.km_percorsi || viaggio.distanza || 0);
          return totale + kmViaggio;
        }, 0);

        const sommaCo2Risparmiata = storicoViaggi.reduce((totale, viaggio) => {
          const km = parseFloat(viaggio.km || viaggio.km_percorsi || viaggio.distanza || 0);
          const co2EmessaReale = parseFloat(viaggio.co2 || viaggio.emissioni_co2 || 0);
          const co2SeFosseAuto = km * CO2_AUTO_STANDARD;
          let risparmioViaggio = co2SeFosseAuto - co2EmessaReale;
          if (risparmioViaggio < 0) risparmioViaggio = 0;

          return totale + risparmioViaggio;
        }, 0);

        setStatistiche({
          totaleViaggi: storicoViaggi.length,
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
      naviga('/login');// ritorno al login
    } catch (errore) {
      console.error("Errore durante il logout:", errore); // errore generico
    }
  };


  const ottieniIniziale = () => { // serve per l'immagine profilo
    if (utenteLoggato?.nome) return utenteLoggato.nome.charAt(0).toUpperCase();
    if (utenteLoggato?.username) return utenteLoggato.username.charAt(0).toUpperCase();
    return '?';
  };

  return ( // frontend
    <div className="profile-page">
      
      <header className="hero-header fade-in">
        <h1 className="brand-title">EcoTrack</h1>
        <p className="brand-subtitle">IL TUO IMPATTO</p>
      </header>

      <main className="hero-content">
        <div className="profile-card-container">
          <div className="profile-card fade-in">
            
        
            <div className="profile-left-col">
              <div className="profile-avatar">
                {ottieniIniziale()}
              </div>
              
              <div className="profile-identity">
              
                <h2>
                  {(utenteLoggato?.nome && utenteLoggato?.cognome) 
                    ? `${utenteLoggato.nome} ${utenteLoggato.cognome}` 
                    : utenteLoggato?.username}
                </h2>
                
                
                {(utenteLoggato?.nome || utenteLoggato?.cognome) && (
                  <p className="username-tag">@{utenteLoggato?.username}</p>
                )}
                
                {utenteLoggato?.regione && (
                  <span className="region-badge">{utenteLoggato.regione}</span>
                )}
              </div>

              <div className="profile-actions">
                <button className="logout-btn" onClick={eseguiLogout}>
                  Disconnettiti
                </button>
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
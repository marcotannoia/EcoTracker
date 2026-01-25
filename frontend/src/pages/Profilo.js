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
  
  const [listaViaggi, setListaViaggi] = useState([]);
  const naviga = useNavigate();

  useEffect(() => {
    // Se non c'è l'utente nello stato di React, torniamo al login
    if (!utenteLoggato) {
       naviga('/login');
       return;
    }
    caricaDati();
  }, [utenteLoggato]);

  const caricaDati = async () => { 
    try {
      // credentials: 'include' è OBBLIGATORIO per passare il cookie di sessione
      const risposta = await fetch(`${URL_SERVER}/api/storico`, { credentials: 'include' });
      
      if (risposta.status === 401) {
          console.error("Sessione scaduta o cookie bloccato");
          // Opzionale: logout forzato se la sessione server è morta
          // setUtenteLoggato(null); 
          return;
      }

      const datiJson = await risposta.json(); 
      const viaggiRecuperati = datiJson.viaggi || [];
      setListaViaggi(viaggiRecuperati);

      if (Array.isArray(viaggiRecuperati)) {
        const CO2_AUTO_STANDARD = 0.120; // kg/km

        const sommaKm = viaggiRecuperati.reduce((totale, viaggio) => {
          return totale + parseFloat(viaggio.km || 0);
        }, 0);

        const sommaCo2Risparmiata = viaggiRecuperati.reduce((totale, viaggio) => {
          const km = parseFloat(viaggio.km || 0);
          const co2EmessaReale = parseFloat(viaggio.co2 || 0);
          
          const co2SeFosseAuto = km * CO2_AUTO_STANDARD;
          let risparmioViaggio = co2SeFosseAuto - co2EmessaReale;
          if (risparmioViaggio < 0) risparmioViaggio = 0;
          
          return totale + risparmioViaggio;
        }, 0);

        setStatistiche({
          totaleViaggi: viaggiRecuperati.length,
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
      await fetch(`${URL_SERVER}/api/logout`, { method: 'POST', credentials: 'include' });
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

              <div className="storico-recente-section">
                <h3 className="stats-title" style={{marginTop: '2rem'}}>Ultimi Viaggi</h3>
                {listaViaggi.length === 0 ? (
                  <p className="no-data-msg">Nessun viaggio registrato.</p>
                ) : (
                  <div className="lista-viaggi-mini">
                    {listaViaggi.slice(0, 5).map((viaggio, index) => (
                      <div key={index} className="viaggio-row">
                        <span className="viaggio-icona-mini">
                          {viaggio.mezzo === 'veicolo_elettrico' ? '⚡' : 
                           viaggio.mezzo === 'piedi' ? '👣' : '🚗'}
                        </span>
                        <div className="viaggio-dettagli">
                          <span className="viaggio-tratta">
                             {viaggio.partenza?.split(',')[0]} → {viaggio.arrivo?.split(',')[0]}
                          </span>
                          <span className="viaggio-data">{viaggio.data?.split(' ')[0]}</span>
                        </div>
                        <span className="viaggio-km">{parseFloat(viaggio.km).toFixed(1)} km</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default PaginaProfilo;
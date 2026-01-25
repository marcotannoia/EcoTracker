import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import './Profilo.css';

const URL_SERVER = 'https://api.ecotracker.it';

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
    if (!utenteLoggato) {
       naviga('/login');
       return;
    }
    caricaDati();
  }, [utenteLoggato]);

  const caricaDati = async () => { 
    try {
      const risposta = await fetch(`${URL_SERVER}/api/storico`, { credentials: 'include' });
      
      if (risposta.status === 401) {
          console.error("Sessione scaduta");
          return;
      }

      const datiJson = await risposta.json(); 
      const viaggiRecuperati = datiJson.viaggi || [];
      setListaViaggi(viaggiRecuperati);

      if (Array.isArray(viaggiRecuperati)) {
        const CO2_AUTO_STANDARD = 0.120;

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
            
            {/* SX: Profilo */}
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

            {/* DX: Dati */}
            <div className="profile-right-col">
              <h3 className="stats-title">Statistiche Generali</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-icon">🚀</span>
                  <span className="stat-value">{statistiche.totaleViaggi}</span>
                  <span className="stat-label">Viaggi Totali</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">🗺️</span>
                  <span className="stat-value">{statistiche.totaleKm}</span>
                  <span className="stat-label">Km Percorsi</span>
                </div>
                <div className="stat-item highlight-green">
                  <span className="stat-icon">🌱</span>
                  <span className="stat-value">
                    {statistiche.totaleCo2} <small>kg</small>
                  </span>
                  <span className="stat-label">CO2 Risparmiata</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">🌳</span>
                  <span className="stat-value">{statistiche.alberi}</span>
                  <span className="stat-label">Alberi Equivalenti</span>
                </div>
              </div>

              <div className="storico-recente-section">
                <div className="section-header-row">
                    <h3 className="stats-title">Ultimi Viaggi</h3>
                    {listaViaggi.length > 0 && (
                        <div className="view-all-link" onClick={() => naviga('/storico')}>
                            Vedi tutti →
                        </div>
                    )}
                </div>

                {listaViaggi.length === 0 ? (
                  <p className="no-data-msg">Nessun viaggio registrato ancora.</p>
                ) : (
                  <div className="lista-viaggi-container">
                    {listaViaggi.slice(0, 4).map((viaggio, index) => (
                      <div key={index} className="mini-trip-card">
                        <div className="mini-trip-icon">
                          {viaggio.mezzo === 'veicolo_elettrico' ? '⚡' : 
                           viaggio.mezzo === 'piedi' ? '👣' : 
                           viaggio.mezzo === 'bike' ? '🚲' : 
                           viaggio.mezzo === 'public_bus' ? '🚌' : '🚗'}
                        </div>
                        <div className="mini-trip-info">
                          <div className="mini-row-top">
                            <span className="mini-route">
                               {viaggio.partenza?.split(',')[0]} → {viaggio.arrivo?.split(',')[0]}
                            </span>
                          </div>
                          <div className="mini-row-bottom">
                            <span className="mini-date">
                               {viaggio.data?.split(' ')[0]}
                            </span>
                            <span className="mini-km-badge">
                              {parseFloat(viaggio.km).toFixed(1)} km
                            </span>
                          </div>
                        </div>
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
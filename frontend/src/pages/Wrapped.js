import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Wrapped.css'; 

const URL_SERVER = 'https://ecotrack-86lj.onrender.com';

const MAPPA_MEZZI = {
  "piedi": "A piedi",
  "bike": "Bicicletta",
  "car": "Auto",
  "public_bus": "Bus",
  "veicolo_elettrico": "Veicolo Elettrico",
  "Nessuno": "Nessuno"
};

function PaginaRiepilogo() {
  const { username: nomeUtente } = useParams(); 
  const naviga = useNavigate();
  
  const [datiRiepilogo, setDatiRiepilogo] = useState(null);
  const [inCaricamento, setInCaricamento] = useState(true);
  const [erroreCaricamento, setErroreCaricamento] = useState('');

  useEffect(() => {
    if (nomeUtente) {
      caricaDatiUtente();
    }
  }, [nomeUtente]);

  const caricaDatiUtente = async () => {
    try {
      const risposta = await fetch(`${URL_SERVER}/api/wrapped/${nomeUtente}`, { credentials: 'include' });
      const datiJson = await risposta.json();
      
      if (datiJson.ok && datiJson.dati) {
        setDatiRiepilogo(datiJson.dati);
      } else {
        setErroreCaricamento(datiJson.errore || "Profilo utente non trovato");
      }
    } catch (err) {
      setErroreCaricamento("Impossibile connettersi al server.");
    } finally {
      setInCaricamento(false);
    }
  };

  const stimaRisparmioCo2 = () => {
    if (!datiRiepilogo) return "0.0";
    const km = parseFloat(datiRiepilogo.km_totali || 0);
    const co2Emessa = parseFloat(datiRiepilogo.co2_risparmiata || 0); 
    const co2Auto = km * 0.120;
    
    const risparmio = co2Auto - co2Emessa;
    return risparmio > 0 ? risparmio.toFixed(1) : "0.0";
  };
  
  if (inCaricamento) return <div className="wrapped-loading">Caricamento...</div>;
  if (erroreCaricamento) return <div className="wrapped-error">{erroreCaricamento} <button onClick={() => naviga(-1)}>Indietro</button></div>;

  return (
    <div className="wrapped-page">
      <header className="hero-header fade-in">
        <h1 className="brand-title">EcoTrack</h1>
        <p className="brand-subtitle">Profilo Pubblico</p>
      </header>

      <main className="hero-content">
        <div className="wrapped-card-container">
          <div className="wrapped-card fade-in">
            <div className="wrapped-left-col">
              <div className="wrapped-avatar">{nomeUtente.charAt(0).toUpperCase()}</div>
              <div className="wrapped-identity">
                <h2>@{nomeUtente}</h2>
                <p className="member-since">Membro Community</p>
              </div>
              <button className="back-btn" onClick={() => naviga(-1)}>← Torna alla ricerca</button>
            </div>

            <div className="wrapped-right-col">
              <h3 className="stats-title">Riepilogo Attività</h3>
              <div className="stats-grid">
                
                {/* STRUTTURA CARD SEMPLIFICATA: ICONA - VALORE - LABEL */}
                <div className="stat-item">
                  <span className="stat-icon">🚀</span>
                  <span className="stat-value">{datiRiepilogo.viaggi_totali || 0}</span>
                  <span className="stat-label">Viaggi Totali</span>
                </div>

                <div className="stat-item">
                  <span className="stat-icon">🗺️</span>
                  <span className="stat-value">{datiRiepilogo.km_totali || 0}</span>
                  <span className="stat-label">Km Percorsi</span>
                </div>

                <div className="stat-item highlight-green">
                  <span className="stat-icon">🌱</span>
                  <span className="stat-value">
                    {stimaRisparmioCo2()} <small>kg</small>
                  </span>
                  <span className="stat-label">CO₂ Risparmiata</span>
                </div>

                <div className="stat-item">
                  <span className="stat-icon">❤️</span>
                  <span className="stat-value text-truncate">
                    {MAPPA_MEZZI[datiRiepilogo.mezzo_preferito] || "Nessuno"}
                  </span>
                  <span className="stat-label">Mezzo Preferito</span>
                </div>

              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default PaginaRiepilogo;
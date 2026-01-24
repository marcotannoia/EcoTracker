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
    caricaDatiUtente();
  }, [nomeUtente]);

  const caricaDatiUtente = async () => {
    try {
      const risposta = await fetch(`${URL_SERVER}/api/wrapped/${nomeUtente}`);
      const datiJson = await risposta.json();
      
      console.log("Dati Wrapped ricevuti:", datiJson); // Debug

      if (datiJson.ok && datiJson.dati) {
        setDatiRiepilogo(datiJson.dati);
      } else {
        setErroreCaricamento(datiJson.errore || "Profilo utente non trovato");
      }
    } catch (err) {
      console.error(err);
      setErroreCaricamento("Impossibile connettersi al server per recuperare i dati.");
    } finally {
      setInCaricamento(false);
    }
  };


  const stimaRisparmioCo2 = () => {
    if (!datiRiepilogo) return "0.0";
    
    // NOTA: Qui uso le variabili corrette dal backend (km_totali e co2_risparmiata)
    const emissioneAutoStandard = (datiRiepilogo.km_totali || 0) * 0.120;
    const co2Reale = datiRiepilogo.co2_risparmiata || 0; // In realtà questo campo nel DB è già il totale emesso o risparmiato?
    
    // Se 'co2_risparmiata' nel backend è già il netto, usiamo quello direttamente.
    // Assumo dal backend storico.py che 'co2_risparmiata' sia in realtà la somma della co2 emessa.
    // Quindi ricalcolo il risparmio qui per sicurezza:
    
    const risparmioNetto = emissioneAutoStandard - co2Reale;
    
    // Se invece storico.py calcolava già il risparmio, usa direttamente: datiRiepilogo.co2_risparmiata
    // Per ora uso il calcolo dinamico basato sui km:
    return risparmioNetto > 0 ? risparmioNetto.toFixed(1) : "0.0";
  };

  
  if (inCaricamento) {
    return <div className="wrapped-loading">Elaborazione statistiche in corso...</div>; 
  }

  if (erroreCaricamento) {
    return (
        <div className="wrapped-error">
            {erroreCaricamento} 
            <button onClick={() => naviga(-1)}>Torna alla ricerca</button>
        </div>
    );
  }

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
              <div className="wrapped-avatar">
                {nomeUtente ? nomeUtente.charAt(0).toUpperCase() : "?"}
              </div>
              <div className="wrapped-identity">
                <h2>@{nomeUtente}</h2>
                <p className="member-since">Membro della community</p>
              </div>
              
              <button className="back-btn" onClick={() => naviga(-1)}>
                ← Torna alla ricerca
              </button>
            </div>

            <div className="wrapped-right-col">
              <h3 className="stats-title">Riepilogo Attività</h3>
              
              <div className="stats-grid">
                
                <div className="stat-item">
                  <span className="stat-icon">🚀</span>
                  <div className="stat-info">
                    {/* CORRETTO: viaggi_totali invece di numero_viaggi */}
                    <span className="stat-value">{datiRiepilogo.viaggi_totali || 0}</span>
                    <span className="stat-label">Viaggi Totali</span>
                  </div>
                </div>

                <div className="stat-item">
                  <span className="stat-icon">🗺️</span>
                  <div className="stat-info">
                     {/* CORRETTO: km_totali invece di totale_km */}
                    <span className="stat-value">{datiRiepilogo.km_totali || 0}</span>
                    <span className="stat-label">Km Percorsi</span>
                  </div>
                </div>

                <div className="stat-item highlight-green">
                  <span className="stat-icon">🌱</span>
                  <div className="stat-info">
                    <span className="stat-value">{datiRiepilogo.co2_risparmiata || "0.0"} <small>kg</small></span>
                    <span className="stat-label">CO₂ Totale</span>
                  </div>
                </div>

                <div className="stat-item">
                  <span className="stat-icon">❤️</span>
                  <div className="stat-info">
                    <span className="stat-value text-truncate">
                      {MAPPA_MEZZI[datiRiepilogo.mezzo_preferito] || datiRiepilogo.mezzo_preferito || "Nessuno"}
                    </span>
                    <span className="stat-label">Mezzo Preferito</span>
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

export default PaginaRiepilogo;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Wrapped.css'; 

const URL_SERVER = 'http://localhost:5000';
const MAPPA_MEZZI = {
  "piedi": "A piedi",
  "bike": "Bicicletta",
  "car": "Auto",
  "public_bus": "Bus",
  "veicolo_elettrico": "Veicolo Elettrico"
};

function PaginaRiepilogo() {
  const { username: nomeUtente } = useParams(); 
  const naviga = useNavigate();
  
  // stati come smempre
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
      
      if (datiJson.ok) {
        setDatiRiepilogo(datiJson.dati);
      } else {
        setErroreCaricamento(datiJson.messaggio || "Profilo utente non trovato");
      }
    } catch (err) {
      console.error(err);
      setErroreCaricamento("Impossibile connettersi al server per recuperare i dati."); //errore genericco
    } finally {
      setInCaricamento(false); //caricato
    }
  };


  const stimaRisparmioCo2 = () => {
    if (!datiRiepilogo) return 0;

    const emissioneAutoStandard = datiRiepilogo.totale_km * 0.120;
    const risparmioNetto = emissioneAutoStandard - datiRiepilogo.totale_co2;
    
    return risparmioNetto > 0 ? risparmioNetto.toFixed(1) : "0.0"; // capisco effettivamente quano ha risparmiato
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

  return ( // frontend
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
                {nomeUtente.charAt(0).toUpperCase()}
              </div>
              <div className="wrapped-identity">
                <h2>@{nomeUtente}</h2>
                <p className="member-since">Membro dal {datiRiepilogo.data_inizio}</p>
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
                    <span className="stat-value">{datiRiepilogo.numero_viaggi}</span>
                    <span className="stat-label">Viaggi Totali</span>
                  </div>
                </div>


                <div className="stat-item">
                  <span className="stat-icon">🗺️</span>
                  <div className="stat-info">
                    <span className="stat-value">{datiRiepilogo.totale_km}</span>
                    <span className="stat-label">Km Percorsi</span>
                  </div>
                </div>

   
                <div className="stat-item highlight-green">
                  <span className="stat-icon">🌱</span>
                  <div className="stat-info">
                    <span className="stat-value">{stimaRisparmioCo2()} <small>kg</small></span>
                    <span className="stat-label">CO₂ Risparmiata</span>
                  </div>
                </div>

           
                <div className="stat-item">
                  <span className="stat-icon">❤️</span>
                  <div className="stat-info">
                    {/* 2. MODIFICA QUESTA RIGA */}
                    {/* Prima era: {datiRiepilogo.mezzo_preferito} */}
                    
                    <span className="stat-value text-truncate" title={MAPPA_MEZZI[datiRiepilogo.mezzo_preferito]}>
                      {MAPPA_MEZZI[datiRiepilogo.mezzo_preferito] || datiRiepilogo.mezzo_preferito}
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
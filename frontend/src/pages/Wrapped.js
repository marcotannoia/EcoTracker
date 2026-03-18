import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const URL_SERVER = 'https://api.ecotracker.it';

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
    </div>
  );
}

export default PaginaRiepilogo;
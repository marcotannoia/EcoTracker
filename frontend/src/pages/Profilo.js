import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 


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

    </div>
  );
}

export default PaginaProfilo;
import React, { useState } from 'react';

const URL_SERVER = 'https://api.ecotracker.it';

function PaginaAccesso({ setUser: impostaUtenteLoggato }) {
  
  const [datiInput, setDatiInput] = useState({ username: '', password: '', regione: '', email: '', codice: '' });
  
  // Stati
  const [modalitaRegistrazione, setModalitaRegistrazione] = useState(false);
  const [inAttesaDiCodice, setInAttesaDiCodice] = useState(false); 
  
  const [messaggioErrore, setMessaggioErrore] = useState('');
  const [messaggioSuccesso, setMessaggioSuccesso] = useState('');
  const [staCaricando, setStaCaricando] = useState(false);

  const gestisciAuth = async (e) => {
    e.preventDefault();
    setMessaggioErrore('');
    setMessaggioSuccesso('');
    setStaCaricando(true);

    let endpoint = '/api/login';
    if (modalitaRegistrazione) endpoint = '/api/registrati';

    try {
      const risposta = await fetch(`${URL_SERVER}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(datiInput)
      });
      
      const datiRisposta = await risposta.json();
      
      if (datiRisposta.ok) {
        // --- MODIFICA QUI ---
        // Se la registrazione è completa (bypass mail), torniamo al login
        if (datiRisposta.messaggio === "REGISTRAZIONE_COMPLETA") {
            setModalitaRegistrazione(false); 
            setMessaggioSuccesso("Account creato! Ora puoi accedere.");
            setDatiInput(prev => ({ ...prev, password: '' })); 
        } 
        else if (modalitaRegistrazione && !inAttesaDiCodice) {
          // Questo blocco non dovrebbe più scattare col nuovo backend, 
          // ma lo lasciamo per sicurezza.
          setInAttesaDiCodice(true);
        } 
        else {
          // Login effettuato con successo
          impostaUtenteLoggato(datiRisposta);
        }
      } else {
        setMessaggioErrore(datiRisposta.errore || "Si è verificato un errore.");
      }
    } catch (err) {
      console.error(err);
      setMessaggioErrore("Impossibile connettersi al server.");
    } finally {
      setStaCaricando(false);
    }
  };

  const aggiornaCampo = (campo, valore) => {
    if (messaggioErrore) setMessaggioErrore('');
    setDatiInput(prev => ({ ...prev, [campo]: valore }));
  };

  let titoloCard = 'Accedi';
  if (modalitaRegistrazione) titoloCard = 'Crea Account';

  return (
    <div className="login-page">
      <header className="hero-header fade-in">
        <h1 className="brand-title">EcoTrack</h1>
        <p className="brand-subtitle">Unisciti al cambiamento</p>
      </header>
    </div>
  );
}

export default PaginaAccesso;
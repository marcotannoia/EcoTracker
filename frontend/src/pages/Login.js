import React, { useState } from 'react';
import './Login.css';

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

      <main className="hero-content">
        <div className="search-card-container">
          <section className="main-search-card fade-in">
            <h2 className="card-title">{titoloCard}</h2>
            
            <form onSubmit={gestisciAuth} className="login-form-stack">
              
              <input 
                className="card-input" 
                placeholder="Username" 
                value={datiInput.username} 
                onChange={e => aggiornaCampo('username', e.target.value)} 
                required 
              />
              
              {modalitaRegistrazione && (
                <>
                  <input 
                    className="card-input" 
                    type="email" 
                    placeholder="Email" 
                    value={datiInput.email} 
                    onChange={e => aggiornaCampo('email', e.target.value)} 
                    required 
                  />
                  <input 
                    className="card-input" 
                    placeholder="Regione (es. Puglia)" 
                    value={datiInput.regione} 
                    onChange={e => aggiornaCampo('regione', e.target.value)} 
                    required 
                  />
                </>
              )}

              <input 
                className="card-input" 
                type="password" 
                placeholder="Password" 
                value={datiInput.password} 
                onChange={e => aggiornaCampo('password', e.target.value)} 
                required 
              />

              {/* MESSAGGI (Già posizionati correttamente sopra il bottone) */}
              {messaggioErrore && (
                <div className="login-error-box">⚠️ {messaggioErrore}</div>
              )}
              {messaggioSuccesso && (
                <div className="login-success-box">✅ {messaggioSuccesso}</div>
              )}

              <button className="cta-search-btn" disabled={staCaricando}>
                {staCaricando ? 'Attendi...' : (modalitaRegistrazione ? 'Registrati' : 'Accedi')}
              </button>
            </form>

            <div className="login-toggle-area">
              <p>{modalitaRegistrazione ? 'Hai già un account?' : 'Non hai un account?'}</p>
              <button 
                onClick={() => {
                  setModalitaRegistrazione(!modalitaRegistrazione);
                  setMessaggioErrore('');
                  setMessaggioSuccesso('');
                }} 
                className="toggle-link-btn"
              >
                {modalitaRegistrazione ? 'Vai al Login' : 'Registrati ora'}
              </button>
            </div>

          </section>
        </div>
      </main>
    </div>
  );
}

export default PaginaAccesso;
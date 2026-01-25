import React, { useState } from 'react';
import './Login.css';

// URL del tuo backend su Render
const URL_SERVER = 'https://ecotrack-86lj.onrender.com';

function PaginaAccesso({ setUser: impostaUtenteLoggato }) {
  
  const [datiInput, setDatiInput] = useState({ username: '', password: '', regione: '', email: '', codice: '' });
  
  // Stati per gestire Registrazione e Verifica
  const [modalitaRegistrazione, setModalitaRegistrazione] = useState(false);
  const [inAttesaDiCodice, setInAttesaDiCodice] = useState(false);
  
  const [messaggioErrore, setMessaggioErrore] = useState('');
  const [messaggioSuccesso, setMessaggioSuccesso] = useState('');

  const gestisciAuth = async (e) => {
    e.preventDefault();
    setMessaggioErrore('');
    setMessaggioSuccesso('');

    let endpoint = '/api/login';
    if (inAttesaDiCodice) endpoint = '/api/conferma';
    else if (modalitaRegistrazione) endpoint = '/api/registrati';

    try {
      const risposta = await fetch(`${URL_SERVER}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // FONDAMENTALE PER I COOKIE
        body: JSON.stringify(datiInput)
      });
      
      const datiRisposta = await risposta.json();
      
      if (datiRisposta.ok) {
        if (modalitaRegistrazione && !inAttesaDiCodice) {
          // Registrazione andata, ora verifica
          setInAttesaDiCodice(true);
          setMessaggioSuccesso("Controlla la mail e inserisci il codice.");
        } else if (inAttesaDiCodice) {
          // Verifica OK, ora login
          setInAttesaDiCodice(false);
          setModalitaRegistrazione(false);
          setMessaggioSuccesso("Account verificato! Accedi pure.");
        } else {
          // Login OK
          impostaUtenteLoggato(datiRisposta);
        }
      } else {
        setMessaggioErrore(datiRisposta.errore || datiRisposta.messaggio || "Errore generico.");
      }
    } catch (err) {
      console.error(err);
      setMessaggioErrore("Impossibile connettersi al server.");
    }
  };

  const aggiornaCampo = (campo, valore) => {
    setDatiInput(prev => ({ ...prev, [campo]: valore }));
  };

  let titoloCard = 'Accedi';
  if (inAttesaDiCodice) titoloCard = 'Verifica Email';
  else if (modalitaRegistrazione) titoloCard = 'Crea Account';

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
                disabled={inAttesaDiCodice} 
                required 
              />
              
              {modalitaRegistrazione && !inAttesaDiCodice && (
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

              {!inAttesaDiCodice && (
                <input 
                  className="card-input" 
                  type="password" 
                  placeholder="Password" 
                  value={datiInput.password} 
                  onChange={e => aggiornaCampo('password', e.target.value)} 
                  required 
                />
              )}

              {inAttesaDiCodice && (
                <input 
                  className="card-input" 
                  placeholder="Codice di Conferma" 
                  value={datiInput.codice} 
                  onChange={e => aggiornaCampo('codice', e.target.value)} 
                  required 
                />
              )}

              <button className="cta-search-btn">
                {inAttesaDiCodice ? 'Conferma Codice' : (modalitaRegistrazione ? 'Registrati' : 'Accedi')}
              </button>
            </form>

            {messaggioErrore && <div className="login-error-box">{messaggioErrore}</div>}
            {messaggioSuccesso && <div className="login-success-box">{messaggioSuccesso}</div>}

            {!inAttesaDiCodice && (
              <div className="login-toggle-area">
                <p>{modalitaRegistrazione ? 'Hai già un account?' : 'Non hai un account?'}</p>
                <button 
                  onClick={() => {
                    setModalitaRegistrazione(!modalitaRegistrazione);
                    setMessaggioErrore('');
                  }} 
                  className="toggle-link-btn"
                >
                  {modalitaRegistrazione ? 'Vai al Login' : 'Registrati ora'}
                </button>
              </div>
            )}

          </section>
        </div>
      </main>
    </div>
  );
}

export default PaginaAccesso;
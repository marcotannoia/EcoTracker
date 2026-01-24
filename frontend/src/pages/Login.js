import React, { useState } from 'react';
import './Login.css';

const URL_SERVER = 'http://localhost:5000';

function PaginaAccesso({ setUser: impostaUtenteLoggato }) {
  
  const [datiInput, setDatiInput] = useState({ username: '', password: '', regione: '', email: '', codice: '' });
  
  // Stati: Registrazione -> (Verifica) -> Login
  const [modalitaRegistrazione, setModalitaRegistrazione] = useState(false);
  const [inAttesaDiCodice, setInAttesaDiCodice] = useState(false); // NUOVO STATO
  
  const [messaggioErrore, setMessaggioErrore] = useState('');
  const [messaggioSuccesso, setMessaggioSuccesso] = useState('');

  const gestisciAuth = async (e) => {
    e.preventDefault();
    setMessaggioErrore('');
    setMessaggioSuccesso('');

    // Determina quale API chiamare
    let endpoint = '/api/login';
    if (inAttesaDiCodice) endpoint = '/api/conferma';
    else if (modalitaRegistrazione) endpoint = '/api/registrati';

    try {
      const risposta = await fetch(`${URL_SERVER}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(datiInput)
      });
      
      const datiRisposta = await risposta.json();
      
      if (datiRisposta.ok) {
        if (modalitaRegistrazione && !inAttesaDiCodice) {
          // 1. Registrazione OK -> Passa alla verifica codice
          setInAttesaDiCodice(true);
          setMessaggioSuccesso("Controlla la mail e inserisci il codice.");
        } else if (inAttesaDiCodice) {
          // 2. Verifica OK -> Torna al Login
          setInAttesaDiCodice(false);
          setModalitaRegistrazione(false);
          setMessaggioSuccesso("Account verificato! Accedi pure.");
        } else {
          // 3. Login OK
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

  // Determina il titolo della Card
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
              
              {/* CAMPO USERNAME: Sempre visibile tranne se ho già fatto login (che qui non c'è) */}
              <input 
                className="card-input" 
                placeholder="Username" 
                value={datiInput.username} 
                onChange={e => aggiornaCampo('username', e.target.value)} 
                disabled={inAttesaDiCodice} // Blocco username in fase di verifica
                required 
              />
              
              {/* CAMPI REGISTRAZIONE */}
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

              {/* CAMPO PASSWORD: Non serve in fase di verifica codice */}
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

              {/* NUOVO CAMPO CODICE: Visibile solo in fase verifica */}
              {inAttesaDiCodice && (
                <input 
                  className="card-input" 
                  placeholder="Codice di Conferma (es. 123456)" 
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

            {/* Link Toggle: Nascondi se stiamo verificando il codice */}
            {!inAttesaDiCodice && (
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
            )}

          </section>
        </div>
      </main>
    </div>
  );
}

export default PaginaAccesso;
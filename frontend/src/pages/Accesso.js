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
        if (datiRisposta.messaggio === "REGISTRAZIONE_COMPLETA") {
            setModalitaRegistrazione(false); 
            setMessaggioSuccesso("Account creato! Ora puoi accedere.");
            setDatiInput(prev => ({ ...prev, password: '' })); 
        } 
        else if (modalitaRegistrazione && !inAttesaDiCodice) {
          setInAttesaDiCodice(true);
        } 
        else {
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

  let titoloCard = modalitaRegistrazione ? 'Crea Account' : 'Accedi';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <header className="mb-8 text-center">
        <h1 className="text-5xl font-extrabold text-green-400 tracking-tight">EcoTrack</h1>
        <p className="text-gray-400 mt-2 text-lg">Unisciti al cambiamento</p>
      </header>

      <div className="bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-center">{titoloCard}</h2>

        {messaggioErrore && <div className="bg-red-500/10 text-red-400 p-3 rounded mb-4 text-sm text-center border border-red-500/20">{messaggioErrore}</div>}
        {messaggioSuccesso && <div className="bg-green-500/10 text-green-400 p-3 rounded mb-4 text-sm text-center border border-green-500/20">{messaggioSuccesso}</div>}

        <form onSubmit={gestisciAuth} className="space-y-4">
          <input 
            type="text" 
            placeholder="Username" 
            className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none transition-colors"
            value={datiInput.username} 
            onChange={(e) => aggiornaCampo('username', e.target.value)} 
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none transition-colors"
            value={datiInput.password} 
            onChange={(e) => aggiornaCampo('password', e.target.value)} 
          />
          <button 
            type="submit" 
            disabled={staCaricando}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {staCaricando ? 'Caricamento...' : (modalitaRegistrazione ? 'Registrati' : 'Entra')}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-400 text-sm">
          {modalitaRegistrazione ? 'Hai già un account?' : 'Non hai un account?'}
          <button 
            className="text-green-400 hover:underline ml-2"
            onClick={() => setModalitaRegistrazione(!modalitaRegistrazione)}
          >
            {modalitaRegistrazione ? 'Accedi qui' : 'Registrati ora'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default PaginaAccesso;